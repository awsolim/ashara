import { notFound } from "next/navigation";
import SessionClient from "@/components/session/SessionClient";
import {
  getJourneyForSegmentIdFromDb,
  getSegmentByIdFromDb,
} from "@/lib/data/db-journeys";
import { getVerses } from "@/lib/quran";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const segment = await getSegmentByIdFromDb(id);
  const journey = await getJourneyForSegmentIdFromDb(id);

  if (!segment || !journey) {
    notFound();
  }

  if (
    typeof segment.surahNumber !== "number" ||
    typeof segment.ayahStart !== "number" ||
    typeof segment.ayahEnd !== "number"
  ) {
    throw new Error(
      `Segment ${segment.id} is missing surahNumber/ayahStart/ayahEnd`
    );
  }

  const ayahs = await getVerses(
    segment.surahNumber,
    segment.ayahStart,
    segment.ayahEnd
  );

  const segmentWithApiText = {
    ...segment,
    ayahs,
    arabic: ayahs.map((ayah) => ayah.arabic).join(" "),
    translation: ayahs.map((ayah) => ayah.translation).join(" "),
  };

  return <SessionClient journeyId={journey.id} segment={segmentWithApiText} />;
}