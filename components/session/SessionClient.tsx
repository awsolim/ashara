"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import type { Segment } from "@/lib/data/types";

type SessionClientProps = {
  segment: Segment;
  journeyId: string;
};

export default function SessionClient({
  segment,
  journeyId,
}: SessionClientProps) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const question = segment?.questions?.[0] ?? null;

  const steps = useMemo(
    () => [
      "recitation",
      "understanding",
      "focus",
      "interaction",
      "reflection",
      "action",
      "complete",
    ],
    []
  );

  const progressPercent = useMemo(() => {
    return Math.round(((step + 1) / steps.length) * 100);
  }, [step, steps.length]);

  function next() {
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
    }
  }

  function finish() {
    if (selectedAction) {
      localStorage.setItem("ashara_pending_action", selectedAction);
      localStorage.setItem(
        "ashara_last_session_title",
        `${segment.title}`
      );
    }

    try {
      const raw = localStorage.getItem(`ashara_completed_segments_${journeyId}`);
      const parsed = raw ? JSON.parse(raw) : [];
      const completedSegmentIds = Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];

      if (!completedSegmentIds.includes(segment.id)) {
        const updatedCompletedSegmentIds = [...completedSegmentIds, segment.id];
        localStorage.setItem(
          `ashara_completed_segments_${journeyId}`,
          JSON.stringify(updatedCompletedSegmentIds)
        );
      }
    } catch {
      localStorage.setItem(
        `ashara_completed_segments_${journeyId}`,
        JSON.stringify([segment.id])
      );
    }

    localStorage.setItem("ashara_selected_journey_id", journeyId);
    router.push("/home");
  }

  function back() {
    if (step === 0) {
      router.push("/home");
      return;
    }

    setStep((current) => current - 1);
  }

  function Option({
    label,
    selected,
    onClick,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-2xl border p-4 text-left transition ${
          selected
            ? "border-[#1f5c4c] bg-[#edf5f1]"
            : "border-[#e6e0d7] bg-white hover:border-[#cfc7bc]"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-[15px] font-medium text-[#171717]">{label}</span>
        </div>
      </button>
    );
  }

  function StepShell({
    eyebrow,
    title,
    children,
  }: {
    eyebrow: string;
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <section className="mt-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b756d]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-[#171717]">
          {title}
        </h1>

        <div className="mt-5">{children}</div>
      </section>
    );
  }

  if (!segment) {
    return (
      <main className="min-h-screen px-5 pb-8 pt-8">
        <Card>
          <p className="text-[15px] leading-7 text-[#2d2b28]">
            This lesson could not be loaded.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col justify-between px-5 pb-8 pt-8">
      <div>
        <section>
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={back}
              className="rounded-full border border-[#d8d1c8] bg-white/80 px-3 py-2 text-sm text-[#5f5a53] transition hover:border-[#c9c0b4]"
            >
              Back
            </button>

            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b756d]">
                Lesson progress
              </p>
              <p className="mt-1 text-sm font-medium text-[#171717]">
                Step {step + 1} of {steps.length}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <ProgressBar value={progressPercent} />
          </div>
        </section>

        {step === 0 ? (
          <StepShell eyebrow="Recitation" title={segment.title}>
            <Card className="bg-white">
              <p className="text-sm text-[#7b756d]">
                Ayah {segment.ayahStart}–{segment.ayahEnd}
              </p>

              <div className="mt-5 rounded-3xl bg-[#fbfaf7] p-5">
                <p className="whitespace-pre-line text-right text-[1.65rem] leading-[2.7rem] text-[#171717]">
                  {segment.arabic || "Arabic text will appear here."}
                </p>
              </div>

              <div className="mt-5 border-t border-[#eee6db] pt-5">
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#7b756d]">
                  Translation
                </p>
                <p className="mt-3 text-[15px] leading-7 text-[#3d3a35]">
                  {segment.translation || "Translation will appear here."}
                </p>
              </div>
            </Card>
          </StepShell>
        ) : null}

        {step === 1 ? (
          <StepShell eyebrow="Understanding" title="What these ayat are showing">
            <div className="space-y-3">
              {segment.insights.map((insight, index) => (
                <Card key={insight} className="bg-white">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5f1] text-sm font-semibold text-[#1f5c4c]">
                      {index + 1}
                    </div>
                    <p className="text-[15px] leading-7 text-[#2d2b28]">
                      {insight}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </StepShell>
        ) : null}

        {step === 2 ? (
          <StepShell eyebrow="Focus" title="Carry one central takeaway">
            <Card className="bg-[#f6f1e8]">
              <p className="text-lg font-medium leading-8 text-[#171717]">
                {segment.focusAnchor}
              </p>

              {segment.background ? (
                <p className="mt-4 text-[15px] leading-7 text-[#5a554e]">
                  {segment.background}
                </p>
              ) : null}
            </Card>
          </StepShell>
        ) : null}

        {step === 3 ? (
          question ? (
            <StepShell eyebrow="Apply" title={question.prompt}>
              <div className="space-y-3">
                {question.options.map((option) => (
                  <Option
                    key={option}
                    label={option}
                    selected={selectedAnswer === option}
                    onClick={() => setSelectedAnswer(option)}
                  />
                ))}
              </div>

              {selectedAnswer ? (
                <Card className="mt-4 bg-[#fcfbf8]">
                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#7b756d]">
                    Response
                  </p>

                  <p className="mt-3 text-[15px] leading-7 text-[#2d2b28]">
                    {selectedAnswer === question.correctAnswer
                      ? question.explanation || "That’s the best fit for these ayat."
                      : `A stronger fit here is: ${question.correctAnswer}. ${
                          question.explanation || ""
                        }`}
                  </p>
                </Card>
              ) : null}
            </StepShell>
          ) : (
            <StepShell eyebrow="Apply" title="No question available">
              <Card>
                <p className="text-[15px] leading-7 text-[#2d2b28]">
                  This segment does not currently have an application question.
                </p>
              </Card>
            </StepShell>
          )
        ) : null}

        {step === 4 ? (
          <StepShell eyebrow="Reflect" title="Bring it into your life">
            <Card className="bg-white">
              <p className="text-[15px] leading-7 text-[#2d2b28]">
                {segment.reflectionPrompt}
              </p>
            </Card>
          </StepShell>
        ) : null}

        {step === 5 ? (
          <StepShell eyebrow="Action" title="Choose one action for today">
            <div className="space-y-3">
              {segment.actionOptions.map((action) => (
                <Option
                  key={action}
                  label={action}
                  selected={selectedAction === action}
                  onClick={() => setSelectedAction(action)}
                />
              ))}
            </div>
          </StepShell>
        ) : null}

        {step === 6 ? (
          <StepShell eyebrow="Complete" title="Carry this with you today">
            <Card className="bg-[#f6f1e8]">
              <p className="text-[15px] leading-7 text-[#2d2b28]">
                Your next return begins with honesty: did you actually follow
                through on what you chose?
              </p>

              {selectedAction ? (
                <div className="mt-5 rounded-2xl bg-white px-4 py-4">
                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#7b756d]">
                    Chosen action
                  </p>
                  <p className="mt-2 text-[15px] leading-7 text-[#171717]">
                    {selectedAction}
                  </p>
                </div>
              ) : null}
            </Card>
          </StepShell>
        ) : null}
      </div>

      <div className="pt-6">
        {step < steps.length - 1 ? (
          <Button
            onClick={next}
            disabled={
              (step === 3 && !!question && !selectedAnswer) ||
              (step === 5 && !selectedAction)
            }
          >
            Continue
          </Button>
        ) : (
          <Button onClick={finish}>Finish lesson</Button>
        )}
      </div>
    </main>
  );
}