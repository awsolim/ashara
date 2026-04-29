export type QuranAyah = {
  number: number;
  arabic: string;
  translation: string;
};

export async function getAyahRange(params: {
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
}): Promise<QuranAyah[]> {
  const { surahNumber, ayahStart, ayahEnd } = params;

  const results: QuranAyah[] = [];

  for (let ayah = ayahStart; ayah <= ayahEnd; ayah += 1) {
    const arabicRes = await fetch(
      `YOUR_API_ENDPOINT_FOR_ARABIC_HERE`,
      { cache: "force-cache" }
    );
    const translationRes = await fetch(
      `YOUR_API_ENDPOINT_FOR_TRANSLATION_HERE`,
      { cache: "force-cache" }
    );

    // map responses into:
    results.push({
      number: ayah,
      arabic: "",
      translation: "",
    });
  }

  return results;
}