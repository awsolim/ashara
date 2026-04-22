import SessionClient from "@/components/session/SessionClient";
import { getJourneyForSegmentId, getSegmentById } from "@/lib/data/journeys";

type SessionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  const segment = getSegmentById(id);
  const journey = getJourneyForSegmentId(id);

  if (!segment || !journey) {
    return (
      <main className="min-h-screen p-6">
        <div className="pt-8">
          <p className="text-sm text-neutral-500">Lesson</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
            Lesson not found
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            This lesson segment could not be found.
          </p>
        </div>
      </main>
    );
  }

  return <SessionClient segment={segment} journeyId={journey.id} />;
}