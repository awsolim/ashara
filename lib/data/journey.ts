import { journeys, getJourneyById } from "./journeys";

export function getSelectedJourney() {
  if (typeof window === "undefined") return journeys[0];

  const selectedJourneyId =
    localStorage.getItem("ashara_selected_journey_id") ?? journeys[0].id;

  return getJourneyById(selectedJourneyId) ?? journeys[0];
}

export function getCompletedSegmentIds(journeyId: string) {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(`ashara_completed_segments_${journeyId}`);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function getCurrentSegment(
  journeyId: string,
  completedSegmentIds: string[]
) {
  const journey = getJourneyById(journeyId);

  if (!journey) return null;

  return (
    journey.segments.find(
      (segment) => !completedSegmentIds.includes(segment.id)
    ) ?? null
  );
}

export function getJourneyProgressPercent(
  journeyId: string,
  completedSegmentIds: string[]
) {
  const journey = getJourneyById(journeyId);

  if (!journey || journey.segments.length === 0) return 0;

  return Math.round(
    (completedSegmentIds.length / journey.segments.length) * 100
  );
}