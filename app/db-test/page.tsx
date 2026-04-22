import { getAllJourneysFromDb } from "@/lib/data/db-journeys";

export default async function DbTestPage() {
  const journeys = await getAllJourneysFromDb();

  return (
    <main className="min-h-screen p-6">
      <div className="pt-8">
        <p className="text-sm text-neutral-500">Database test</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
          Supabase journeys
        </h1>

        <div className="mt-6 space-y-4">
          {journeys.map((journey) => (
            <div
              key={journey.id}
              className="rounded-2xl border border-neutral-200 bg-white p-4"
            >
              <p className="text-sm text-neutral-500">{journey.id}</p>
              <h2 className="mt-1 text-lg font-semibold text-neutral-900">
                {journey.surahName}
              </h2>
              <p className="mt-2 text-sm text-neutral-700">
                segments: {journey.segments.length}
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                color: {journey.cardColor ?? "none"}
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                art: {journey.artImage ?? "none"}
              </p>
            </div>
          ))}

          {journeys.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
              No journeys returned. That usually means either the tables are
              empty or read policies are missing.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}