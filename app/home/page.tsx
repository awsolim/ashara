"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/navigation/BottomNav";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  clearJourneyProgress,
  getCompletedSegmentIds,
  getCurrentSegment,
} from "@/lib/data/journey";
import {
  getJourneyCardTheme,
  getJourneySubtitle,
} from "@/lib/data/journey-builder";
import { useAppData } from "@/components/providers/AppDataProvider";

type CheckInStatus = "Did it" | "Partly" | "Not really" | "";

export default function HomePage() {
  const { selectedJourney, isLoadingJourneys } = useAppData();

  const [pendingAction, setPendingAction] = useState("");
  const [lastSessionTitle, setLastSessionTitle] = useState("");
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>("");
  const [savedStatus, setSavedStatus] = useState("");
  const [completedSegmentIds, setCompletedSegmentIds] = useState<string[]>([]);

  useEffect(() => {
    const storedPendingAction =
      localStorage.getItem("ashara_pending_action") ?? "";
    const storedLastSessionTitle =
      localStorage.getItem("ashara_last_session_title") ?? "";
    const storedSavedStatus = localStorage.getItem("ashara_last_check_in") ?? "";

    setPendingAction(storedPendingAction);
    setLastSessionTitle(storedLastSessionTitle);
    setSavedStatus(storedSavedStatus);
  }, []);

  useEffect(() => {
    if (!selectedJourney) return;
    setCompletedSegmentIds(getCompletedSegmentIds(selectedJourney.id));
  }, [selectedJourney]);

  const currentSegment = useMemo(() => {
    if (!selectedJourney) return null;
    return getCurrentSegment(selectedJourney.id, completedSegmentIds);
  }, [selectedJourney, completedSegmentIds]);

  const progressPercent = useMemo(() => {
  if (!selectedJourney) return 0;

  const totalSegments = selectedJourney.segments.length;

  if (totalSegments === 0) return 0;

  const completedCount = selectedJourney.segments.filter((segment) =>
    completedSegmentIds.includes(segment.id)
  ).length;

  return Math.round((completedCount / totalSegments) * 100);
}, [selectedJourney, completedSegmentIds]);

  const theme = useMemo(() => {
    return getJourneyCardTheme(selectedJourney?.cardColor ?? "#7CC8D0");
  }, [selectedJourney]);

  const subtitle = useMemo(() => {
    if (!selectedJourney) {
      return { title: "Loading...", meta: "" };
    }

    return getJourneySubtitle(selectedJourney, completedSegmentIds.length);
  }, [selectedJourney, completedSegmentIds]);

  const hasPendingCheckIn = pendingAction.trim().length > 0;

  

  function submitCheckIn() {
    if (!checkInStatus) return;

    localStorage.setItem("ashara_last_check_in", checkInStatus);
    localStorage.removeItem("ashara_pending_action");

    setSavedStatus(checkInStatus);
    setPendingAction("");
    setCheckInStatus("");
  }

  function resetCurrentJourneyProgress() {
    if (!selectedJourney) return;

    clearJourneyProgress(selectedJourney.id);
    setCompletedSegmentIds([]);
    setPendingAction("");
    setLastSessionTitle("");
    setSavedStatus("");
    setCheckInStatus("");
  }

  const isComplete =
  selectedJourney &&
  selectedJourney.segments.length > 0 &&
  selectedJourney.segments.every((segment) =>
    completedSegmentIds.includes(segment.id)
  );

  const isJourneyComplete =
    !!selectedJourney &&
    currentSegment === null &&
    completedSegmentIds.length === selectedJourney.segments.length;

  return (
    <>
      <main className="min-h-screen px-5 pb-32 pt-8">
        <section className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-[#d8d1c8] bg-white/70 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
            <Image
              src="/icons/apple-touch-icon.png"
              alt="Ashara logo"
              width={64}
              height={64}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <div>
            <p className="font-serif text-[1.6rem] font-semibold tracking-tight text-[#171717]">
              Ashara
            </p>
            <p className="mt-0.5 text-sm text-[#6d685f]">
              Live with the Qur’an
            </p>
          </div>
        </section>

        <section className="mt-7">
          {isLoadingJourneys ? (
            <div className="overflow-hidden rounded-[30px] bg-white shadow-[0_18px_40px_rgba(0,0,0,0.06)]">
              <div className="flex min-h-[140px] animate-pulse">
                <div className="w-[22%] bg-[#e5e0d8]" />
                <div className="flex flex-1 flex-col justify-center gap-3 px-4 py-5">
                  <div className="h-4 w-28 rounded-full bg-[#ebe5dc]" />
                  <div className="h-8 w-40 rounded-full bg-[#ebe5dc]" />
                  <div className="h-4 w-44 rounded-full bg-[#ebe5dc]" />
                  <div className="h-3 w-24 rounded-full bg-[#ebe5dc]" />
                  <div className="h-2.5 w-full rounded-full bg-[#ebe5dc]" />
                </div>
              </div>
            </div>
          ) : (
            <div
              className="relative overflow-hidden rounded-[30px] shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
              style={{ backgroundColor: selectedJourney?.cardColor ?? "#7CC8D0" }}
            >
              <div className="flex min-h-[140px]">
                <div className="relative w-[22%] shrink-0 overflow-hidden rounded-l-[30px]">
                  {selectedJourney?.artImage ? (
                    <img
                      src={selectedJourney.artImage}
                      alt=""
                      className="h-full w-full object-cover object-left"
                    />
                  ) : (
                    <div className="h-full w-full bg-black/5" />
                  )}

                  <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent via-white/55 to-white/90" />
                </div>

                <div className="relative flex flex-1 flex-col justify-center px-4 py-5 pr-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className={`text-xs uppercase tracking-[0.18em] ${theme.metaClass}`}
                      >
                        Current journey
                      </p>
                      <h2
                        className={`mt-2 text-2xl font-semibold tracking-tight ${theme.titleClass}`}
                      >
                        {selectedJourney?.surahName?.replace(/^Surah\s+/i, "") ??
                          "Loading..."}
                      </h2>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-sm font-medium ${theme.badgeClass}`}
                    >
                      {progressPercent}%
                    </div>
                  </div>

                  <p className={`mt-2 text-sm font-semibold ${theme.subtitleClass}`}>
                    {subtitle.title}
                  </p>
                  <p className={`mt-0.5 text-[12px] font-medium ${theme.metaClass}`}>
                    {subtitle.meta}
                  </p>

                  <div className="mt-4">
                    <div
                      className={`h-2.5 w-full rounded-full ${theme.progressTrackClass}`}
                    >
                      <div
                        className={`h-2.5 rounded-full ${theme.progressFillClass}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {hasPendingCheckIn ? (
          <section className="mt-5">
            <Card className="border-[#1f5c4c]/15 bg-[#fcfbf8]">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b756d]">
                Check-in
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#171717]">
                How did it go with your last action?
              </h2>

              {lastSessionTitle ? (
                <p className="mt-3 text-sm text-[#7b756d]">
                  Lesson: {lastSessionTitle}
                </p>
              ) : null}

              <p className="mt-3 text-[15px] leading-7 text-[#2b2b2b]">
                <span className="font-medium">You committed to: </span>
                {pendingAction}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {["Did it", "Partly", "Not really"].map((option) => {
                  const selected = checkInStatus === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCheckInStatus(option as CheckInStatus)}
                      className={`rounded-2xl border px-3 py-3 text-center text-sm font-medium transition ${
                        selected
                          ? "border-[#1d5f63] bg-[#1d5f63] text-white"
                          : "border-[#e6e0d7] bg-white text-[#5f5a53] hover:border-[#cfc7bc]"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                <button
                  onClick={submitCheckIn}
                  disabled={!checkInStatus}
                  className="w-full rounded-2xl bg-[#1d5f63] px-4 py-4 text-base font-medium tracking-tight text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none"
                >
                  Submit check-in
                </button>
              </div>
            </Card>
          </section>
        ) : null}

        <section className="mt-5">
          <Card className="bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b756d]">
                  Next lesson
                </p>

                {isJourneyComplete ? (
                  <>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#171717]">
                      Journey complete
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#6d685f]">
                      You have completed all current lessons in this journey.
                    </p>
                  </>
                ) : currentSegment ? (
                  <>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#171717]">
                      {selectedJourney?.surahName?.replace(/^Surah\s+/i, "")}
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#6d685f]">
                      {currentSegment.title}
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-[#7b756d]">
                      Lesson{" "}
                      {Math.min(
                        completedSegmentIds.length + 1,
                        selectedJourney?.segments.length ?? 1
                      )}{" "}
                      of {selectedJourney?.segments.length ?? 0}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#171717]">
                      No lessons yet
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#6d685f]">
                      Add lessons for this journey in Builder.
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-full bg-[#f1ede6] px-3 py-1 text-sm font-medium text-[#5f5a53]">
                {progressPercent}%
              </div>
            </div>

            {!isJourneyComplete && currentSegment ? (
              <div className="mt-4">
                <div className="h-2.5 w-full rounded-full bg-black/8">
                  <div
                    className="h-2.5 rounded-full bg-[#1d5f63]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="mt-4 text-[15px] leading-7 text-[#4e4a43]">
                  {currentSegment.focusAnchor}
                </p>
              </div>
            ) : null}

            <div className="mt-6 space-y-3">
  {currentSegment ? (
    isComplete ? (
      <Button disabled>Completed</Button>
    ) : (
      <Link href={`/session/${currentSegment.id}`} className="block">
  <button
    className="block w-full rounded-2xl px-4 py-4 text-base font-semibold text-white"
    style={{ backgroundColor: "#1d5f63" }}
  >
    Continue lesson
  </button>
</Link>
    )
  ) : (
    <Button disabled>No lessons yet</Button>
  )}

  <button
  type="button"
  onClick={resetCurrentJourneyProgress}
  className="w-full rounded-2xl px-4 py-4 text-base font-medium tracking-tight text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition active:scale-[0.985]"
  style={{ backgroundColor: "#1d5f63" }}
>
  Reset progress
</button>
</div>
          </Card>
        </section>

        <section className="mt-5">
          <Card className="bg-[#f8f5ef]">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b756d]">
              Latest status
            </p>

            <p className="mt-3 text-base font-medium tracking-tight text-[#171717]">
              {savedStatus || "No check-in yet"}
            </p>
          </Card>
        </section>
      </main>

      <BottomNav />
    </>
  );
}