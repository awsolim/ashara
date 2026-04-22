import { getAllJourneys } from "./journeys";

const SELECTED_JOURNEY_KEY = "ashara_selected_journey_id";

export function getCompletedSegmentIds(journeyId: string) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(
      `ashara_completed_segments_${journeyId}`
    );
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function getJourneyProgressPercent(
  journeyId: string,
  completedSegmentIds: string[]
) {
  const journey = getAllJourneys().find((item) => item.id === journeyId);

  if (!journey || journey.segments.length === 0) return 0;

  return Math.round((completedSegmentIds.length / journey.segments.length) * 100);
}

export function getCurrentSegment(
  journeyId: string,
  completedSegmentIds: string[]
) {
  const journey = getAllJourneys().find((item) => item.id === journeyId);

  if (!journey || journey.segments.length === 0) return null;

  const nextSegment = journey.segments.find(
    (segment) => !completedSegmentIds.includes(segment.id)
  );

  return nextSegment ?? null;
}

export function getSelectedJourney() {
  const journeys = getAllJourneys();

  if (journeys.length === 0) {
    throw new Error("No journeys found.");
  }

  if (typeof window === "undefined") {
    return journeys[0];
  }

  const selectedJourneyId =
    window.localStorage.getItem(SELECTED_JOURNEY_KEY) ?? journeys[0].id;

  return (
    journeys.find((journey) => journey.id === selectedJourneyId) ?? journeys[0]
  );
}

export function clearJourneyProgress(journeyId: string) {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(`ashara_completed_segments_${journeyId}`);
  window.localStorage.removeItem("ashara_pending_action");
  window.localStorage.removeItem("ashara_last_session_title");
  window.localStorage.removeItem("ashara_last_check_in");
}