import { notFound } from "next/navigation";
import SessionClient from "@/components/session/SessionClient";
import {
  getJourneyForSegmentIdFromDb,
  getSegmentByIdFromDb,
} from "@/lib/data/db-journeys";

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
return <SessionClient journeyId={journey.id} segment={segment} />;
}