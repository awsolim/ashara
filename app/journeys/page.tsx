"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/navigation/BottomNav";
import {
  getCompletedSegmentIds,
  getJourneyProgressPercent,
} from "@/lib/data/journey";
import {
  getJourneyCardTheme,
  getJourneySubtitle,
} from "@/lib/data/journey-builder";
import { useAppData } from "@/components/providers/AppDataProvider";

export default function JourneysPage() {
  const router = useRouter();

  const {
    journeys,
    selectedJourneyId,
    setSelectedJourneyId,
    isLoadingJourneys,
  } = useAppData();

  const [openMenu, setOpenMenu] = useState<"add" | "edit" | null>(null);
  const [isEditPicking, setIsEditPicking] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const journeyCards = useMemo(() => {
    return journeys.map((journey) => {
      const completedSegmentIds = getCompletedSegmentIds(journey.id);
      const totalSegments = journey.segments.length;

const progressPercent =
  totalSegments > 0
    ? Math.round((completedSegmentIds.length / totalSegments) * 100)
    : 0;
      const theme = getJourneyCardTheme(journey.cardColor ?? "#7CC8D0");
      const subtitle = getJourneySubtitle(journey, completedSegmentIds.length);

      return {
        ...journey,
        progressPercent,
        theme,
        subtitle,
      };
    });
  }, [journeys]);

  function handleJourneyClick(journeyId: string) {
    if (isEditPicking) {
      setIsEditPicking(false);
      router.push(`/builder?mode=edit&id=${journeyId}`);
      return;
    }

    setSelectedJourneyId(journeyId);
    router.push("/home");
  }

  return (
    <>
      <main className="min-h-screen px-5 pb-32 pt-8">
        <section className="flex items-start justify-between gap-4">
          <div>
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
          </div>

          <div ref={menuRef} className="relative flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenMenu((current) => (current === "add" ? null : "add"))
                }
                className="flex h-11 w-11 items-center justify-center rounded-full text-[24px] leading-none text-[#3f3a34] transition hover:bg-black/5 active:bg-black/10"
                aria-label="Add"
              >
                <span className="relative -top-px">+</span>
              </button>

              {openMenu === "add" ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-20 min-w-47.5 rounded-2xl border border-[#e3dbcf] bg-white p-2 shadow-[0_14px_30px_rgba(0,0,0,0.10)]">
                  <Link
                    href="/builder?mode=add"
                    onClick={() => setOpenMenu(null)}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-[#171717] hover:bg-[#f6f1e8]"
                  >
                    Add journey
                  </Link>

                  <Link
                    href="/builder?mode=add-lesson"
                    onClick={() => setOpenMenu(null)}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-[#171717] hover:bg-[#f6f1e8]"
                  >
                    Add lesson
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenMenu((current) => (current === "edit" ? null : "edit"))
                }
                className="rounded-full px-4 py-3 text-sm font-medium text-[#3f3a34] transition hover:bg-black/5 active:bg-black/10"
              >
                Edit
              </button>

              {openMenu === "edit" ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-20 min-w-47.5 rounded-2xl border border-[#e3dbcf] bg-white p-2 shadow-[0_14px_30px_rgba(0,0,0,0.10)]">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      setIsEditPicking(true);
                    }}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#171717] hover:bg-[#f6f1e8]"
                  >
                    Edit journey
                  </button>

                  <Link
                    href="/builder?mode=edit-lesson"
                    onClick={() => setOpenMenu(null)}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-[#171717] hover:bg-[#f6f1e8]"
                  >
                    Edit lesson
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {isEditPicking ? (
          <div className="mt-5 rounded-2xl border border-[#d8d1c8] bg-white px-4 py-3 text-sm font-medium text-[#3f3a34] shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
            Select a journey card to edit.
          </div>
        ) : null}

        <section className={`mt-7 space-y-5 ${isEditPicking ? "relative" : ""}`}>
          {isLoadingJourneys ? (
            <>
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-[28px] bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex min-h-30.5 animate-pulse">
                    <div className="w-[22%] bg-[#e5e0d8]" />
                    <div className="flex flex-1 flex-col justify-center gap-3 px-4 py-4">
                      <div className="h-7 w-40 rounded-full bg-[#ebe5dc]" />
                      <div className="h-4 w-48 rounded-full bg-[#ebe5dc]" />
                      <div className="h-3 w-24 rounded-full bg-[#ebe5dc]" />
                      <div className="h-2.5 w-full rounded-full bg-[#ebe5dc]" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : null}

          {journeyCards.map((journey) => {
            const isSelected = selectedJourneyId === journey.id;

            return (
              <button
                key={journey.id}
                type="button"
                onClick={() => handleJourneyClick(journey.id)}
                className={`block w-full text-left transition ${
                  isEditPicking ? "scale-[1.01]" : ""
                }`}
              >
                <div
                  className={`relative overflow-hidden rounded-[28px] shadow-[0_14px_30px_rgba(0,0,0,0.10)] transition duration-200 hover:scale-[1.01] active:scale-[0.995] ${
                    isSelected ? "ring-2 ring-white/70" : ""
                  } ${isEditPicking ? "ring-2 ring-white/80" : ""}`}
                  style={{ backgroundColor: journey.cardColor ?? "#7CC8D0" }}
                >
                  {isEditPicking ? (
                    <div className="pointer-events-none absolute inset-0 bg-black/8" />
                  ) : null}

                  <div className="flex min-h-30.5">
                    <div className="relative w-[22%] shrink-0 overflow-hidden rounded-l-[28px]">
                      {journey.artImage ? (
                        <img
                          src={journey.artImage}
                          alt=""
                          className="h-full w-full object-cover"
                          style={{
                            objectPosition: `${
                              journey.artPositionX ?? 0
                            }% center`,
                            transform: `scale(${journey.artScale ?? 1})`,
                          }}
                        />
                      ) : (
                        <div className="h-full w-full bg-black/5" />
                      )}

                      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-r from-transparent via-white/55 to-white/90" />
                    </div>

                    <div className="relative flex flex-1 flex-col justify-center py-4 pl-4 pr-24">
                      <div
                        className={`absolute right-5 top-4 rounded-full px-3 py-1 text-sm font-semibold backdrop-blur-sm ${journey.theme.badgeClass}`}
                      >
                        {journey.progressPercent}%
                      </div>

                      <div className="min-w-0">
                        <h2
                          className={`text-[1.75rem] font-semibold leading-tight tracking-tight ${journey.theme.titleClass}`}
                        >
                          {journey.surahName.replace(/^Surah\s+/i, "")}
                        </h2>

                        <p
                          className={`mt-1 truncate text-[13px] font-semibold leading-5 ${journey.theme.subtitleClass}`}
                        >
                          {journey.subtitle.title}
                        </p>

                        <p
                          className={`mt-0.5 text-[12px] font-medium leading-5 ${journey.theme.metaClass}`}
                        >
                          {journey.segments.length > 0
                            ? `Lesson ${Math.min(
                                getCompletedSegmentIds(journey.id).length + 1,
                                journey.segments.length
                              )} of ${journey.segments.length}`
                            : "No lessons yet"}
                        </p>
                      </div>

                      <div className="mt-4">
                        <div
                          className={`h-2.5 w-full rounded-full ${journey.theme.progressTrackClass}`}
                        >
                          <div
                            className={`h-2.5 rounded-full ${journey.theme.progressFillClass}`}
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