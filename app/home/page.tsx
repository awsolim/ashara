"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/navigation/BottomNav";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  getCompletedSegmentIds,
  getCurrentSegment,
  getJourneyProgressPercent,
  getSelectedJourney,
} from "@/lib/data/journey";

type CheckInStatus = "Did it" | "Partly" | "Not really" | "";

const journeyThemes = {
  "al-mulk": {
    shell: "bg-[#7CC8D0]",
    fade: "from-[#dff4f6]/95 via-[#7CC8D0]/72 to-[#7CC8D0]",
    text: "text-[#171717]",
    subtext: "text-[#16383d]",
    meta: "text-[#16383d]/85",
    badge: "bg-white/25 text-white",
    progressTrack: "bg-black/10",
    progressFill: "bg-white",
    buttonBg: "bg-[#388b8f]",
    buttonHover: "hover:bg-[#30767a]",
    selectedPill: "bg-[#388b8f] text-white border-[#388b8f]",
  },
  "al-hujurat": {
    shell: "bg-[#6C8654]",
    fade: "from-[#dbe8cf]/95 via-[#6C8654]/72 to-[#6C8654]",
    text: "text-white",
    subtext: "text-white/95",
    meta: "text-white/80",
    badge: "bg-white/20 text-white",
    progressTrack: "bg-black/10",
    progressFill: "bg-white",
    buttonBg: "bg-[#5b7247]",
    buttonHover: "hover:bg-[#4c613b]",
    selectedPill: "bg-[#5b7247] text-white border-[#5b7247]",
  },
} as const;

type JourneyTheme = (typeof journeyThemes)[keyof typeof journeyThemes];

function getJourneyTheme(journeyId?: string | null): JourneyTheme {
  if (!journeyId) return journeyThemes["al-mulk"];
  return (
    journeyThemes[journeyId as keyof typeof journeyThemes] ??
    journeyThemes["al-mulk"]
  );
}

