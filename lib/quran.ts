// lib/quran.ts

import { createClient } from "@supabase/supabase-js";

type Verse = {
  number: number;
  arabic: string;
  translation: string;
  explanation: string;
  tafsir: string; // kept so old UI code does not break yet
  audioUrl: string;
};

type AyahExplanationRow = {
  surah_number: number;
  ayah_number: number;
  text: string;
};

type QfTafsirItem = {
  text: string;
  verse_key: string;
  chapter_id?: number;
  verse_number?: number;
};

type QfTafsirResponse = {
  tafsirs?: QfTafsirItem[];
  tafsir?: QfTafsirItem[];
  pagination?: {
    current_page: number;
    next_page: number | null;
    total_pages: number;
  };
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
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAudioUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `https://verses.quran.com/${url.replace(/^\/+/, "")}`;
}

function getSupabaseForExplanations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars for ayah explanations");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

async function getStoredExplanationsRange(
  surahNumber: number,
  ayahStart: number,
  ayahEnd: number
): Promise<Map<number, string>> {
  const supabase = getSupabaseForExplanations();

  const { data, error } = await supabase
    .from("ayah_explanations")
    .select("surah_number, ayah_number, text")
    .eq("surah_number", surahNumber)
    .gte("ayah_number", ayahStart)
    .lte("ayah_number", ayahEnd)
    .order("ayah_number", { ascending: true });

  if (error) {
    console.error("Failed to fetch ayah explanations:", error);
    return new Map();
  }

  const map = new Map<number, string>();

  for (const row of (data ?? []) as AyahExplanationRow[]) {
    map.set(row.ayah_number, row.text);
  }

  return map;
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

// This is for internal content work only.
// It fetches Arabic Jalalayn from QF so we can rewrite it into Ashara explanations.
export async function getArabicJalalaynTafsirRange(
  surahNumber: number,
  ayahStart: number,
  ayahEnd: number
): Promise<Record<number, string>> {
  const token = await getAccessToken();
  const baseUrl = process.env.QF_BASE_URL;

  if (!baseUrl) {
    throw new Error("Missing QF_BASE_URL env var");
  }

  const tafsirId = "926";
  const tafsirByAyah: Record<number, string> = {};
  let page = 1;

  while (true) {
    const url =
      `${baseUrl}/tafsirs/${tafsirId}/by_chapter/${surahNumber}` +
      `?fields=chapter_id,verse_number,verse_key,text&page=${page}&per_page=50`;

    const res = await fetch(url, {
      headers: getHeaders(token),
      next: { revalidate: 60 * 60 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Failed to fetch Arabic Jalalayn tafsir. Status: ${res.status}. Response: ${errorText}`
      );
    }

    const data: QfTafsirResponse = await res.json();
    const items = data.tafsirs ?? data.tafsir ?? [];

    for (const item of items) {
      const verseNumber =
        item.verse_number ?? Number(item.verse_key?.split(":")[1]);

      if (
        verseNumber >= ayahStart &&
        verseNumber <= ayahEnd &&
        item.text
      ) {
        tafsirByAyah[verseNumber] = cleanText(item.text);
      }
    }

    const nextPage = data.pagination?.next_page;
    if (!nextPage) break;

    const highestVerseOnPage = Math.max(
      ...items.map((item) => item.verse_number ?? Number(item.verse_key?.split(":")[1]))
    );

    if (highestVerseOnPage >= ayahEnd) break;

    page = nextPage;
  }

  return tafsirByAyah;
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

  const [versesRes, audioMap, explanationMap] = await Promise.all([
    fetch(versesUrl, {
      headers: getHeaders(token),
      next: { revalidate: 60 * 60 },
    }),
    getAudioByChapter(token, baseUrl, surahNumber),
    getStoredExplanationsRange(surahNumber, ayahStart, ayahEnd),
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
      const explanation =
        explanationMap.get(ayah.verse_number) ?? "Explanation coming soon.";

      return {
        number: ayah.verse_number,
        arabic: ayah.text_uthmani ?? "",
        translation: cleanText(ayah.translations?.[0]?.text ?? ""),
        explanation,
        tafsir: explanation,
        audioUrl: audioMap.get(verseKey) ?? "",
      };
    });
}