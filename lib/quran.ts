// lib/quran.ts

type Verse = {
  number: number;
  arabic: string;
  translation: string;
};

let cachedToken: {
  access_token: string;
  expires_at: number;
} | null = null;

async function getAccessToken(): Promise<string | null> {
  if (process.env.QF_USE_AUTH !== "true") {
    return null;
  }

  const now = Date.now();

  if (cachedToken && cachedToken.expires_at > now) {
    return cachedToken.access_token;
  }

  if (
    !process.env.QF_AUTH_URL ||
    !process.env.QF_CLIENT_ID ||
    !process.env.QF_CLIENT_SECRET
  ) {
    throw new Error("Missing Quran Foundation auth env vars");
  }

  const body = new URLSearchParams({
  grant_type: "client_credentials",
  scope: "content",
});

const basicAuth = Buffer.from(
  `${process.env.QF_CLIENT_ID}:${process.env.QF_CLIENT_SECRET}`
).toString("base64");

const res = await fetch(process.env.QF_AUTH_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${basicAuth}`,
  },
  body,
  cache: "no-store",
});

  if (!res.ok) {
    const errorText = await res.text();

    throw new Error(
      `Failed to fetch QF access token. Status: ${res.status}. Response: ${errorText}`
    );
  }

  const data = await res.json();
  
  

  cachedToken = {
    access_token: data.access_token,
    expires_at: now + data.expires_in * 1000 - 10_000,
  };

  return cachedToken.access_token;
}

function cleanTranslation(text: string): string {
  return text
    .replace(/<sup[^>]*>.*?<\/sup>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getVerses(
  surahNumber: number,
  ayahStart: number,
  ayahEnd: number
): Promise<Verse[]> {
  const token = await getAccessToken();

  const baseUrl = process.env.QF_BASE_URL;

  if (!baseUrl) {
    throw new Error("Missing QF_BASE_URL env var");
  }

  const url = `${baseUrl}/verses/by_chapter/${surahNumber}?translations=20&fields=text_uthmani,verse_key,verse_number&per_page=50`;

  console.log("Quran API URL:", url);

  const res = await fetch(url, {
    headers: token
      ? {
          "x-auth-token": token,
          "x-client-id": process.env.QF_CLIENT_ID!,
        }
      : undefined,
    next: {
      revalidate: 60 * 60,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();

    throw new Error(
      `Failed to fetch Quran verses. Status: ${res.status}. Response: ${errorText}`
    );
  }

  const data = await res.json();

  console.log("RAW QF VERSES RESPONSE:", JSON.stringify(data, null, 2));

  return data.verses
    .filter(
      (ayah: any) =>
        ayah.verse_number >= ayahStart && ayah.verse_number <= ayahEnd
    )
    .map((ayah: any) => ({
      number: ayah.verse_number,
      arabic: ayah.text_uthmani ?? "",
      translation: cleanTranslation(ayah.translations?.[0]?.text ?? ""),
    }));
}