import type { Journey } from "./types";

const CUSTOM_JOURNEYS_KEY = "ashara_custom_journeys";
const JOURNEY_OVERRIDES_KEY = "ashara_journey_overrides";

export type JourneyStyleFields = Pick<
  Journey,
  "id" | "surahName" | "cardColor" | "artImage"
>;

function canUseStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function slugifyJourneyName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/^surah\s+/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCustomJourneys(): Journey[] {
  return readJson<Journey[]>(CUSTOM_JOURNEYS_KEY, []);
}

export function saveCustomJourney(journey: Journey) {
  const existing = getCustomJourneys();
  const next = existing.some((item) => item.id === journey.id)
    ? existing.map((item) => (item.id === journey.id ? journey : item))
    : [...existing, journey];

  writeJson(CUSTOM_JOURNEYS_KEY, next);
}

export function getJourneyOverrides(): JourneyStyleFields[] {
  return readJson<JourneyStyleFields[]>(JOURNEY_OVERRIDES_KEY, []);
}

export function saveJourneyOverride(override: JourneyStyleFields) {
  const existing = getJourneyOverrides();
  const next = existing.some((item) => item.id === override.id)
    ? existing.map((item) => (item.id === override.id ? override : item))
    : [...existing, override];

  writeJson(JOURNEY_OVERRIDES_KEY, next);
}

export function mergeJourneys(baseJourneys: Journey[]) {
  const overrides = getJourneyOverrides();
  const customJourneys = getCustomJourneys();

  const mergedBase = baseJourneys.map((journey) => {
    const override = overrides.find((item) => item.id === journey.id);

    if (!override) return journey;

    return {
      ...journey,
      surahName: override.surahName,
      cardColor: override.cardColor,
      artImage: override.artImage,
    };
  });

  return [...mergedBase, ...customJourneys];
}

export function isDarkColor(hex: string) {
  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) return false;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.6;
}

export function getJourneyCardTheme(cardColor: string) {
  const dark = isDarkColor(cardColor);

  return {
    titleClass: dark ? "text-white" : "text-[#171717]",
    subtitleClass: dark ? "text-white/95" : "text-[#17353a]",
    metaClass: dark ? "text-white/78" : "text-[#24474c]/80",
    badgeClass: dark
      ? "bg-white/20 text-white"
      : "bg-white/35 text-[#17353a]",
    progressTrackClass: dark ? "bg-black/12" : "bg-black/10",
    progressFillClass: dark ? "bg-white" : "bg-white",
  };
}

export function getJourneySubtitle(journey: Journey, completedCount: number) {
  if (journey.segments.length === 0) {
    return {
      title: "No lessons added yet",
      meta: "0 total sessions",
    };
  }

  const lessonNumber = Math.min(completedCount + 1, journey.segments.length);
  const currentSegment = journey.segments[completedCount] ?? journey.segments[0];

  return {
    title: currentSegment.title,
    meta: `Lesson ${lessonNumber} of ${journey.segments.length}`,
  };
}