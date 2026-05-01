"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const struggleStatements = [
  "I struggle to feel motivated to read Qur’an consistently.",
  "I often read Qur’an, but do not understand what I am reading.",
  "I understand parts of the message, but struggle to reflect deeply.",
  "I feel a disconnect between what the Qur’an teaches and how I actually live.",
];

const goals = [
  {
    id: "understand",
    label: "Understand meanings clearly",
    description: "Move beyond reading into knowing what the ayat are saying.",
  },
  {
    id: "consistency",
    label: "Build consistency",
    description: "Develop a steady habit without rushing or burning out.",
  },
  {
    id: "reflection",
    label: "Reflect deeply",
    description: "Pause with the ayat and connect them to your own life.",
  },
  {
    id: "action",
    label: "Apply in daily life",
    description: "Turn learning into small actions you can actually live.",
  },
  {
    id: "discipline",
    label: "Stay disciplined",
    description: "Follow a clear path and keep returning when you fall behind.",
  },
] as const;

const levels = [
  {
    id: "arabic-starting",
    label: "I can barely read",
    description: "I need the path to feel slow, clear, and supportive.",
  },
  {
    id: "reads-no-understanding",
    label: "I can read, but struggle to understand",
    description: "I want help connecting the Arabic to meaning.",
  },
  {
    id: "understands-needs-reflection",
    label: "I understand some meanings, but struggle to reflect",
    description: "I want to go deeper than translation.",
  },
  {
    id: "needs-application",
    label: "I understand, but struggle to implement",
    description: "I want the Qur’an to shape my habits and decisions.",
  },
  {
    id: "deepening",
    label: "I want to deepen an existing connection",
    description: "I already have some consistency and want more depth.",
  },
] as const;

const learningStyles = [
  "Reading-intensive",
  "Interactive activities",
  "Visual explanations",
  "Reading tafsir",
  "Watching videos",
  "Strict structure",
  "Freedom in lesson flow",
] as const;

const structurePreferences = [
  {
    id: "guided",
    label: "Guided",
    description: "Keep me on a clear path, step by step.",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Give me structure, but let me move naturally.",
  },
  {
    id: "flexible",
    label: "Flexible",
    description: "Let me explore more freely.",
  },
] as const;

const timeCommitments = [
  {
    id: "5-10",
    label: "5–10 minutes",
    description: "Small, realistic, and easy to repeat.",
  },
  {
    id: "10-20",
    label: "10–20 minutes",
    description: "Enough time for understanding, reflection, and one action.",
  },
  {
    id: "20-plus",
    label: "20+ minutes",
    description: "A slower, deeper session with more room to think.",
  },
] as const;

const phaseSlides = [
  {
    id: "encounter",
    eyebrow: "Phase 1",
    title: "Encounter",
    subtitle: "Face the كلام of Allah directly.",
    summary:
      "This is the point of direct contact. No explanation yet. No overload. Just exposure to the ayah itself with presence and respect.",
    goal: "Emotional and spiritual exposure before analysis.",
    whatHappens: [
      "Arabic only, in a mushaf-style presentation",
      "No translation yet",
      "No distractions",
    ],
    rule: "Do not overload or explain here.",
  },
  {
    id: "explore",
    eyebrow: "Phase 2",
    title: "Explore",
    subtitle: "Understand what is being said.",
    summary:
      "Here the goal is clarity. The user should walk away knowing what the ayah means without yet being pushed into transformation.",
    goal: "Remove confusion and give clear meaning.",
    whatHappens: [
      "Translation",
      "Brief explanation",
      "Clear wording without too much density",
    ],
    rule: "No transformation yet — just clarity.",
  },
  {
    id: "engage",
    eyebrow: "Phase 3",
    title: "Engage",
    subtitle: "Prove you understood.",
    summary:
      "This is where passive reading becomes active effort. The user should have to think, choose, match, or respond.",
    goal: "Move from passive understanding to active thinking.",
    whatHappens: [
      "True/False chains",
      "Scenario choices",
      "Ayah matching or similar interaction",
    ],
    rule: "If the user can skip this without thinking, it failed.",
  },
  {
    id: "enrich",
    eyebrow: "Phase 4",
    title: "Enrich",
    subtitle: "Deepen and correct understanding.",
    summary:
      "Now the lesson adds layers that make the understanding more grounded, memorable, and nuanced.",
    goal: "Make understanding stick and deepen awareness.",
    whatHappens: [
      "Linguistic insights",
      "Names of Allah",
      "Subtle meanings and corrected misconceptions",
    ],
    rule: "Upgrade shallow understanding into deeper awareness.",
  },
  {
    id: "embody",
    eyebrow: "Phase 5",
    title: "Embody",
    subtitle: "Turn meaning into self-reflection.",
    summary:
      "This is the personal confrontation phase. The lesson stops being only about the ayah and starts becoming about the user.",
    goal: "Shift from ‘I understand’ to ‘this applies to me.’",
    whatHappens: [
      "Reflection prompts",
      "Self-evaluation",
      "Internal confrontation",
    ],
    rule: "This is where the Qur’an becomes personal.",
  },
  {
    id: "execute",
    eyebrow: "Phase 6",
    title: "Execute",
    subtitle: "Commit to action.",
    summary:
      "Without action, the process collapses. This phase converts understanding into a small, specific, realistic step.",
    goal: "Translate knowledge into behavior.",
    whatHappens: [
      "A concrete action",
      "Small and specific commitment",
      "Realistic next-step follow-through",
    ],
    rule: "Knowledge should leave a trace in behavior.",
  },
] as const;

