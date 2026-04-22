import type { Journey, Segment } from "../types";
import { mergeJourneys } from "../journey-builder";
import { alMulkJourney } from "./al-mulk";
import { alHujuratJourney } from "./al-hujurat";

export const baseJourneys: Journey[] = [
  {
    ...alMulkJourney,
    cardColor: "#7CC8D0",
    artImage: "/journeys/al-mulk.png",
  },
  {
    ...alHujuratJourney,
    cardColor: "#7A9660",
    artImage: "/journeys/al-hujurat.png",
  },
];

export function getAllJourneys() {
  return mergeJourneys(baseJourneys);
}

export function getJourneyById(id: string) {
  return getAllJourneys().find((journey) => journey.id === id) ?? null;
}

export function getSegmentById(segmentId: string): Segment | null {
  for (const journey of getAllJourneys()) {
    const match = journey.segments.find((segment) => segment.id === segmentId);
    if (match) return match;
  }

  return null;
}

export function getJourneyForSegmentId(segmentId: string): Journey | null {
  for (const journey of getAllJourneys()) {
    if (journey.segments.some((segment) => segment.id === segmentId)) {
      return journey;
    }
  }

  return null;
}

export function setSelectedJourneyId(journeyId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("ashara_selected_journey_id", journeyId);
}