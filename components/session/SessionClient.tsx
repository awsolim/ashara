"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import type { LessonStep, Segment } from "@/lib/data/types";

type Ayah = {
  number: number;
  arabic: string;
  translation: string;
  tafsir: string;
  audioUrl: string;
};

type SessionSegment = Segment & {
  arabic?: string;
  translation?: string;
  ayahs?: Ayah[];
};

type SessionClientProps = {
  segment: SessionSegment;
  journeyId: string;
};

type TrueFalseStatement = {
  text: string;
  answer: boolean;
  explanation?: string;
};

type ChoiceOption = {
  text: string;
  correct?: boolean;
  feedback?: string;
};

const PHASE_LABELS: Record<string, string> = {
  encounter: "Encounter",
  explore: "Explore",
  engage: "Engage",
  enrich: "Enrich",
  embody: "Embody",
  execute: "Execute",
};

function getSurahNameArabic(surahNumber: number): string {
  const names = [
    "الفاتحة",
    "البقرة",
    "آل عمران",
    "النساء",
    "المائدة",
    "الأنعام",
    "الأعراف",
    "الأنفال",
    "التوبة",
    "يونس",
    "هود",
    "يوسف",
    "الرعد",
    "إبراهيم",
    "الحجر",
    "النحل",
    "الإسراء",
    "الكهف",
    "مريم",
    "طه",
    "الأنبياء",
    "الحج",
    "المؤمنون",
    "النور",
    "الفرقان",
    "الشعراء",
    "النمل",
    "القصص",
    "العنكبوت",
    "الروم",
    "لقمان",
    "السجدة",
    "الأحزاب",
    "سبأ",
    "فاطر",
    "يس",
    "الصافات",
    "ص",
    "الزمر",
    "غافر",
    "فصلت",
    "الشورى",
    "الزخرف",
    "الدخان",
    "الجاثية",
    "الأحقاف",
    "محمد",
    "الفتح",
    "الحجرات",
    "ق",
    "الذاريات",
    "الطور",
    "النجم",
    "القمر",
    "الرحمن",
    "الواقعة",
    "الحديد",
    "المجادلة",
    "الحشر",
    "الممتحنة",
    "الصف",
    "الجمعة",
    "المنافقون",
    "التغابن",
    "الطلاق",
    "التحريم",
    "الملك",
    "القلم",
    "الحاقة",
    "المعارج",
    "نوح",
    "الجن",
    "المزمل",
    "المدثر",
    "القيامة",
    "الإنسان",
    "المرسلات",
    "النبأ",
    "النازعات",
    "عبس",
    "التكوير",
    "الانفطار",
    "المطففين",
    "الانشقاق",
    "البروج",
    "الطارق",
    "الأعلى",
    "الغاشية",
    "الفجر",
    "البلد",
    "الشمس",
    "الليل",
    "الضحى",
    "الشرح",
    "التين",
    "العلق",
    "القدر",
    "البينة",
    "الزلزلة",
    "العاديات",
    "القارعة",
    "التكاثر",
    "العصر",
    "الهمزة",
    "الفيل",
    "قريش",
    "الماعون",
    "الكوثر",
    "الكافرون",
    "النصر",
    "المسد",
    "الإخلاص",
    "الفلق",
    "الناس",
  ];

  return names[surahNumber - 1] ?? "";
}

function toArabicNumber(value: number): string {
  return new Intl.NumberFormat("ar-EG", { useGrouping: false }).format(value);
}

function getString(content: Record<string, unknown>, key: string): string {
  const value = content[key];
  return typeof value === "string" ? value : "";
}

function getStringArray(content: Record<string, unknown>, key: string): string[] {
  const value = content[key];

  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string");
}

function getTrueFalseStatements(
  content: Record<string, unknown>
): TrueFalseStatement[] {
  const value = content.statements;

  if (!Array.isArray(value)) return [];

  const statements: TrueFalseStatement[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;

    const row = item as Record<string, unknown>;

    if (typeof row.text !== "string" || typeof row.answer !== "boolean") {
      continue;
    }

    statements.push({
      text: row.text,
      answer: row.answer,
      explanation:
        typeof row.explanation === "string" ? row.explanation : undefined,
    });
  }

  return statements;
}