type GoalId = (typeof goals)[number]["id"];

type OnboardingData = {
  level: string;
  goalPriorities: Record<GoalId, number>;
  learningStyles: string[];
  structurePreference: string;
  timeCommitment: string;
};

const initialGoalPriorities = goals.reduce(
  (acc, goal) => {
    acc[goal.id] = 0;
    return acc;
  },
  {} as Record<GoalId, number>,
);

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function HeaderProgress({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const percent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8a7a52]">
          Onboarding
        </p>
        <p className="text-xs font-medium text-[#7a6f5b]">
          {currentStep + 1} / {totalSteps}
        </p>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[#e7dfcb]">
        <div
          className="h-full rounded-full bg-[#1f2f2b] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function ArrowButton({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "back" | "next";
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const isBack = direction === "back";
  const isStart = label === "Start";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cx(
        "flex h-12 items-center justify-center rounded-full border text-sm font-semibold shadow-sm transition active:scale-[0.98]",
        isStart ? "min-w-[92px] px-5" : "w-12",
        disabled
          ? "cursor-not-allowed border-[#e8dfca] bg-[#f4efdf] text-[#b9ab89] shadow-none"
          : isBack
            ? "border-[#e2d8bf] bg-[#fffaf0] text-[#504736] hover:bg-white"
            : "border-[#1f2f2b] bg-[#1f2f2b] text-[#fffaf0] hover:bg-[#2a3d38]",
      )}
    >
      {isBack ? (
        <span className="text-xl leading-none">←</span>
      ) : isStart ? (
        <span className="flex items-center gap-2">
          Start <span className="text-xl leading-none">→</span>
        </span>
      ) : (
        <span className="text-xl leading-none">→</span>
      )}
    </button>
  );
}

function SlideShell({
  eyebrow,
  title,
  body,
  visual,
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  visual?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="animate-[fadeIn_220ms_ease-out]">
      {visual ? <div>{visual}</div> : null}

      <div className={cx(visual ? "mt-8" : "")}>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a7a52]">
          {eyebrow}
        </p>

        <h1 className="mt-3 text-[2.1rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[#1f2f2b]">
          {title}
        </h1>

        {body ? (
          <p className="mt-4 text-[1.03rem] leading-7 text-[#665f50]">{body}</p>
        ) : null}
      </div>

      {children ? <div className="mt-7">{children}</div> : null}
    </section>
  );
}