export default function HomePage() {
  const [pendingAction, setPendingAction] = useState("");
  const [lastSessionTitle, setLastSessionTitle] = useState("");
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>("");
  const [savedStatus, setSavedStatus] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [completedSegmentIds, setCompletedSegmentIds] = useState<string[]>([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState("");

  useEffect(() => {
    const storedPendingAction =
      localStorage.getItem("ashara_pending_action") ?? "";
    const storedLastSessionTitle =
      localStorage.getItem("ashara_last_session_title") ?? "";
    const storedSavedStatus = localStorage.getItem("ashara_last_check_in") ?? "";
    const selectedJourney = getSelectedJourney();
    const storedCompletedSegmentIds = getCompletedSegmentIds(selectedJourney.id);

    setPendingAction(storedPendingAction);
    setLastSessionTitle(storedLastSessionTitle);
    setSavedStatus(storedSavedStatus);
    setSelectedJourneyId(selectedJourney.id);
    setCompletedSegmentIds(storedCompletedSegmentIds);
    setHasLoaded(true);
  }, []);

  const selectedJourney = useMemo(() => {
    if (!hasLoaded) return null;
    return getSelectedJourney();
  }, [hasLoaded, selectedJourneyId]);

  const theme = useMemo(() => {
    return getJourneyTheme(selectedJourney?.id);
  }, [selectedJourney]);

  const currentSegment = useMemo(() => {
    if (!selectedJourney) return null;
    return getCurrentSegment(selectedJourney.id, completedSegmentIds);
  }, [selectedJourney, completedSegmentIds]);

  const progressPercent = useMemo(() => {
    if (!selectedJourney) return 0;
    return getJourneyProgressPercent(selectedJourney.id, completedSegmentIds);
  }, [selectedJourney, completedSegmentIds]);

  const hasPendingCheckIn = useMemo(() => {
    return pendingAction.trim().length > 0;
  }, [pendingAction]);

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

    localStorage.removeItem(`ashara_completed_segments_${selectedJourney.id}`);
    localStorage.removeItem("ashara_pending_action");
    localStorage.removeItem("ashara_last_session_title");
    localStorage.removeItem("ashara_last_check_in");

    setCompletedSegmentIds([]);
    setPendingAction("");
    setLastSessionTitle("");
    setSavedStatus("");
    setCheckInStatus("");
  }

  const isJourneyComplete =
    hasLoaded &&
    !!selectedJourney &&
    currentSegment === null &&
    completedSegmentIds.length === selectedJourney.segments.length;

  const lessonNumber = selectedJourney
    ? Math.min(completedSegmentIds.length + 1, selectedJourney.segments.length)
    : 1;

  return (
    <>
      <main className="min-h-screen px-5 pb-32 pt-8">
        <section className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-[#d8d1c8] bg-white/70 text-xs font-medium text-[#8a847c] shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
            Logo
          </div>

          <div>
            <p className="font-serif text-[1.6rem] font-semibold tracking-tight text-[#171717]">
              Ashara
            </p>
            <p className="font-serif mt-0.5 text-lg text-[#6d685f]">
              Live with the Qur’an
            </p>
          </div>
        </section>

        <section className="mt-7">
          <div
            className={`relative overflow-hidden rounded-[30px] shadow-[0_18px_40px_rgba(0,0,0,0.12)] ${theme.shell}`}
          >
            <div className="flex min-h-[140px]">
              <div className="relative w-[30%] shrink-0">
                <JourneyArtPlaceholder
                  journeyId={selectedJourney?.id ?? "al-mulk"}
                />
                <div
                  className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-r ${theme.fade}`}
                />
              </div>

              <div className="flex flex-1 flex-col justify-center px-4 py-5 pr-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`text-xs uppercase tracking-[0.18em] ${theme.meta}`}
                    >
                      Current journey
                    </p>
                    <h2
                      className={`mt-2 text-2xl font-semibold tracking-tight ${theme.text}`}
                    >
                      {selectedJourney?.surahName?.replace(/^Surah\s+/i, "") ??
                        "Loading..."}
                    </h2>
                  </div>

                  <div
                    className={`rounded-full px-3 py-1 text-sm font-medium ${theme.badge}`}
                  >
                    {progressPercent}%
                  </div>
                </div>

                {currentSegment ? (
                  <>
                    <p className={`mt-2 text-sm font-semibold ${theme.subtext}`}>
                      {currentSegment.title}
                    </p>
                    <p className={`mt-0.5 text-[12px] font-medium ${theme.meta}`}>
                      Lesson {lessonNumber} of {selectedJourney?.segments.length}
                    </p>
                  </>
                ) : null}

                <div className="mt-4">
                  <div
                    className={`h-2.5 w-full rounded-full ${theme.progressTrack}`}
                  >
                    <div
                      className={`h-2.5 rounded-full ${theme.progressFill}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {hasLoaded && hasPendingCheckIn ? (
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
                          ? theme.selectedPill
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
                  className={`w-full rounded-2xl px-4 py-4 text-base font-medium tracking-tight text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none ${theme.buttonBg} ${theme.buttonHover}`}
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
                      Lesson {lessonNumber} of {selectedJourney?.segments.length}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#171717]">
                      Loading journey
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#6d685f]">
                      Getting your current lesson...
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
                <div
                  className={`h-2.5 w-full rounded-full ${theme.progressTrack}`}
                >
                  <div
                    className={`h-2.5 rounded-full ${theme.buttonBg}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="mt-4 text-[15px] leading-7 text-[#4e4a43]">
                  {currentSegment.focusAnchor}
                </p>
              </div>
            ) : null}

            <div className="mt-6 space-y-3">
              {isJourneyComplete ? (
                <Button disabled>All lessons completed</Button>
              ) : hasPendingCheckIn ? (
                <Button disabled>Complete check-in first</Button>
              ) : currentSegment ? (
                <Link href={`/session/${currentSegment.id}`} className="block">
                  <button
                    className={`w-full rounded-2xl px-4 py-4 text-base font-medium tracking-tight text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition active:scale-[0.985] ${theme.buttonBg} ${theme.buttonHover}`}
                  >
                    Continue lesson
                  </button>
                </Link>
              ) : (
                <Button disabled>Loading lesson</Button>
              )}

              <button
                type="button"
                onClick={resetCurrentJourneyProgress}
                className={`w-full rounded-2xl px-4 py-4 text-base font-medium tracking-tight text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition active:scale-[0.985] ${theme.buttonBg} ${theme.buttonHover}`}
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

        <section className="mt-5">
          <Card className="bg-[#f6f1e8]">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b756d]">
              Today’s focus
            </p>

            <p className="mt-3 text-[15px] leading-7 text-[#2d2b28]">
              {currentSegment
                ? currentSegment.focusAnchor
                : "Return to the Qur’an in a small, intentional portion and leave with one clear takeaway to live."}
            </p>
          </Card>
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
        <div className="absolute left-[70px] top-11 h-2 w-2 rounded-full bg-white/55" />
        <div className="absolute -bottom-2.5 -left-3.5 h-24 w-24 rounded-full bg-[#f1d38a]/80 blur-[2px]" />
        <div className="absolute bottom-0.5 left-10.5 h-20 w-20 rounded-full bg-white/40 blur-sm" />
        <div className="absolute left-4.5 top-16 h-28 w-8 rotate-[28deg] rounded-full bg-[#8c5632]/55" />
      </div>
    );
  }

  if (journeyId === "al-hujurat") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 h-22 w-full bg-gradient-to-t from-[#5d7e49]/85 to-transparent" />
        <div className="absolute left-2.5 top-4.5 h-16 w-1 rounded-full bg-[#496a62]/70" />
        <div className="absolute left-1 top-2.5 h-8 w-8 rounded-full bg-[#496a62]/50" />
        <div className="absolute left-9 top-8 h-20 w-1 rounded-full bg-[#496a62]/55" />
        <div className="absolute left-7.5 top-6 h-7 w-7 rounded-full bg-[#496a62]/35" />
        <div className="absolute bottom-0 left-2 h-24 w-10 rounded-t-full bg-white/85" />
        <div className="absolute bottom-0 left-7.5 h-24 w-12 rounded-t-full bg-[#1f3f39]/85" />
        <div className="absolute bottom-[68px] left-3 h-8 w-8 rounded-full bg-[#efe7dc]" />
        <div className="absolute bottom-[66px] left-9 h-9 w-9 rounded-full bg-[#a77b58]" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -left-3 top-3 h-24 w-24 rounded-full bg-white/22" />
      <div className="absolute -bottom-4.5 left-2 h-28 w-28 rounded-full bg-black/10" />
      <div className="absolute left-3.5 top-[54px] h-20 w-10 rotate-[25deg] rounded-full bg-white/25" />
    </div>
  );
}