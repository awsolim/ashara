import { alHujuratJourney } from "./al-hujurat";
import { alMulkJourney } from "./al-mulk";
import type { Journey, Segment } from "../types";

export const journeys: Journey[] = [alMulkJourney, alHujuratJourney];

export function getJourneyById(journeyId: string) {
  return journeys.find((journey) => journey.id === journeyId);
}

export function getSegmentById(segmentId: string): Segment | undefined {
  for (const journey of journeys) {
    const match = journey.segments.find((segment) => segment.id === segmentId);
    if (match) return match;
  }

  return undefined;
}

export function getJourneyForSegmentId(segmentId: string): Journey | undefined {
  return journeys.find((journey) =>
    journey.segments.some((segment) => segment.id === segmentId)
  );
}

export function getSelectedJourneyId() {
  if (typeof window === "undefined") return journeys[0].id;

  return localStorage.getItem("ashara_selected_journey_id") ?? journeys[0].id;
}

export function setSelectedJourneyId(journeyId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ashara_selected_journey_id", journeyId);
}