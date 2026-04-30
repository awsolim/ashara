// lib/quran.ts

type Verse = {
  number: number;
  arabic: string;
  translation: string;
  tafsir: string;
  audioUrl: string;
};

let cachedToken: {
  access_token: string;
  expires_at: number;
} | null = null;

async function getAccessToken(): Promise<string | null> {
  if (process.env.QF_USE_AUTH !== "true") return null;

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

function getHeaders(token: string | null): HeadersInit | undefined {
  return token
    ? {
        "x-auth-token": token,
        "x-client-id": process.env.QF_CLIENT_ID!,
      }
    : undefined;
}

function cleanText(text: string): string {
  return text
    .replace(/<sup[^>]*>.*?<\/sup>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAudioUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `https://verses.quran.com/${url.replace(/^\/+/, "")}`;
}

async function getAudioByChapter(
  token: string | null,
  baseUrl: string,
  surahNumber: number
) {
  const recitationId = process.env.QF_RECITATION_ID;
  if (!recitationId) return new Map<string, string>();

  const url = `${baseUrl}/recitations/${recitationId}/by_chapter/${surahNumber}?fields=verse_key,url&per_page=300`;

  const res = await fetch(url, {
    headers: getHeaders(token),
    next: { revalidate: 60 * 60 },
  });

  if (!res.ok) return new Map<string, string>();

  const data = await res.json();
  const map = new Map<string, string>();

  for (const audio of data.audio_files ?? []) {
    if (audio.verse_key && audio.url) {
      map.set(audio.verse_key, normalizeAudioUrl(audio.url));
    }
  }

  return map;
}

async function getTafsirByChapter(
  token: string | null,
  baseUrl: string,
  surahNumber: number
) {
  const tafsirId = process.env.QF_TAFSIR_ID;
  if (!tafsirId) return new Map<string, string>();

  const url = `${baseUrl}/tafsirs/${tafsirId}/by_chapter/${surahNumber}?fields=verse_key,text&per_page=50`;

  async function fetchTafsir(activeToken: string | null) {
    return fetch(url, {
      headers: getHeaders(activeToken),
      next: { revalidate: 60 * 60 },
    });
  }
  let res = await fetchTafsir(token);

  if (res.status === 401 || res.status === 403) {
    cachedToken = null;
    const freshToken = await getAccessToken();
    res = await fetchTafsir(freshToken);
  }

  if (!res.ok) {
    console.log("TAFSIR ERROR:", res.status, await res.text());
    return new Map<string, string>();
  }

  const data = await res.json();
  console.log("TAFSIR RESPONSE:", JSON.stringify(data, null, 2));

  const map = new Map<string, string>();
  const tafsirItems = data.tafsirs ?? data.tafsir ?? [];

  for (const item of tafsirItems) {
    if (item.verse_key && item.text) {
      map.set(item.verse_key, cleanText(item.text));
    }
  }

  return map;
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

  const versesUrl = `${baseUrl}/verses/by_chapter/${surahNumber}?translations=20&fields=text_uthmani,verse_key,verse_number&per_page=300`;

  const [versesRes, audioMap, tafsirMap] = await Promise.all([
    fetch(versesUrl, {
      headers: getHeaders(token),
      next: { revalidate: 60 * 60 },
    }),
    getAudioByChapter(token, baseUrl, surahNumber),
    getTafsirByChapter(token, baseUrl, surahNumber),
  ]);

  if (!versesRes.ok) {
    const errorText = await versesRes.text();
    throw new Error(
      `Failed to fetch Quran verses. Status: ${versesRes.status}. Response: ${errorText}`
    );
  }

  const data = await versesRes.json();

  return data.verses
    .filter(
      (ayah: any) =>
        ayah.verse_number >= ayahStart && ayah.verse_number <= ayahEnd
    )
    .map((ayah: any) => {
      const verseKey = ayah.verse_key ?? `${surahNumber}:${ayah.verse_number}`;

      return {
        number: ayah.verse_number,
        arabic: ayah.text_uthmani ?? "",
        translation: cleanText(ayah.translations?.[0]?.text ?? ""),
        tafsir: tafsirMap.get(verseKey) ?? "",
        audioUrl: audioMap.get(verseKey) ?? "",
      };
    });
}