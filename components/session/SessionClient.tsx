"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import type { Segment } from "@/lib/data/types";

type Ayah = {
  number: number;
  arabic: string;
  translation: string;
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

function getSurahNameArabic(surahNumber: number): string {
  const names = [
    "الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس",
    "هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه",
    "الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم",
    "لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر",
    "فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق",
    "الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة",
    "الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج",
    "نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس",
    "التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد",
    "الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات",
    "القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر",
    "المسد","الإخلاص","الفلق","الناس"
  ];

  return names[surahNumber - 1] ?? "";
}

function toArabicNumber(value: number): string {
  return new Intl.NumberFormat("ar-EG", { useGrouping: false }).format(value);
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

  const question = segment?.questions?.[0] ?? null;
  const ayahs = segment.ayahs ?? [];

  const steps = useMemo(
    () => [
      "recitation",
      "study",
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

  const allTranslationsOpened =
    ayahs.length > 0 && openedTranslations.size >= ayahs.length;

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

  function next() {
    if (step === 1 && !allTranslationsOpened) {
      setContinueMessage("Open each translation once before continuing.");
      return;
    }

    setContinueMessage("");

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
    }
  }

  function finish() {
    if (selectedAction) {
      localStorage.setItem("ashara_pending_action", selectedAction);
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
        <div className="flex items-center justify-between gap-4">
          <span className="text-[15px] font-medium text-[#171717]">
            {label}
          </span>
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
            <Card className="overflow-hidden border-[#e8ddc9] bg-[#fbf7ed]">
              <div className="rounded-[1.75rem] border border-[#e4d6bd] bg-[#fffaf0] px-4 py-5 shadow-sm">
                <div className="mb-6 border border-[#8d7650] bg-[#fbf3df] px-3 py-2 text-center shadow-sm">
  <div className="grid grid-cols-[42px_1fr_42px] items-center border border-[#b9a174] px-2 py-2">
    <div className="mx-auto h-7 w-7 rounded-full border border-[#8d7650]" />

    <div className="border-x border-[#c7b185] px-3 text-center">
      <p
        dir="rtl"
        lang="ar"
        className="text-center font-serif text-[1.55rem] leading-none text-[#2a2115]"
      >
      سُورَةُ{" "}
{typeof segment.surahNumber === "number"
  ? getSurahNameArabic(segment.surahNumber)
  : ""}
      </p>

      <p className="mt-2 text-center text-[0.65rem] font-medium uppercase tracking-[0.18em] text-[#8a7654]">
        Ayah {segment.ayahStart}–{segment.ayahEnd}
      </p>
    </div>

    <div className="mx-auto h-7 w-7 rounded-full border border-[#8d7650]" />
  </div>
</div>

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
                          {ayah.arabic}{" "}
                          <span className="mx-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#c7ad7a] text-[1rem] leading-none text-[#7b5f2b]">
                            {toArabicNumber(ayah.number)}
                          </span>{" "}
                        </span>
                      ))
                    : segment.arabic || "Arabic text will appear here."}
                </p>
              </div>
            </Card>
          </StepShell>
        ) : null}

        {step === 1 ? (
          <StepShell eyebrow="Study" title="Read each ayah with meaning">
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

                      <div className="flex items-center gap-2 text-sm text-[#7b756d]">
                        <button type="button" className="rounded-full px-2 py-1">
                          ◇
                        </button>
                        <button type="button" className="rounded-full px-2 py-1">
                          Note
                        </button>
                        <button type="button" className="rounded-full px-2 py-1">
                          Play
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
                          Tafsir will be added here later.
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

        {step === 2 ? (
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

        {step === 3 ? (
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

        {step === 4 ? (
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
            <StepShell eyebrow="Apply" title="No question available">
              <Card>
                <p className="text-[15px] leading-7 text-[#2d2b28]">
                  This segment does not currently have an application question.
                </p>
              </Card>
            </StepShell>
          )
        ) : null}

        {step === 5 ? (
          <StepShell eyebrow="Reflect" title="Bring it into your life">
            <Card className="bg-white">
              <p className="text-[15px] leading-7 text-[#2d2b28]">
                {segment.reflectionPrompt}
              </p>
            </Card>
          </StepShell>
        ) : null}

        {step === 6 ? (
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

        {step === 7 ? (
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
              (step === 4 && !!question && !selectedAnswer) ||
              (step === 6 && !selectedAction)
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