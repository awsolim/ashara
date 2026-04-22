"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

const goals = [
  "Build consistency",
  "Understand what I recite",
  "Reflect more deeply",
];

const timeCommitments = ["3 minutes", "5 minutes", "10 minutes"];

const levels = ["Just starting", "Some familiarity", "Already consistent"];

type OnboardingData = {
  goal: string;
  timeCommitment: string;
  level: string;
};

function OptionCard({
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
      className={`
        w-full rounded-2xl border p-4 text-left transition
        ${
          selected
            ? "border-black bg-neutral-100"
            : "border-neutral-200 bg-white hover:border-neutral-300"
        }
      `}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-medium text-neutral-900">{label}</span>

        <div
          className={`
            flex h-5 w-5 items-center justify-center rounded-full border
            ${
              selected
                ? "border-black bg-black text-white"
                : "border-neutral-300 bg-white"
            }
          `}
        >
          {selected ? <span className="text-[10px]">✓</span> : null}
        </div>
      </div>
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingData>({
    goal: "",
    timeCommitment: "",
    level: "",
  });

  const totalSteps = 4;

  const progressWidth = useMemo(() => {
    return `${((step + 1) / totalSteps) * 100}%`;
  }, [step]);

  const canContinue = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return form.goal !== "";
    if (step === 2) return form.timeCommitment !== "";
    if (step === 3) return form.level !== "";
    return false;
  }, [step, form]);

  function handleNext() {
    if (step < totalSteps - 1) {
      setStep((prev) => prev + 1);
      return;
    }

    router.push("/home");
  }

  function handleBack() {
    if (step === 0) {
      router.push("/");
      return;
    }

    setStep((prev) => prev - 1);
  }

  return (
    <main className="flex min-h-screen flex-col justify-between p-6">
      <div>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-neutral-500"
          >
            Back
          </button>

          <div className="mt-4 h-2 w-full rounded-full bg-neutral-200">
            <div
              className="h-2 rounded-full bg-black transition-all"
              style={{ width: progressWidth }}
            />
          </div>
        </div>

        {step === 0 ? (
          <section className="pt-8">
            <p className="text-sm text-neutral-500">Welcome</p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
              Build a deeper relationship with the Qur’an
            </h1>

            <p className="mt-4 text-base leading-7 text-neutral-600">
              Ashara helps you move through small groups of ayat with guided
              understanding, reflection, and one action to carry into your day.
            </p>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="pt-8">
            <p className="text-sm text-neutral-500">Step 1</p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
              What do you want help with most?
            </h1>

            <div className="mt-6 space-y-3">
              {goals.map((goal) => (
                <OptionCard
                  key={goal}
                  label={goal}
                  selected={form.goal === goal}
                  onClick={() => setForm((prev) => ({ ...prev, goal }))}
                />
              ))}
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="pt-8">
            <p className="text-sm text-neutral-500">Step 2</p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
              How much time feels realistic each day?
            </h1>

            <div className="mt-6 space-y-3">
              {timeCommitments.map((time) => (
                <OptionCard
                  key={time}
                  label={time}
                  selected={form.timeCommitment === time}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, timeCommitment: time }))
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="pt-8">
            <p className="text-sm text-neutral-500">Step 3</p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
              Where are you right now?
            </h1>

            <div className="mt-6 space-y-3">
              {levels.map((level) => (
                <OptionCard
                  key={level}
                  label={level}
                  selected={form.level === level}
                  onClick={() => setForm((prev) => ({ ...prev, level }))}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="pb-2 pt-6">
        <Button onClick={handleNext} disabled={!canContinue}>
          {step === totalSteps - 1 ? "Begin journey" : "Continue"}
        </Button>
      </div>
    </main>
  );
}