function getChoiceOptions(content: Record<string, unknown>): ChoiceOption[] {
  const value = content.options;

  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") {
        return {
          text: item,
        };
      }

      if (!item || typeof item !== "object") return null;

      const row = item as Record<string, unknown>;

      if (typeof row.text !== "string") return null;

      return {
        text: row.text,
        correct: typeof row.correct === "boolean" ? row.correct : undefined,
        feedback: typeof row.feedback === "string" ? row.feedback : undefined,
      };
    })
    .filter((item): item is ChoiceOption => item !== null);
}

export default function SessionClient({
  segment,
  journeyId,
}: SessionClientProps) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [openedTranslations, setOpenedTranslations] = useState<Set<number>>(
    () => new Set()
  );
  const [openTranslations, setOpenTranslations] = useState<Set<number>>(
    () => new Set()
  );
  const [openTafsir, setOpenTafsir] = useState<Set<number>>(() => new Set());
  const [continueMessage, setContinueMessage] = useState("");

  const [trueFalseAnswers, setTrueFalseAnswers] = useState<
    Record<string, Record<number, boolean>>
  >({});
  const [scenarioSelections, setScenarioSelections] = useState<
    Record<string, string>
  >({});
  const [anchorSelections, setAnchorSelections] = useState<
    Record<string, string>
  >({});
  const [actionSelections, setActionSelections] = useState<
    Record<string, string>
  >({});

  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const question = segment?.questions?.[0] ?? null;
  const ayahs = segment.ayahs ?? [];
  const lessonSteps = segment.lessonSteps ?? [];
  const hasLessonSteps = lessonSteps.length > 0;

  const fallbackSteps = useMemo(
    () => [
      "understanding",
      "focus",
      "interaction",
      "reflection",
      "action",
    ],
    []
  );

  const totalSteps = 2 + (hasLessonSteps ? lessonSteps.length : fallbackSteps.length) + 1;
  const completeStepIndex = totalSteps - 1;

  const progressPercent = useMemo(() => {
    return Math.round(((step + 1) / totalSteps) * 100);
  }, [step, totalSteps]);

  const allTranslationsOpened =
    ayahs.length > 0 && openedTranslations.size >= ayahs.length;

  const currentLessonStep =
    hasLessonSteps && step >= 2 && step < completeStepIndex
      ? lessonSteps[step - 2]
      : null;

  function toggleTranslation(ayahNumber: number) {
    setContinueMessage("");

    setOpenTranslations((current) => {
      const nextSet = new Set(current);

      if (nextSet.has(ayahNumber)) {
        nextSet.delete(ayahNumber);
      } else {
        nextSet.add(ayahNumber);
      }

      return nextSet;
    });

    setOpenedTranslations((current) => {
      const nextSet = new Set(current);
      nextSet.add(ayahNumber);
      return nextSet;
    });
  }

  function toggleTafsir(ayahNumber: number) {
    setOpenTafsir((current) => {
      const nextSet = new Set(current);

      if (nextSet.has(ayahNumber)) {
        nextSet.delete(ayahNumber);
      } else {
        nextSet.add(ayahNumber);
      }

      return nextSet;
    });
  }

  function stepIsBlocked() {

    if (!currentLessonStep) return false;

    if (currentLessonStep.stepType === "true_false_chain") {
      const statements = getTrueFalseStatements(currentLessonStep.content);
      const answers = trueFalseAnswers[currentLessonStep.id] ?? {};

      if (statements.length > 0 && Object.keys(answers).length < statements.length) {
        setContinueMessage("Answer each statement before continuing.");
        return true;
      }
    }

    if (currentLessonStep.stepType === "scenario_choice") {
      if (!scenarioSelections[currentLessonStep.id]) {
        setContinueMessage("Choose an answer before continuing.");
        return true;
      }
    }

    if (currentLessonStep.stepType === "anchor_choice") {
      if (!anchorSelections[currentLessonStep.id]) {
        setContinueMessage("Choose one anchor before continuing.");
        return true;
      }
    }

    if (currentLessonStep.stepType === "action_choice") {
      if (!actionSelections[currentLessonStep.id]) {
        setContinueMessage("Choose one action before continuing.");
        return true;
      }
    }

    return false;
  }

  function next() {
    if (stepIsBlocked()) return;

    setContinueMessage("");

    if (step < totalSteps - 1) {
      setStep((current) => current + 1);
    }
  }

  function finish() {
    const chosenDynamicAction = Object.values(actionSelections)[0];

    if (selectedAction || chosenDynamicAction) {
      localStorage.setItem(
        "ashara_pending_action",
        selectedAction ?? chosenDynamicAction
      );
      localStorage.setItem("ashara_last_session_title", `${segment.title}`);
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

    setContinueMessage("");
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
        <span className="text-[15px] font-medium leading-6 text-[#171717]">
          {label}
        </span>
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

  function renderLessonStep(lessonStep: LessonStep) {
    const content = lessonStep.content;
    const eyebrow = PHASE_LABELS[lessonStep.phase] ?? lessonStep.phase;
    const title = lessonStep.title ?? lessonStep.prompt ?? eyebrow;

    if (lessonStep.stepType === "key_word") {
      return (
        <StepShell eyebrow={eyebrow} title={title}>
          <Card className="bg-white">
            <p
              dir="rtl"
              lang="ar"
              className="text-right font-serif text-[2rem] leading-12 text-[#171717]"
            >
              {getString(content, "word")}
            </p>
            <p className="mt-4 text-lg font-semibold text-[#171717]">
              {getString(content, "meaning")}
            </p>
            <p className="mt-3 text-[15px] leading-7 text-[#4d4942]">
              {getString(content, "note")}
            </p>
          </Card>
        </StepShell>
      );
    }

    if (lessonStep.stepType === "divine_name") {
      return (
        <StepShell eyebrow={eyebrow} title={title}>
          <Card className="bg-[#fbf7ed]">
            <p
              dir="rtl"
              lang="ar"
              className="text-center font-serif text-[2.1rem] leading-12 text-[#171717]"
            >
              {getString(content, "name")}
            </p>
            <p className="mt-5 text-lg font-semibold text-[#171717]">
              {getString(content, "meaning")}
            </p>
            <p className="mt-3 text-[15px] leading-7 text-[#4d4942]">
              {getString(content, "lesson")}
            </p>
          </Card>
        </StepShell>
      );
    }

    if (lessonStep.stepType === "true_false_chain") {
      const statements = getTrueFalseStatements(content);
      const answers = trueFalseAnswers[lessonStep.id] ?? {};

      return (
        <StepShell eyebrow={eyebrow} title={title}>
          <div className="space-y-4">
            {statements.map((statement, index) => {
              const selected = answers[index];

              return (
                <Card key={`${statement.text}-${index}`} className="bg-white">
                  <p className="text-[15px] font-medium leading-7 text-[#171717]">
                    {statement.text}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[true, false].map((answer) => (
                      <button
                        key={String(answer)}
                        type="button"
                        onClick={() =>
                          setTrueFalseAnswers((current) => ({
                            ...current,
                            [lessonStep.id]: {
                              ...(current[lessonStep.id] ?? {}),
                              [index]: answer,
                            },
                          }))
                        }
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          selected === answer
                            ? "border-[#1f5c4c] bg-[#edf5f1] text-[#1f5c4c]"
                            : "border-[#e6e0d7] bg-white text-[#5f5a53]"
                        }`}
                      >
                        {answer ? "True" : "False"}
                      </button>
                    ))}
                  </div>

                  {typeof selected === "boolean" ? (
                    <p className="mt-4 rounded-2xl bg-[#fbfaf7] px-4 py-3 text-sm leading-6 text-[#4d4942]">
                      {selected === statement.answer
                        ? statement.explanation ?? "Correct."
                        : statement.explanation ??
                          `Not quite. The correct answer is ${
                            statement.answer ? "True" : "False"
                          }.`}
                    </p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </StepShell>
      );
    }

    if (lessonStep.stepType === "scenario_choice") {
      const options = getChoiceOptions(content);
      const selected = scenarioSelections[lessonStep.id];
      const selectedOption = options.find((option) => option.text === selected);

      return (
        <StepShell
          eyebrow={eyebrow}
          title={lessonStep.prompt ?? title}
        >
          <div className="space-y-3">
            {options.map((option) => (
              <Option
                key={option.text}
                label={option.text}
                selected={selected === option.text}
                onClick={() =>
                  setScenarioSelections((current) => ({
                    ...current,
                    [lessonStep.id]: option.text,
                  }))
                }
              />
            ))}
          </div>

          {selectedOption ? (
            <Card className="mt-4 bg-[#fcfbf8]">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#7b756d]">
                Response
              </p>
              <p className="mt-3 text-[15px] leading-7 text-[#2d2b28]">
                {selectedOption.feedback ??
                  (selectedOption.correct
                    ? "That answer fits the meaning of these ayat."
                    : "Look again at what the ayat are teaching.")}
              </p>
            </Card>
          ) : null}
        </StepShell>
      );
    }

    if (lessonStep.stepType === "ayah_match") {
      const prompt = lessonStep.prompt ?? title;
      const correctAyah = getString(content, "correctAyah");

      return (
        <StepShell eyebrow={eyebrow} title={prompt}>
          <div className="space-y-3">
            {ayahs.map((ayah) => (
              <Option
                key={ayah.number}
                label={`Ayah ${ayah.number}`}
                selected={selectedAnswer === String(ayah.number)}
                onClick={() => setSelectedAnswer(String(ayah.number))}
              />
            ))}
          </div>

          {selectedAnswer ? (
            <Card className="mt-4 bg-[#fcfbf8]">
              <p className="text-[15px] leading-7 text-[#2d2b28]">
                {selectedAnswer === correctAyah
                  ? getString(content, "success") || "Correct."
                  : getString(content, "feedback") ||
                    `Look for ayah ${correctAyah}.`}
              </p>
            </Card>
          ) : null}
        </StepShell>
      );
    }

    if (lessonStep.stepType === "insight") {
      return (
        <StepShell eyebrow={eyebrow} title={title}>
          <Card className="bg-[#f6f1e8]">
            <p className="text-[15px] leading-7 text-[#2d2b28]">
              {getString(content, "body")}
            </p>
          </Card>
        </StepShell>
      );
    }

    if (lessonStep.stepType === "role_model") {
      return (
        <StepShell eyebrow={eyebrow} title={title}>
          <Card className="bg-white">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#7b756d]">
              {getString(content, "person")}
            </p>
            <p className="mt-3 text-[15px] leading-7 text-[#2d2b28]">
              {getString(content, "body")}
            </p>
          </Card>
        </StepShell>
      );
    }

    if (lessonStep.stepType === "anchor_choice") {
      const options = getChoiceOptions(content);
      const selected = anchorSelections[lessonStep.id];

      return (
        <StepShell eyebrow={eyebrow} title={title}>
          <div className="space-y-3">
            {options.map((option) => (
              <Option
                key={option.text}
                label={option.text}
                selected={selected === option.text}
                onClick={() =>
                  setAnchorSelections((current) => ({
                    ...current,
                    [lessonStep.id]: option.text,
                  }))
                }
              />
            ))}
          </div>
        </StepShell>
      );
    }

    if (lessonStep.stepType === "reflection_prompt") {
      return (
        <StepShell eyebrow={eyebrow} title={title}>
          <Card className="bg-white">
            <p className="text-[15px] leading-7 text-[#2d2b28]">
              {lessonStep.prompt || getString(content, "prompt")}
            </p>
          </Card>
        </StepShell>
      );
    }

    if (lessonStep.stepType === "action_choice") {
      const options = getChoiceOptions(content);
      const selected = actionSelections[lessonStep.id];

      return (
        <StepShell eyebrow={eyebrow} title={title}>
          <div className="space-y-3">
            {options.map((option) => (
              <Option
                key={option.text}
                label={option.text}
                selected={selected === option.text}
                onClick={() =>
                  setActionSelections((current) => ({
                    ...current,
                    [lessonStep.id]: option.text,
                  }))
                }
              />
            ))}
          </div>
        </StepShell>
      );
    }

    return (
      <StepShell eyebrow={eyebrow} title={title}>
        <Card>
          <p className="text-[15px] leading-7 text-[#2d2b28]">
            This step type is not supported yet.
          </p>
        </Card>
      </StepShell>
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
                Step {step + 1} of {totalSteps}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <ProgressBar value={progressPercent} />
          </div>
        </section>

        {step === 0 ? (
          <StepShell eyebrow="Encounter" title={segment.title}>
            <Card className="overflow-hidden border-[#e8ddc9] bg-[#fbf7ed]">
              <div className="rounded-[1.75rem] border border-[#e4d6bd] bg-[#fffaf0] px-4 py-5 shadow-sm">
  <div className="mb-3 border border-[#8d7650] bg-[#fbf3df] px-3 py-2 text-center shadow-sm">
    <div className="border border-[#b9a174] px-4 py-4 text-center">
      <p
        dir="rtl"
        lang="ar"
        className="text-center font-serif text-[2rem] leading-none text-[#2a2115]"
      >
        سُورَةُ{" "}
        {typeof segment.surahNumber === "number"
          ? getSurahNameArabic(segment.surahNumber)
          : ""}
      </p>
    </div>
  </div>

  <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-[#8a7654]">
    Ayah {segment.ayahStart}–{segment.ayahEnd}
  </p>

                {segment.ayahStart === 1 ? (
                  <p
                    dir="rtl"
                    lang="ar"
                    className="mb-5 text-center font-serif text-[1.7rem] leading-[2.8rem] text-[#2a2115]"
                  >
                    بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
                  </p>
                ) : null}

                <p
                  dir="rtl"
                  lang="ar"
                  className="text-center font-serif text-[2rem] leading-[3.6rem] text-[#171717]"
                >
                  {ayahs.length > 0
                    ? ayahs.map((ayah) => (
                        <span key={ayah.number}>
                          {ayah.arabic}
{"\u00A0\u00A0"}
<span className="inline-flex h-7 w-7 -translate-y-1 items-center justify-center rounded-full border border-[#c7b185] bg-linear-to-b from-[#fffaf0] to-[#f3e7cf] align-middle text-[0.7rem] font-semibold leading-none text-[#5c4a2f] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]">
  {ayah.number}
</span>
{"\u00A0\u00A0"}
                        </span>
                      ))
                    : segment.arabic || "Arabic text will appear here."}
                </p>
              </div>
            </Card>
          </StepShell>
        ) : null}

        {step === 1 ? (
          <StepShell eyebrow="Explore" title="Read each ayah with meaning">
            <div className="space-y-4">
              {ayahs.map((ayah) => {
                const translationIsOpen = openTranslations.has(ayah.number);
                const tafsirIsOpen = openTafsir.has(ayah.number);

                return (
                  <Card key={ayah.number} className="bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-[#7b756d]">
                        Ayah {ayah.number}
                      </p>

                      <div className="flex items-center gap-1 text-[#7b756d]">
  <button
    type="button"
    aria-label="Bookmark ayah"
    className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5 active:bg-black/10"
  >
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.5L6 21V4.75Z" />
    </svg>
  </button>

  <button
    type="button"
    aria-label="Add note"
    className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5 active:bg-black/10"
  >
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 4.75A1.75 1.75 0 0 1 6.75 3h10.5A1.75 1.75 0 0 1 19 4.75v14.5A1.75 1.75 0 0 1 17.25 21H6.75A1.75 1.75 0 0 1 5 19.25V4.75Z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  </button>

  <button
  type="button"
  aria-label="Play ayah audio"
 onClick={() => {
  if (!ayah.audioUrl) return;

  if (playingAyah === ayah.number && audioElement) {
    audioElement.pause();
    setPlayingAyah(null);
    return;
  }

  audioElement?.pause();

  const audio = new Audio(ayah.audioUrl);
  setAudioElement(audio);
  setPlayingAyah(ayah.number);

  audio.onended = () => {
    setPlayingAyah(null);
  };

  audio.play();
}}
  className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5 active:bg-black/10"
>
    {playingAyah === ayah.number ? (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M7 5.5A1.5 1.5 0 0 1 8.5 4h1A1.5 1.5 0 0 1 11 5.5v13A1.5 1.5 0 0 1 9.5 20h-1A1.5 1.5 0 0 1 7 18.5v-13Z" />
    <path d="M13 5.5A1.5 1.5 0 0 1 14.5 4h1A1.5 1.5 0 0 1 17 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-13Z" />
  </svg>
) : (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M8 5.75c0-.82.9-1.31 1.58-.86l8.2 5.47a1.03 1.03 0 0 1 0 1.72l-8.2 5.47A1.03 1.03 0 0 1 8 16.69V5.75Z" />
  </svg>
)}
  </button>
</div>
                    </div>

                    <p
                      dir="rtl"
                      lang="ar"
                      className="mt-4 text-right font-serif text-[1.8rem] leading-[3.2rem] text-[#171717]"
                    >
                      {ayah.arabic}
                    </p>

                    <div className="mt-5 space-y-3 border-t border-[#eee6db] pt-4">
                      <button
                        type="button"
                        onClick={() => toggleTranslation(ayah.number)}
                        className="flex w-full items-center justify-between rounded-2xl bg-[#fbfaf7] px-4 py-3 text-left"
                      >
                        <span className="text-sm font-medium text-[#2d2b28]">
                          Translation
                        </span>
                        <span className="text-[#7b756d]">
                          {translationIsOpen ? "−" : "+"}
                        </span>
                      </button>

                      {translationIsOpen ? (
                        <p className="px-1 text-[15px] leading-7 text-[#3d3a35]">
                          {ayah.translation || "Translation unavailable."}
                        </p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => toggleTafsir(ayah.number)}
                        className="flex w-full items-center justify-between rounded-2xl bg-[#fbfaf7] px-4 py-3 text-left"
                      >
                        <span className="text-sm font-medium text-[#2d2b28]">
                          Tafsir
                        </span>
                        <span className="text-[#7b756d]">
                          {tafsirIsOpen ? "−" : "+"}
                        </span>
                      </button>

                      {tafsirIsOpen ? (
                        <p className="px-1 text-[15px] leading-7 text-[#5a554e]">
                          {ayah.tafsir || "Tafsir unavailable for this ayah."}
                        </p>
                      ) : null}
                    </div>
                  </Card>
                );
              })}

              {continueMessage ? (
                <p className="rounded-2xl bg-[#f6f1e8] px-4 py-3 text-sm text-[#6b4f24]">
                  {continueMessage}
                </p>
              ) : null}
            </div>
          </StepShell>
        ) : null}

        {currentLessonStep ? renderLessonStep(currentLessonStep) : null}

        {!hasLessonSteps && step === 2 ? (
          <StepShell eyebrow="Enrich" title="What these ayat are showing">
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

        {!hasLessonSteps && step === 3 ? (
          <StepShell eyebrow="Embody" title="Carry one central takeaway">
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

        {!hasLessonSteps && step === 4 ? (
          question ? (
            <StepShell eyebrow="Engage" title={question.prompt}>
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
                      ? question.explanation ||
                        "That’s the best fit for these ayat."
                      : `A stronger fit here is: ${question.correctAnswer}. ${
                          question.explanation || ""
                        }`}
                  </p>
                </Card>
              ) : null}
            </StepShell>
          ) : (
            <StepShell eyebrow="Engage" title="No question available">
              <Card>
                <p className="text-[15px] leading-7 text-[#2d2b28]">
                  This segment does not currently have an application question.
                </p>
              </Card>
            </StepShell>
          )
        ) : null}

        {!hasLessonSteps && step === 5 ? (
          <StepShell eyebrow="Embody" title="Bring it into your life">
            <Card className="bg-white">
              <p className="text-[15px] leading-7 text-[#2d2b28]">
                {segment.reflectionPrompt}
              </p>
            </Card>
          </StepShell>
        ) : null}

        {!hasLessonSteps && step === 6 ? (
          <StepShell eyebrow="Execute" title="Choose one action for today">
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

        {step === completeStepIndex ? (
          <StepShell eyebrow="Complete" title="Carry this with you today">
            <Card className="bg-[#f6f1e8]">
              <p className="text-[15px] leading-7 text-[#2d2b28]">
                Your next return begins with honesty: did you actually follow
                through on what you chose?
              </p>

              {(selectedAction || Object.values(actionSelections)[0]) ? (
                <div className="mt-5 rounded-2xl bg-white px-4 py-4">
                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#7b756d]">
                    Chosen action
                  </p>
                  <p className="mt-2 text-[15px] leading-7 text-[#171717]">
                    {selectedAction || Object.values(actionSelections)[0]}
                  </p>
                </div>
              ) : null}
            </Card>
          </StepShell>
        ) : null}

        {continueMessage && step !== 1 ? (
          <p className="mt-5 rounded-2xl bg-[#f6f1e8] px-4 py-3 text-sm text-[#6b4f24]">
            {continueMessage}
          </p>
        ) : null}
      </div>

      <div className="pt-6">
        {step < completeStepIndex ? (
          <Button
            onClick={next}
            disabled={
              !hasLessonSteps &&
              ((step === 4 && !!question && !selectedAnswer) ||
                (step === 6 && !selectedAction))
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