function PreviewFrame({
  variant,
  badge,
}: {
  variant:
    | "struggle"
    | "ashara"
    | "encounter"
    | "explore"
    | "engage"
    | "enrich"
    | "embody"
    | "execute"
    | "level"
    | "goals"
    | "styles"
    | "structure"
    | "time"
    | "finish";
  badge?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#e3dac2] bg-[linear-gradient(180deg,#f6efdb_0%,#f0e6cb_100%)] p-5 shadow-[0_10px_30px_rgba(70,61,40,0.08)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.6),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(50,80,71,0.08),transparent_30%)]" />

      {badge ? (
        <div className="relative mb-4 inline-flex rounded-full border border-[#dbd0b0] bg-[#fffaf0]/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a6f52]">
          {badge}
        </div>
      ) : null}

      <div className="relative">
        {variant === "struggle" ? (
          <div className="space-y-3 py-2">
            {struggleStatements.map((item, index) => (
              <div
                key={item}
                className={cx(
                  "rounded-[1.35rem] px-4 py-3 shadow-sm",
                  index === 0 && "mr-5 bg-[#fffaf0]",
                  index === 1 && "ml-5 bg-[#f8f1de]",
                  index === 2 && "mr-8 bg-[#fffaf0]",
                  index === 3 && "ml-4 bg-[#f3ead1]",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#1f2f2b]" />
                  <div className="h-2.5 flex-1 rounded-full bg-[#d8caa6]" />
                </div>
                <div className="ml-5 mt-2 h-2.5 w-3/4 rounded-full bg-[#ece1bf]" />
              </div>
            ))}
          </div>
        ) : null}

        {variant === "ashara" ? (
          <div className="rounded-[1.75rem] border border-[#ddd2b3] bg-[#fffaf0]/90 p-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-[#ede2c3]" />
              <div className="flex-1">
                <div className="h-3 w-28 rounded-full bg-[#1f2f2b]" />
                <div className="mt-2 h-2.5 w-24 rounded-full bg-[#d7c89f]" />
              </div>
            </div>
            <div className="mt-4 rounded-[1.5rem] bg-[#6077c8] p-4 text-white">
              <div className="h-2.5 w-24 rounded-full bg-white/70" />
              <div className="mt-3 h-3 w-32 rounded-full bg-white/90" />
              <div className="mt-2 h-2.5 w-24 rounded-full bg-white/70" />
              <div className="mt-4 h-2.5 rounded-full bg-[#4760b6]" />
            </div>
          </div>
        ) : null}

        {["encounter", "explore", "engage", "enrich", "embody", "execute"].includes(
          variant,
        ) ? (
          <div className="mx-auto max-w-[290px] rounded-[2rem] border border-[#ddd2b3] bg-[#fffaf0]/92 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-2.5 w-20 rounded-full bg-[#d9cca8]" />
              <div className="h-7 w-7 rounded-full bg-[#ede2c3]" />
            </div>

            {variant === "encounter" ? (
              <div className="space-y-3">
                <div className="rounded-[1.25rem] bg-[#f8f1de] p-4">
                  <div className="h-3 w-full rounded-full bg-[#1f2f2b]" />
                  <div className="mt-3 h-3 w-5/6 rounded-full bg-[#1f2f2b]" />
                  <div className="mt-3 h-3 w-4/6 rounded-full bg-[#1f2f2b]" />
                </div>
                <div className="h-10 rounded-[1rem] bg-[#f4ecda]" />
              </div>
            ) : null}

            {variant === "explore" ? (
              <div className="space-y-3">
                <div className="rounded-[1.25rem] bg-[#f8f1de] p-4">
                  <div className="h-3 w-full rounded-full bg-[#1f2f2b]" />
                  <div className="mt-3 h-2.5 w-11/12 rounded-full bg-[#d8caa6]" />
                  <div className="mt-2 h-2.5 w-10/12 rounded-full bg-[#e9ddb9]" />
                  <div className="mt-2 h-2.5 w-8/12 rounded-full bg-[#e9ddb9]" />
                </div>
              </div>
            ) : null}

            {variant === "engage" ? (
              <div className="space-y-3">
                <div className="rounded-[1.25rem] border border-[#e5dcc5] p-3">
                  <div className="h-2.5 w-20 rounded-full bg-[#d8caa6]" />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="h-10 rounded-[0.9rem] bg-[#f8f1de]" />
                    <div className="h-10 rounded-[0.9rem] bg-[#1f2f2b]" />
                    <div className="h-10 rounded-[0.9rem] bg-[#f8f1de]" />
                    <div className="h-10 rounded-[0.9rem] bg-[#f8f1de]" />
                  </div>
                </div>
              </div>
            ) : null}

            {variant === "enrich" ? (
              <div className="space-y-3">
                <div className="rounded-[1.25rem] bg-[#f8f1de] p-4">
                  <div className="mb-3 flex gap-2">
                    <div className="rounded-full bg-[#1f2f2b] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white">
                      Insight
                    </div>
                    <div className="rounded-full bg-[#ede2c3] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#6f6247]">
                      Name
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#d8caa6]" />
                  <div className="mt-2 h-2.5 w-10/12 rounded-full bg-[#e9ddb9]" />
                  <div className="mt-2 h-2.5 w-8/12 rounded-full bg-[#e9ddb9]" />
                </div>
              </div>
            ) : null}

            {variant === "embody" ? (
              <div className="space-y-3">
                <div className="rounded-[1.25rem] bg-[#f8f1de] p-4">
                  <div className="h-2.5 w-24 rounded-full bg-[#d8caa6]" />
                  <div className="mt-3 h-2.5 w-full rounded-full bg-[#1f2f2b]" />
                  <div className="mt-2 h-2.5 w-10/12 rounded-full bg-[#1f2f2b]" />
                  <div className="mt-4 h-10 rounded-[1rem] bg-white/80" />
                </div>
              </div>
            ) : null}

            {variant === "execute" ? (
              <div className="space-y-3">
                <div className="rounded-[1.25rem] bg-[#f8f1de] p-4">
                  <div className="h-2.5 w-24 rounded-full bg-[#d8caa6]" />
                  <div className="mt-3 h-11 rounded-[1rem] bg-[#1f2f2b]" />
                  <div className="mt-3 h-10 rounded-[1rem] bg-white/80" />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {variant === "level" ? (
          <div className="space-y-3">
            <div className="h-14 rounded-[1.35rem] bg-[#fffaf0]" />
            <div className="ml-5 h-14 rounded-[1.35rem] bg-[#f8f1de]" />
            <div className="h-14 rounded-[1.35rem] bg-[#fffaf0]" />
          </div>
        ) : null}

        {variant === "goals" ? (
          <div className="space-y-4">
            {[4, 3, 2].map((value, index) => (
              <div key={index} className="rounded-[1.35rem] bg-[#fffaf0] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-2.5 flex-1 rounded-full bg-[#d8caa6]" />
                  <div className="flex gap-1">
                    {Array.from({ length: 4 }).map((_, dotIndex) => (
                      <div
                        key={dotIndex}
                        className={cx(
                          "h-3 w-3 rounded-full",
                          dotIndex < value ? "bg-[#1f2f2b]" : "bg-[#e6dcc3]",
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {variant === "styles" ? (
          <div className="flex flex-wrap gap-2">
            {["Visual", "Tafsir", "Interactive", "Videos", "Structured"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-full bg-[#fffaf0] px-4 py-2 text-xs font-medium text-[#5c5446]"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        ) : null}

        {variant === "structure" ? (
          <div className="rounded-[1.5rem] bg-[#fffaf0] p-4">
            <div className="h-2 rounded-full bg-[#e6dcc3]">
              <div className="h-2 w-1/2 rounded-full bg-[#1f2f2b]" />
            </div>
            <div className="mt-4 flex justify-between text-xs font-medium text-[#7a6f52]">
              <span>Guided</span>
              <span>Flexible</span>
            </div>
          </div>
        ) : null}

        {variant === "time" ? (
          <div className="flex justify-center py-3">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-[#d9cda8] bg-[#fffaf0]">
              <div className="absolute h-12 w-1 origin-bottom -translate-y-6 rounded-full bg-[#1f2f2b]" />
              <div className="absolute h-1 w-9 translate-x-4 rounded-full bg-[#8a7a52]" />
              <div className="h-3 w-3 rounded-full bg-[#1f2f2b]" />
            </div>
          </div>
        ) : null}

        {variant === "finish" ? (
          <div className="flex justify-center py-2">
            <div className="rounded-[2rem] bg-[#fffaf0] px-8 py-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1f2f2b] text-lg text-[#fffaf0]">
                ✓
              </div>
              <div className="mt-4 h-2 w-28 rounded-full bg-[#d8caa6]" />
              <div className="mx-auto mt-2 h-2 w-16 rounded-full bg-[#eee2c2]" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OptionCard({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-[1.6rem] border p-4 text-left transition active:scale-[0.99]",
        selected
          ? "border-[#1f2f2b] bg-[#f2ead2] shadow-sm"
          : "border-[#e3dac4] bg-[#fffaf0] hover:border-[#d0c09b]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[0.98rem] font-semibold text-[#1f2f2b]">
            {label}
          </div>

          {description ? (
            <div className="mt-1.5 text-sm leading-5 text-[#746b59]">
              {description}
            </div>
          ) : null}
        </div>

        <div
          className={cx(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
            selected
              ? "border-[#1f2f2b] bg-[#1f2f2b] text-[#fffaf0]"
              : "border-[#cfc4a8] bg-white",
          )}
        >
          {selected ? "✓" : null}
        </div>
      </div>
    </button>
  );
}

function PriorityRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[#e3dac4] bg-[#fffaf0] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[0.98rem] font-semibold text-[#1f2f2b]">
            {label}
          </div>
          <div className="mt-1.5 text-sm leading-5 text-[#746b59]">
            {description}
          </div>
        </div>

        <div className="shrink-0 rounded-full bg-[#f2ead2] px-2.5 py-1 text-xs font-semibold text-[#645735]">
          {value}/4
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, index) => index + 1).map((priority) => (
          <button
            key={priority}
            type="button"
            onClick={() => onChange(value === priority ? 0 : priority)}
            className={cx(
              "h-10 rounded-[1rem] border text-sm font-semibold transition active:scale-[0.98]",
              value >= priority
                ? "border-[#1f2f2b] bg-[#1f2f2b] text-[#fffaf0]"
                : "border-[#e2d9c1] bg-white text-[#8a7a52]",
            )}
          >
            {priority}
          </button>
        ))}
      </div>
    </div>
  );
}

function StyleChip({
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
      className={cx(
        "rounded-full border px-4 py-2.5 text-sm font-medium transition active:scale-[0.98]",
        selected
          ? "border-[#1f2f2b] bg-[#1f2f2b] text-[#fffaf0]"
          : "border-[#e2d8bf] bg-[#fffaf0] text-[#5f5747]",
      )}
    >
      {label}
    </button>
  );
}

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#e3dac4] bg-[#fffaf0] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7a52]">
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingData>({
    level: "",
    goalPriorities: initialGoalPriorities,
    learningStyles: [],
    structurePreference: "",
    timeCommitment: "",
  });

  const introSlidesCount = 3;
  const phaseStart = introSlidesCount;
  const phaseEnd = phaseStart + phaseSlides.length - 1;
  const levelStep = phaseEnd + 1;
  const goalsStep = levelStep + 1;
  const stylesStep = goalsStep + 1;
  const structureStep = stylesStep + 1;
  const timeStep = structureStep + 1;
  const finishStep = timeStep + 1;
  const totalSteps = finishStep + 1;

  const canContinue = useMemo(() => {
    if (step <= phaseEnd) return true;
    if (step === levelStep) return form.level !== "";
    if (step === goalsStep) {
      return Object.values(form.goalPriorities).some((value) => value > 0);
    }
    if (step === stylesStep) return form.learningStyles.length > 0;
    if (step === structureStep) return form.structurePreference !== "";
    if (step === timeStep) return form.timeCommitment !== "";
    if (step === finishStep) return true;
    return false;
  }, [form, step, phaseEnd, levelStep, goalsStep, stylesStep, structureStep, timeStep, finishStep]);

  function saveOnboardingData() {
    if (typeof window === "undefined") return;

    window.localStorage.setItem("ashara:onboarding", JSON.stringify(form));
    window.localStorage.setItem("ashara:onboarding-complete", "true");
  }

  function handleNext() {
    if (!canContinue) return;

    if (step < totalSteps - 1) {
      setStep((prev) => prev + 1);
      return;
    }

    saveOnboardingData();
    router.push("/home");
  }

  function handleBack() {
    if (step === 0) return;
    setStep((prev) => prev - 1);
  }

  function handleSkip() {
    saveOnboardingData();
    router.push("/home");
  }

  function updateGoalPriority(goalId: GoalId, value: number) {
    setForm((prev) => ({
      ...prev,
      goalPriorities: {
        ...prev.goalPriorities,
        [goalId]: value,
      },
    }));
  }

  function toggleLearningStyle(style: string) {
    setForm((prev) => {
      const alreadySelected = prev.learningStyles.includes(style);

      return {
        ...prev,
        learningStyles: alreadySelected
          ? prev.learningStyles.filter((item) => item !== style)
          : [...prev.learningStyles, style],
      };
    });
  }

  const phaseIndex = step >= phaseStart && step <= phaseEnd ? step - phaseStart : -1;
  const activePhase = phaseIndex >= 0 ? phaseSlides[phaseIndex] : null;

  return (
    <main className="min-h-dvh bg-[#fbf7ec] text-[#1f2f2b]">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-5">
        <div className="sticky top-0 z-10 bg-[#fbf7ec]/92 pb-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold tracking-[-0.01em] text-[#1f2f2b]">
              Ashara
            </p>

            <button
              type="button"
              onClick={handleSkip}
              className="rounded-full border border-[#e2d8bf] bg-[#fffaf0] px-3 py-1.5 text-xs font-semibold text-[#6d6145] shadow-sm active:scale-[0.98]"
            >
              Skip
            </button>
          </div>

          <HeaderProgress currentStep={step} totalSteps={totalSteps} />
        </div>

        <div className="flex-1 overflow-y-auto pb-32 pt-4">
          {step === 0 ? (
            <SlideShell
              eyebrow="The struggle"
              title="Why do we struggle to connect to the Qur’an?"
              body="For many of us, the problem is not that we do not care. The problem is that reading, understanding, reflection, and action often feel disconnected."
              visual={<PreviewFrame variant="struggle" badge="Does this sound like you?" />}
            >
              <div className="space-y-3">
                {struggleStatements.map((statement, index) => (
                  <div
                    key={statement}
                    className={cx(
                      "rounded-[1.5rem] px-4 py-4 shadow-sm",
                      index === 0 && "mr-6 bg-[#fffaf0]",
                      index === 1 && "ml-6 bg-[#f6efdd]",
                      index === 2 && "mr-8 bg-[#fffaf0]",
                      index === 3 && "ml-4 bg-[#f1e7cf]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#1f2f2b]" />
                      <p className="text-[0.98rem] leading-6 text-[#5f5647]">
                        {statement}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SlideShell>
          ) : null}

          {step === 1 ? (
            <SlideShell
              eyebrow="The example"
              title="How did the companions treat the Qur’an?"
              body="Not as a book to get through, but as guidance to absorb and live by."
            >
              <div className="relative mt-4 pl-5">
                <div className="absolute left-0 top-1 h-[88%] w-[3px] rounded-full bg-[#dacda7]" />
                <p className="text-sm font-medium text-[#7a6f58]">
                  Abu ‘Abd ar-Rahmaan as-Sulami said:
                </p>

                <blockquote className="mt-4 text-[1.45rem] font-serif leading-[1.55] tracking-[-0.025em] text-[#24302c]">
                  “Those who used to teach us the Qur’an told us that they used
                  to learn it from the Prophet (blessings and peace of Allah be
                  upon him). When they learned ten verses, they would not move
                  on until they put into practice what those verses said, so we
                  used to learn the Qur’an and how to act upon its teachings
                  together.”
                </blockquote>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7a52]">
                  Tafseer al-Qurtubi · 1/80
                </p>
              </div>
            </SlideShell>
          ) : null}

          {step === 2 ? (
            <SlideShell
              eyebrow="What Ashara is"
              title="A guided way to understand and live the Qur’an."
              body="Ashara is designed around small, focused portions of ayat. It guides the user from direct encounter, to understanding, to reflection, to action."
              visual={<PreviewFrame variant="ashara" badge="App preview" />}
            />
          ) : null}

          {activePhase ? (
            <SlideShell
              eyebrow={activePhase.eyebrow}
              title={activePhase.title}
              body={activePhase.subtitle}
              visual={
                <PreviewFrame
                  variant={activePhase.id}
                  badge="Lesson phase"
                />
              }
            >
              <div className="space-y-4">
                <InfoBlock label="What happens">
                  <ul className="space-y-2.5">
                    {activePhase.whatHappens.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-[#1f2f2b]" />
                        <span className="text-sm leading-6 text-[#665f50]">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </InfoBlock>

                <InfoBlock label="Goal">
                  <p className="text-sm leading-6 text-[#665f50]">
                    {activePhase.goal}
                  </p>
                </InfoBlock>

                <InfoBlock label="Why it matters">
                  <p className="text-sm leading-6 text-[#665f50]">
                    {activePhase.summary}
                  </p>
                </InfoBlock>

                <p className="text-sm font-medium italic text-[#5d574b]">
                  {activePhase.rule}
                </p>
              </div>
            </SlideShell>
          ) : null}

          {step === levelStep ? (
            <SlideShell
              eyebrow="Your starting point"
              title="Where are you right now?"
              body="This helps Ashara shape the depth, pace, and support of your lessons."
              visual={<PreviewFrame variant="level" badge="Personalization" />}
            >
              <div className="space-y-3">
                {levels.map((level) => (
                  <OptionCard
                    key={level.id}
                    label={level.label}
                    description={level.description}
                    selected={form.level === level.id}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, level: level.id }))
                    }
                  />
                ))}
              </div>
            </SlideShell>
          ) : null}

          {step === goalsStep ? (
            <SlideShell
              eyebrow="Your priorities"
              title="What should Ashara help you focus on?"
              body="Rank each goal from 1 to 4. Leave anything at 0 if it is not a priority right now."
              visual={<PreviewFrame variant="goals" badge="Personalization" />}
            >
              <div className="space-y-3">
                {goals.map((goal) => (
                  <PriorityRow
                    key={goal.id}
                    label={goal.label}
                    description={goal.description}
                    value={form.goalPriorities[goal.id]}
                    onChange={(value) => updateGoalPriority(goal.id, value)}
                  />
                ))}
              </div>
            </SlideShell>
          ) : null}

          {step === stylesStep ? (
            <SlideShell
              eyebrow="Learning style"
              title="How do you learn best?"
              body="Choose everything that feels useful. This can shape how lessons are presented later."
              visual={<PreviewFrame variant="styles" badge="Personalization" />}
            >
              <div className="flex flex-wrap gap-2.5">
                {learningStyles.map((style) => (
                  <StyleChip
                    key={style}
                    label={style}
                    selected={form.learningStyles.includes(style)}
                    onClick={() => toggleLearningStyle(style)}
                  />
                ))}
              </div>
            </SlideShell>
          ) : null}

          {step === structureStep ? (
            <SlideShell
              eyebrow="Structure"
              title="How guided should your journey feel?"
              body="Some people need a clearer path. Others need more room to explore. Choose what helps you stay consistent."
              visual={<PreviewFrame variant="structure" badge="Personalization" />}
            >
              <div className="space-y-3">
                {structurePreferences.map((preference) => (
                  <OptionCard
                    key={preference.id}
                    label={preference.label}
                    description={preference.description}
                    selected={form.structurePreference === preference.id}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        structurePreference: preference.id,
                      }))
                    }
                  />
                ))}
              </div>
            </SlideShell>
          ) : null}

          {step === timeStep ? (
            <SlideShell
              eyebrow="Pace"
              title="How much time can you realistically give?"
              body="A small amount done with focus is better than a large amount done without presence."
              visual={<PreviewFrame variant="time" badge="Personalization" />}
            >
              <div className="space-y-3">
                {timeCommitments.map((time) => (
                  <OptionCard
                    key={time.id}
                    label={time.label}
                    description={time.description}
                    selected={form.timeCommitment === time.id}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        timeCommitment: time.id,
                      }))
                    }
                  />
                ))}
              </div>
            </SlideShell>
          ) : null}

          {step === finishStep ? (
            <SlideShell
              eyebrow="Ready"
              title="Your journey begins with one portion at a time."
              body="Ashara will guide you through focused lessons designed for encounter, understanding, reflection, and action."
              visual={<PreviewFrame variant="finish" badge="Ready to begin" />}
            >
              <div className="rounded-[1.6rem] border border-[#e3dac4] bg-[#fffaf0] p-4">
                <p className="text-sm font-semibold text-[#1f2f2b]">
                  Your setup is ready.
                </p>
                <p className="mt-1.5 text-sm leading-6 text-[#665f50]">
                  Start with your first lesson and build depth without rushing
                  the process.
                </p>
              </div>
            </SlideShell>
          ) : null}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 bg-gradient-to-t from-[#fbf7ec] via-[#fbf7ec] to-[#fbf7ec]/0 px-7 pb-5 pt-8">
        <div className="flex items-center justify-between">
          <ArrowButton
            direction="back"
            label="Back"
            disabled={step === 0}
            onClick={handleBack}
          />

          <ArrowButton
            direction="next"
            label={step === totalSteps - 1 ? "Start" : "Next"}
            disabled={!canContinue}
            onClick={handleNext}
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}