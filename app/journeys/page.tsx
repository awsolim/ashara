"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/navigation/BottomNav";
import {
  getCompletedSegmentIds,
  getCurrentSegment,
  getJourneyProgressPercent,
} from "@/lib/data/journey";
import { journeys, setSelectedJourneyId } from "@/lib/data/journeys";

const journeyThemes = {
  "al-mulk": {
    shell: "bg-[#7CC8D0]",
    fade: "from-[#dff4f6]/95 via-[#7CC8D0]/72 to-[#7CC8D0]",
    progressTrack: "bg-black/10",
    progressFill: "bg-white",
    title: "text-[#171717]",
    subtitle: "text-[#16383d]",
    meta: "text-[#16383d]/85",
    badge: "bg-white/25 text-white",
  },
  "al-hujurat": {
    shell: "bg-[#6C8654]",
    fade: "from-[#dbe8cf]/95 via-[#6C8654]/72 to-[#6C8654]",
    progressTrack: "bg-black/10",
    progressFill: "bg-white",
    title: "text-white",
    subtitle: "text-white/95",
    meta: "text-white/80",
    badge: "bg-white/20 text-white",
  },
} as const;

type JourneyTheme = (typeof journeyThemes)[keyof typeof journeyThemes];

function getJourneyTheme(journeyId: string): JourneyTheme {
  return (
    journeyThemes[journeyId as keyof typeof journeyThemes] ??
    journeyThemes["al-mulk"]
  );
}

export default function JourneysPage() {
  const router = useRouter();
  const [selectedJourneyIdState, setSelectedJourneyIdState] = useState("");

  useEffect(() => {
    const storedJourneyId =
      localStorage.getItem("ashara_selected_journey_id") ?? journeys[0].id;

    setSelectedJourneyIdState(storedJourneyId);
  }, []);

  const journeyCards = useMemo(() => {
    return journeys.map((journey) => {
      const completedSegmentIds = getCompletedSegmentIds(journey.id);
      const progressPercent = getJourneyProgressPercent(
        journey.id,
        completedSegmentIds
      );
      const currentSegment = getCurrentSegment(journey.id, completedSegmentIds);

      return {
        ...journey,
        completedCount: completedSegmentIds.length,
        progressPercent,
        currentSegment,
      };
    });
  }, [selectedJourneyIdState]);

  function chooseJourney(journeyId: string) {
    setSelectedJourneyId(journeyId);
    setSelectedJourneyIdState(journeyId);
    router.push("/home");
  }

  return (
    <>
      <main className="min-h-screen px-5 pb-32 pt-8">
        <section>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b756d]">
            Journeys
          </p>

          <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-[#171717]">
            Choose a journey
          </h1>

          <p className="mt-3 max-w-sm text-[15px] leading-7 text-[#67625b]">
            Pick a surah path to continue with reflection, understanding, and
            action.
          </p>
        </section>

        <section className="mt-7 space-y-5">
          {journeyCards.map((journey) => {
            const theme = getJourneyTheme(journey.id);
            const isSelected = selectedJourneyIdState === journey.id;
            const lessonNumber = Math.min(
              journey.completedCount + 1,
              journey.segments.length
            );

            return (
              <button
                key={journey.id}
                type="button"
                onClick={() => chooseJourney(journey.id)}
                className="block w-full text-left"
              >
                <div
                  className={`relative overflow-hidden rounded-[28px] shadow-[0_14px_30px_rgba(0,0,0,0.10)] transition duration-200 hover:scale-[1.01] active:scale-[0.995] ${
                    theme.shell
                  } ${isSelected ? "ring-2 ring-white/70" : ""}`}
                >
                  <div className="flex min-h-30.5">
                    <div className="relative w-[32%] shrink-0">
                      <JourneyArtPlaceholder journeyId={journey.id} />
                      <div
                        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-r ${theme.fade}`}
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-center py-4 pl-3 pr-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2
                            className={`text-[1.75rem] font-semibold leading-tight tracking-tight ${theme.title}`}
                          >
                            {journey.surahName.replace(/^Surah\s+/i, "")}
                          </h2>

                          <p
                            className={`mt-1 truncate text-[13px] font-semibold leading-5 ${theme.subtitle}`}
                          >
                            {journey.currentSegment
                              ? journey.currentSegment.title
                              : "Journey complete"}
                          </p>

                          <p
                            className={`mt-0.5 text-[12px] font-medium leading-5 ${theme.meta}`}
                          >
                            {journey.currentSegment
                              ? `Lesson ${lessonNumber} of ${journey.segments.length}`
                              : `${journey.segments.length} lessons completed`}
                          </p>
                        </div>

                        <div
                          className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold backdrop-blur-sm ${theme.badge}`}
                        >
                          {journey.progressPercent}%
                        </div>
                      </div>

                      <div className="mt-4">
                        <div
                          className={`h-2.5 w-full rounded-full ${theme.progressTrack}`}
                        >
                          <div
                            className={`h-2.5 rounded-full ${theme.progressFill}`}
                            style={{ width: `${journey.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      </main>

      <BottomNav />
    </>
  );
}

function JourneyArtPlaceholder({ journeyId }: { journeyId: string }) {
  if (journeyId === "al-mulk") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-4.5 top-3.5 h-28 w-28 rounded-full bg-white/18 blur-sm" />
        <div className="absolute left-1.5 top-2.5 h-24 w-24 rounded-full bg-[#1e3447]/18" />
        <div className="absolute left-7 top-7 h-2.5 w-2.5 rounded-full bg-white/70" />
        <div className="absolute left-14 top-4.5 h-1.5 w-1.5 rounded-full bg-white/70" />
        <div className="absolute left-17.5 top-11 h-2 w-2 rounded-full bg-white/55" />
        <div className="absolute -bottom-2.5 -left-3.5 h-24 w-24 rounded-full bg-[#f1d38a]/80 blur-[2px]" />
        <div className="absolute bottom-0.5 left-10.5 h-20 w-20 rounded-full bg-white/40 blur-sm" />
        <div className="absolute left-4.5 top-16 h-28 w-8 rotate-28 rounded-full bg-[#8c5632]/55" />
      </div>
    );
  }

  if (journeyId === "al-hujurat") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 h-22 w-full bg-linear-to-t from-[#5d7e49]/85 to-transparent" />
        <div className="absolute left-2.5 top-4.5 h-16 w-1 rounded-full bg-[#496a62]/70" />
        <div className="absolute left-1 top-2.5 h-8 w-8 rounded-full bg-[#496a62]/50" />
        <div className="absolute left-9 top-8 h-20 w-1 rounded-full bg-[#496a62]/55" />
        <div className="absolute left-7.5 top-6 h-7 w-7 rounded-full bg-[#496a62]/35" />
        <div className="absolute bottom-0 left-2 h-24 w-10 rounded-t-full bg-white/85" />
        <div className="absolute bottom-0 left-7.5 h-24 w-12 rounded-t-full bg-[#1f3f39]/85" />
        <div className="absolute bottom-17 left-3 h-8 w-8 rounded-full bg-[#efe7dc]" />
        <div className="absolute bottom-16.5 left-9 h-9 w-9 rounded-full bg-[#a77b58]" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -left-3 top-3 h-24 w-24 rounded-full bg-white/22" />
      <div className="absolute -bottom-4.5 left-2 h-28 w-28 rounded-full bg-black/10" />
      <div className="absolute left-3.5 top-13.5 h-20 w-10 rotate-25 rounded-full bg-white/25" />
    </div>
  );
}