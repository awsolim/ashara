"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import { useAppData } from "@/components/providers/AppDataProvider";
import {
  getJourneyCardTheme,
  slugifyJourneyName,
} from "@/lib/data/journey-builder";
import {
  createJourneyInDb,
  createLessonSegment,
  getLessonStepsForSegment,
  replaceLessonStepsForSegment,
  updateJourneyInDb,
  updateLessonSegment,
  uploadJourneyArt,
} from "@/lib/data/db-builder";
import type {
  Journey,
  LessonPhase,
  LessonStep,
  LessonStepType,
  Segment,
} from "@/lib/data/types";

const swatches = [
  "#7CC8D0",
  "#7A9660",
  "#D9C07A",
  "#B8A8D8",
  "#D8A18A",
  "#8BA6D9",
  "#91B8A8",
  "#C79D7C",
  "#A55D52",
  "#5F7DB8",
];

const phases: LessonPhase[] = [
  "engage",
  "enrich",
  "embody",
  "execute",
];

const stepTypes: LessonStepType[] = [
  "key_word",
  "divine_name",
  "true_false_chain",
  "scenario_choice",
  "ayah_match",
  "insight",
  "role_model",
  "anchor_choice",
  "reflection_prompt",
  "action_choice",
];

type BuilderMode = "add" | "edit" | "add-lesson" | "edit-lesson";
type MenuType = "add" | "edit" | null;

type BuilderForm = {
  journeyId: string;
  surahName: string;
  cardColor: string;
  artImageUrl: string;
  artPositionX: number;
  artScale: number;
};

type LessonForm = {
  journeyId: string;
  segmentId: string;
  title: string;
  surahNumber: string;
  ayahStart: string;
  ayahEnd: string;
};

type StepDraft = {
  localId: string;
  phase: LessonPhase;
  stepType: LessonStepType;
  title: string;
  prompt: string;
  contentText: string;
};

const emptyForm: BuilderForm = {
  journeyId: "",
  surahName: "",
  cardColor: "#7CC8D0",
  artImageUrl: "",
  artPositionX: 0,
  artScale: 1,
};

const emptyLessonForm: LessonForm = {
  journeyId: "",
  segmentId: "",
  title: "",
  surahNumber: "",
  ayahStart: "",
  ayahEnd: "",
};

function createDefaultStep(): StepDraft {
  return {
    localId: crypto.randomUUID(),
    phase: "engage",
    stepType: "true_false_chain",
    title: "New step",
    prompt: "",
    contentText: getStepPlaceholder("true_false_chain"),
  };
}

function mapStepToDraft(step: LessonStep): StepDraft {
  return {
    localId: step.id,
    phase: step.phase,
    stepType: step.stepType,
    title: step.title ?? "",
    prompt: step.prompt ?? "",
    contentText: JSON.stringify(step.content ?? {}, null, 2),
  };
}

function getNextLessonStart(journey: Journey) {
  if (journey.segments.length === 0) return 1;

  const lastSegment = journey.segments.reduce((latest, current) =>
    current.ayahEnd > latest.ayahEnd ? current : latest
  );

  return lastSegment.ayahEnd + 1;
}

function getStepPlaceholder(stepType: LessonStepType) {
  if (stepType === "true_false_chain") {
    return JSON.stringify(
      {
        statements: [
          {
            text: "Allah created life and death.",
            answer: true,
            explanation: "Short feedback after the user answers.",
          },
          {
            text: "Life was created without purpose.",
            answer: false,
            explanation: "Short feedback after the user answers.",
          },
        ],
      },
      null,
      2
    );
  }

  if (stepType === "scenario_choice") {
    return JSON.stringify(
      {
        options: [
          {
            text: "Person A responds with patience.",
            correct: true,
            feedback: "Explain why this matches the ayat.",
          },
          {
            text: "Person B forgets the meaning of the ayat.",
            correct: false,
            feedback: "Explain what is missing.",
          },
        ],
      },
      null,
      2
    );
  }

  if (stepType === "anchor_choice" || stepType === "action_choice") {
    return JSON.stringify(
      {
        options: [
          "First option goes here.",
          "Second option goes here.",
          "Third option goes here.",
        ],
      },
      null,
      2
    );
  }

  if (stepType === "key_word") {
    return JSON.stringify(
      {
        word: "Arabic word",
        meaning: "Brief meaning",
        note: "Why this word matters in the ayah.",
      },
      null,
      2
    );
  }

  if (stepType === "divine_name") {
    return JSON.stringify(
      {
        name: "Arabic name",
        meaning: "What the name means",
        lesson: "How this name connects to the ayat.",
      },
      null,
      2
    );
  }

  if (stepType === "role_model") {
    return JSON.stringify(
      {
        person: "Name of prophet/companion",
        body: "Short story or example connected to the ayat.",
      },
      null,
      2
    );
  }

  if (stepType === "reflection_prompt") {
    return JSON.stringify(
      {
        prompt: "Reflection question goes here.",
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      body: "Write the insight here.",
    },
    null,
    2
  );
}

export default function BuilderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { journeys, refreshJourneys, isLoadingJourneys } = useAppData();

  const [menuOpen, setMenuOpen] = useState<MenuType>(null);
  const [mode, setMode] = useState<BuilderMode>("add");
  const [selectedEditId, setSelectedEditId] = useState("");
  const [form, setForm] = useState<BuilderForm>(emptyForm);
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLessonForm);
  const [stepDrafts, setStepDrafts] = useState<StepDraft[]>([
    createDefaultStep(),
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedLessonJourney = journeys.find(
    (journey) => journey.id === lessonForm.journeyId
  );

  useEffect(() => {
    const queryMode = searchParams.get("mode") as BuilderMode | null;
    const queryId = searchParams.get("id");

    if (
      queryMode === "edit" &&
      queryId &&
      journeys.length > 0
    ) {
      const journey = journeys.find((item) => item.id === queryId);
      if (!journey) return;

      setMode("edit");
      setSelectedEditId(journey.id);
      setSelectedFile(null);
      setPreviewImageUrl(journey.artImage ?? "");
      setForm({
        journeyId: journey.id,
        surahName: journey.surahName,
        cardColor: journey.cardColor ?? "#7CC8D0",
        artImageUrl: journey.artImage ?? "",
        artPositionX: journey.artPositionX ?? 0,
        artScale: journey.artScale ?? 1,
      });
      return;
    }

    if (queryMode === "add-lesson") {
  setMode("add-lesson");
  resetLessonForm(journeys[0], "add-lesson");
  return;
}

    if (queryMode === "edit-lesson") {
  setMode("edit-lesson");
  resetLessonForm(journeys[0], "edit-lesson");
  return;
}

    if (queryMode === "add") {
      openAddJourney();
    }
  }, [searchParams, journeys]);

  const previewTheme = useMemo(
    () => getJourneyCardTheme(form.cardColor || "#7CC8D0"),
    [form.cardColor]
  );

  function resetMessages() {
    setSavedMessage("");
    setErrorMessage("");
  }

  function resetLessonForm(journey?: Journey, targetMode: BuilderMode = mode) {
  const selectedJourney = journey ?? journeys[0];

  if (!selectedJourney) {
    setLessonForm(emptyLessonForm);
    setStepDrafts([createDefaultStep()]);
    return;
  }

  if (targetMode === "add-lesson") {
    const nextStart = getNextLessonStart(selectedJourney);

    setLessonForm({
      journeyId: selectedJourney.id,
      segmentId: "",
      title: "",
      surahNumber:
        typeof selectedJourney.surahNumber === "number"
          ? String(selectedJourney.surahNumber)
          : "",
      ayahStart: String(nextStart),
      ayahEnd: String(nextStart),
    });

    setStepDrafts([createDefaultStep()]);
    return;
  }

  const firstSegment = selectedJourney.segments[0];

  setLessonForm({
    journeyId: selectedJourney.id,
    segmentId: firstSegment?.id ?? "",
    title: firstSegment?.title ?? "",
    surahNumber:
      typeof firstSegment?.surahNumber === "number"
        ? String(firstSegment.surahNumber)
        : "",
    ayahStart: firstSegment ? String(firstSegment.ayahStart) : "",
    ayahEnd: firstSegment ? String(firstSegment.ayahEnd) : "",
  });

  if (firstSegment) {
    loadStepsForSegment(firstSegment.id);
  } else {
    setStepDrafts([createDefaultStep()]);
  }
}

  async function loadStepsForSegment(segmentId: string) {
    const steps = await getLessonStepsForSegment(segmentId);
    setStepDrafts(
      steps.length > 0 ? steps.map(mapStepToDraft) : [createDefaultStep()]
    );
  }

  function openAddJourney() {
    setMode("add");
    setMenuOpen(null);
    resetMessages();
    setSelectedEditId("");
    setSelectedFile(null);
    setPreviewImageUrl("");
    setForm(emptyForm);
  }

  function openEditJourney() {
    const firstJourney = journeys[0];
    if (!firstJourney) return;

    const targetId = selectedEditId || firstJourney.id;
    const journey = journeys.find((item) => item.id === targetId) ?? firstJourney;

    setMode("edit");
    setMenuOpen(null);
    resetMessages();
    setSelectedEditId(journey.id);
    setSelectedFile(null);
    setPreviewImageUrl(journey.artImage ?? "");
    setForm({
      journeyId: journey.id,
      surahName: journey.surahName,
      cardColor: journey.cardColor ?? "#7CC8D0",
      artImageUrl: journey.artImage ?? "",
      artPositionX: journey.artPositionX ?? 0,
      artScale: journey.artScale ?? 1,
    });
  }

  function openAddLesson() {
  const firstJourney = journeys[0];

  if (!firstJourney) return;

  setMode("add-lesson");
  setMenuOpen(null);
  resetMessages();
  resetLessonForm(firstJourney, "add-lesson");
}
  function openEditLesson() {
    setMode("edit-lesson");
    setMenuOpen(null);
    resetMessages();
    resetLessonForm(journeys[0]);
  }

  function handleImageUpload(file?: File | null) {
    if (!file) return;

    setSelectedFile(file);
    setPreviewImageUrl(URL.createObjectURL(file));
  }

  async function saveJourney() {
    const trimmedName = form.surahName.trim();

    if (!trimmedName) {
      setErrorMessage("Journey name is required.");
      return;
    }

    setIsSaving(true);
    resetMessages();

    try {
      const resolvedJourneyId =
        mode === "add" ? slugifyJourneyName(trimmedName) : form.journeyId;

      if (!resolvedJourneyId) {
        throw new Error("Could not generate a journey id.");
      }

      let artImageUrl: string | null = form.artImageUrl || null;

      if (selectedFile) {
        artImageUrl = await uploadJourneyArt(selectedFile, resolvedJourneyId);
      }

      if (mode === "add") {
        await createJourneyInDb({
  surahName: trimmedName,
  surahNumber: null,
  cardColor: form.cardColor,
  artImageUrl,
  artPositionX: form.artPositionX,
  artScale: form.artScale,
});

        setSavedMessage("Journey added.");
      } else {
        await updateJourneyInDb({
  id: resolvedJourneyId,
  surahName: trimmedName,
  surahNumber: null,
  cardColor: form.cardColor,
  artImageUrl,
  artPositionX: form.artPositionX,
  artScale: form.artScale,
});

        setSavedMessage("Journey updated.");
      }

      setSelectedFile(null);
      await refreshJourneys();
      router.push("/journeys");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function validateLessonForm() {
    const title = lessonForm.title.trim();
    const surahNumber = Number(lessonForm.surahNumber);
    const ayahStart = Number(lessonForm.ayahStart);
    const ayahEnd = Number(lessonForm.ayahEnd);

    if (!lessonForm.journeyId) throw new Error("Select a journey.");
    if (!title) throw new Error("Lesson title is required.");
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      throw new Error("Surah number must be between 1 and 114.");
    }
    if (!Number.isInteger(ayahStart) || ayahStart < 1) {
      throw new Error("Ayah start must be valid.");
    }
    if (!Number.isInteger(ayahEnd) || ayahEnd < ayahStart) {
      throw new Error("Ayah end must be greater than or equal to ayah start.");
    }

    const parsedSteps = stepDrafts.map((step, index) => {
      let content: Record<string, unknown>;

      try {
        const parsed = JSON.parse(step.contentText || "{}");
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error();
        }
        content = parsed as Record<string, unknown>;
      } catch {
        throw new Error(`Step ${index + 1} has invalid JSON content.`);
      }

      return {
        phase: step.phase,
        stepType: step.stepType,
        title: step.title.trim() || undefined,
        prompt: step.prompt.trim() || undefined,
        content,
        sortOrder: (index + 1) * 10,
      };
    });

    return {
      title,
      surahNumber,
      ayahStart,
      ayahEnd,
      parsedSteps,
    };
  }

  async function saveLesson() {
    setIsSaving(true);
    resetMessages();

    try {
      const validated = validateLessonForm();

      let segmentId = lessonForm.segmentId;

      if (mode === "add-lesson") {
        segmentId = await createLessonSegment({
          journeyId: lessonForm.journeyId,
          title: validated.title,
          surahNumber: validated.surahNumber,
          ayahStart: validated.ayahStart,
          ayahEnd: validated.ayahEnd,
        });
      } else {
        if (!segmentId) throw new Error("Select a lesson.");

        await updateLessonSegment({
          segmentId,
          title: validated.title,
          surahNumber: validated.surahNumber,
          ayahStart: validated.ayahStart,
          ayahEnd: validated.ayahEnd,
        });
      }

      await replaceLessonStepsForSegment(segmentId, validated.parsedSteps);
      await refreshJourneys();

      setSavedMessage(
        mode === "add-lesson" ? "Lesson added." : "Lesson updated."
      );
    } catch (error) {
  console.error("SAVE LESSON ERROR:", error);

  setErrorMessage(
    error instanceof Error
      ? error.message
      : JSON.stringify(error, null, 2)
  );
} finally {
      setIsSaving(false);
    }
  }

  function addStepDraft() {
    setStepDrafts((current) => [...current, createDefaultStep()]);
  }

  function removeStepDraft(localId: string) {
    setStepDrafts((current) =>
      current.length <= 1
        ? current
        : current.filter((step) => step.localId !== localId)
    );
  }

  function updateStepDraft(localId: string, patch: Partial<StepDraft>) {
    setStepDrafts((current) =>
      current.map((step) =>
        step.localId === localId ? { ...step, ...patch } : step
      )
    );
  }

  function moveStep(localId: string, direction: "up" | "down") {
    setStepDrafts((current) => {
      const index = current.findIndex((step) => step.localId === localId);
      if (index === -1) return current;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  }

  const previewName = form.surahName.trim() || "Name";
  const previewArt = previewImageUrl || form.artImageUrl;

  const isLessonMode = mode === "add-lesson" || mode === "edit-lesson";

  return (
    <main className="min-h-screen px-5 pb-24 pt-8">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#7b756d]">
            Builder
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171717]">
            Journey builder
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-7 text-[#67625b]">
            Create journeys, add lessons, and build phase-based lesson steps.
          </p>

          <Link
            href="/journeys"
            className="mt-4 inline-block rounded-full border border-[#d8d1c8] bg-white px-4 py-2 text-sm font-medium text-[#3f3a34] shadow"
          >
            Back
          </Link>
        </div>

        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMenuOpen(menuOpen === "add" ? null : "add")}
            className="flex h-11 w-11 items-center justify-center rounded-full text-2xl text-[#3f3a34] transition hover:bg-black/5"
          >
            +
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(menuOpen === "edit" ? null : "edit")}
            className="rounded-full px-4 py-3 text-sm font-medium text-[#3f3a34] transition hover:bg-black/5"
          >
            Edit
          </button>

          {menuOpen === "add" ? (
            <div className="absolute right-0 top-14 z-20 min-w-48 rounded-2xl border border-[#e3dbcf] bg-white p-2 shadow-xl">
              <button
                type="button"
                onClick={openAddJourney}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#171717] hover:bg-[#f6f1e8]"
              >
                Add journey
              </button>
              <button
                type="button"
                onClick={openAddLesson}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#171717] hover:bg-[#f6f1e8]"
              >
                Add lesson
              </button>
            </div>
          ) : null}

          {menuOpen === "edit" ? (
            <div className="absolute right-0 top-14 z-20 min-w-48 rounded-2xl border border-[#e3dbcf] bg-white p-2 shadow-xl">
              <button
                type="button"
                onClick={openEditJourney}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#171717] hover:bg-[#f6f1e8]"
              >
                Edit journey
              </button>
              <button
                type="button"
                onClick={openEditLesson}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#171717] hover:bg-[#f6f1e8]"
              >
                Edit lesson
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-6 space-y-4">
        {!isLessonMode ? (
          <Card className="bg-white">
            <div className="space-y-4">
              {mode === "edit" ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#3b3834]">
                    Journey to edit
                  </span>
                  <select
                    value={selectedEditId}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      const journey = journeys.find((item) => item.id === nextId);
                      if (!journey) return;

                      setSelectedEditId(journey.id);
                      setSelectedFile(null);
                      setPreviewImageUrl(journey.artImage ?? "");
                      setForm({
                        journeyId: journey.id,
                        surahName: journey.surahName,
                        cardColor: journey.cardColor ?? "#7CC8D0",
                        artImageUrl: journey.artImage ?? "",
                        artPositionX: journey.artPositionX ?? 0,
                        artScale: journey.artScale ?? 1,
                      });
                    }}
                    className="w-full rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-4 py-3 text-sm text-[#171717]"
                  >
                    {journeys.map((journey) => (
                      <option key={journey.id} value={journey.id}>
                        {journey.surahName}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3b3834]">
                  Full journey name
                </span>
                <input
                  value={form.surahName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      surahName: event.target.value,
                      journeyId:
                        mode === "add"
                          ? slugifyJourneyName(event.target.value)
                          : current.journeyId,
                    }))
                  }
                  placeholder="Surah Al-Mulk"
                  className="w-full rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-4 py-3 text-sm text-[#171717] outline-none"
                />
              </label>

              <div>
                <span className="mb-2 block text-sm font-medium text-[#3b3834]">
                  Left art image
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-4 py-3 text-sm font-medium text-[#171717]"
                  >
                    Upload image
                  </button>

                  {previewArt ? (
                    <div className="h-14 w-10 overflow-hidden rounded-lg border border-[#ddd4c8] bg-white">
                      <img
                        src={previewArt}
                        alt=""
                        className="h-full w-full object-cover"
                        style={{
                          objectPosition: `${form.artPositionX}% center`,
                          transform: `scale(${form.artScale})`,
                        }}
                      />
                    </div>
                  ) : null}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    handleImageUpload(event.target.files?.[0] ?? null)
                  }
                  className="hidden"
                />
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-[#3b3834]">
                  Card color
                </span>

                <div className="flex items-center gap-3">
                  <label className="relative flex h-12 w-16 cursor-pointer items-center justify-center rounded-xl border border-[#ddd4c8] bg-white shadow-sm">
                    <input
                      type="color"
                      value={form.cardColor}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          cardColor: event.target.value,
                        }))
                      }
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <div
                      className="h-8 w-8 rounded-full border border-white shadow"
                      style={{ background: form.cardColor }}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {swatches.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            cardColor: color,
                          }))
                        }
                        className="h-8 w-8 rounded-full border border-white shadow"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#f8f5ef] p-4">
                <p className="text-xs font-medium uppercase tracking-widest text-[#7b756d]">
                  Preview
                </p>

                <div className="relative mt-4 overflow-hidden rounded-3xl shadow-xl">
                  <div
                    className="flex min-h-32"
                    style={{ backgroundColor: form.cardColor }}
                  >
                    <div className="relative w-1/4 shrink-0 overflow-hidden rounded-l-3xl">
                      {previewArt ? (
                        <img
                          src={previewArt}
                          alt=""
                          className="h-full w-full object-cover"
                          style={{
                            objectPosition: `${form.artPositionX}% center`,
                            transform: `scale(${form.artScale})`,
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-black/5 text-xs font-medium text-[#8a847c]">
                          Art
                        </div>
                      )}

                      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-r from-transparent via-white/55 to-white/90" />
                    </div>

                    <div className="relative flex flex-1 flex-col justify-center py-4 pl-4 pr-24">
                      <div
                        className={`absolute right-5 top-4 rounded-full px-3 py-1 text-sm font-semibold backdrop-blur-sm ${previewTheme.badgeClass}`}
                      >
                        50%
                      </div>

                      <h2
                        className={`text-3xl font-semibold leading-tight tracking-tight ${previewTheme.titleClass}`}
                      >
                        {previewName.replace(/^Surah\s+/i, "")}
                      </h2>

                      <p
                        className={`mt-1 truncate text-sm font-semibold ${previewTheme.subtitleClass}`}
                      >
                        This is your lesson title
                      </p>

                      <p
                        className={`mt-1 text-xs font-medium ${previewTheme.metaClass}`}
                      >
                        Lesson 1 of 2
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={saveJourney}
                disabled={isSaving || isLoadingJourneys}
                className="w-full rounded-2xl bg-[#1d5f63] px-4 py-4 text-base font-medium text-white shadow disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {isSaving
                  ? "Saving..."
                  : mode === "add"
                  ? "Save journey"
                  : "Save journey style"}
              </button>
            </div>
          </Card>
        ) : (
          <Card className="bg-white">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-[#7b756d]">
                  {mode === "add-lesson" ? "Add lesson" : "Edit lesson"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#171717]">
                  Lesson content
                </h2>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3b3834]">
                  Journey
                </span>
                <select
                  value={lessonForm.journeyId}
                  onChange={(event) => {
  const journey = journeys.find(
    (item) => item.id === event.target.value
  );

  if (!journey) return;

  if (mode === "add-lesson") {
    const lastSegment =
      journey.segments.length > 0
        ? journey.segments[journey.segments.length - 1]
        : null;

    const nextStart = getNextLessonStart(journey);
    setLessonForm({
      journeyId: journey.id,
      segmentId: "",
      title: "",
      surahNumber:
        typeof journey.surahNumber === "number"
          ? String(journey.surahNumber)
          : "",
      ayahStart: String(nextStart),
      ayahEnd: String(nextStart),
    });

    setStepDrafts([createDefaultStep()]);
    return;
  }

  const firstSegment = journey.segments[0];

  setLessonForm({
    journeyId: journey.id,
    segmentId: firstSegment?.id ?? "",
    title: firstSegment?.title ?? "",
    surahNumber:
      typeof firstSegment?.surahNumber === "number"
        ? String(firstSegment.surahNumber)
        : "",
    ayahStart: firstSegment ? String(firstSegment.ayahStart) : "",
    ayahEnd: firstSegment ? String(firstSegment.ayahEnd) : "",
  });

  if (firstSegment) {
    loadStepsForSegment(firstSegment.id);
  } else {
    setStepDrafts([createDefaultStep()]);
  }
}}
                  className="w-full rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-4 py-3 text-sm text-[#171717]"
                >
                  {journeys.map((journey) => (
                    <option key={journey.id} value={journey.id}>
                      {journey.surahName}
                    </option>
                  ))}
                </select>
              </label>

              {mode === "edit-lesson" ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#3b3834]">
                    Lesson
                  </span>
                  <select
                    value={lessonForm.segmentId}
                    onChange={(event) => {
                      const segment = selectedLessonJourney?.segments.find(
                        (item) => item.id === event.target.value
                      );

                      if (!segment) return;

                      setLessonForm((current) => ({
                        ...current,
                        segmentId: segment.id,
                        title: segment.title,
                        surahNumber:
                          typeof segment.surahNumber === "number"
                            ? String(segment.surahNumber)
                            : "",
                        ayahStart: String(segment.ayahStart),
                        ayahEnd: String(segment.ayahEnd),
                      }));

                      loadStepsForSegment(segment.id);
                    }}
                    className="w-full rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-4 py-3 text-sm text-[#171717]"
                  >
                    {selectedLessonJourney?.segments.map((segment: Segment) => (
                      <option key={segment.id} value={segment.id}>
                        {segment.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3b3834]">
                  Lesson title
                </span>
                <input
                  value={lessonForm.title}
                  onChange={(event) =>
                    setLessonForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-4 py-3 text-sm text-[#171717] outline-none"
                  placeholder="Example: Don’t ignore what you know"
                />
              </label>

              <div className="grid grid-cols-3 gap-3">
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-[#3b3834]">
      Surah
    </span>
    <input
      value={lessonForm.surahNumber}
      readOnly
      className="w-full cursor-not-allowed rounded-2xl border border-[#ddd4c8] bg-[#eee9df] px-4 py-3 text-sm text-[#5f5a53] outline-none"
    />
  </label>

  <label className="block">
    <span className="mb-2 block text-sm font-medium text-[#3b3834]">
      Start
    </span>
    <input
      value={lessonForm.ayahStart}
      readOnly
      className="w-full cursor-not-allowed rounded-2xl border border-[#ddd4c8] bg-[#eee9df] px-4 py-3 text-sm text-[#5f5a53] outline-none"
    />
  </label>

  <label className="block">
    <span className="mb-2 block text-sm font-medium text-[#3b3834]">
      End
    </span>
    <input
      value={lessonForm.ayahEnd}
      onChange={(event) =>
        setLessonForm((current) => ({
          ...current,
          ayahEnd: event.target.value,
        }))
      }
      className="w-full rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-4 py-3 text-sm text-[#171717] outline-none"
    />
  </label>
</div>

              <div className="rounded-2xl bg-[#f8f5ef] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-widest text-[#7b756d]">
                    Steps
                  </p>

                  <button
                    type="button"
                    onClick={addStepDraft}
                    className="rounded-xl border border-[#ddd4c8] bg-white px-3 py-2 text-sm font-medium text-[#171717]"
                  >
                    + Add step
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {stepDrafts.map((step, index) => (
                    <div
                      key={step.localId}
                      className="rounded-2xl border border-[#e6e0d7] bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#171717]">
                          Step {index + 1}
                        </p>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => moveStep(step.localId, "up")}
                            className="rounded-lg px-2 py-1 text-sm text-[#5f5a53] hover:bg-black/5"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStep(step.localId, "down")}
                            className="rounded-lg px-2 py-1 text-sm text-[#5f5a53] hover:bg-black/5"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeStepDraft(step.localId)}
                            className="rounded-lg px-2 py-1 text-sm text-[#a23d35] hover:bg-black/5"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <select
                          value={step.phase}
                          onChange={(event) =>
                            updateStepDraft(step.localId, {
                              phase: event.target.value as LessonPhase,
                            })
                          }
                          className="rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-3 py-3 text-sm"
                        >
                          {phases.map((phase) => (
                            <option key={phase} value={phase}>
                              {phase}
                            </option>
                          ))}
                        </select>

                        <select
                          value={step.stepType}
                          onChange={(event) => {
  const nextType = event.target.value as LessonStepType;

  updateStepDraft(step.localId, {
    stepType: nextType,
    contentText: getStepPlaceholder(nextType),
  });
}}
                          className="rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-3 py-3 text-sm"
                        >
                          {stepTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <input
                        value={step.title}
                        onChange={(event) =>
                          updateStepDraft(step.localId, {
                            title: event.target.value,
                          })
                        }
                        placeholder="Example: Build the meaning step by step"
                        className="mt-3 w-full rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-4 py-3 text-sm outline-none"
                      />

                      <input
                        value={step.prompt}
                        onChange={(event) =>
                          updateStepDraft(step.localId, {
                            prompt: event.target.value,
                          })
                        }
                        placeholder="Optional: question or instruction shown to the user"
                        className="mt-3 w-full rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-4 py-3 text-sm outline-none"
                      />

                      <textarea
                        value={step.contentText}
                        onChange={(event) =>
                          updateStepDraft(step.localId, {
                            contentText: event.target.value,
                          })
                        }
                        rows={8}
                        className="mt-3 w-full rounded-2xl border border-[#ddd4c8] bg-[#fcfbf8] px-4 py-3 font-mono text-xs outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={saveLesson}
                disabled={isSaving}
                className="w-full rounded-2xl bg-[#1d5f63] px-4 py-4 text-base font-medium text-white shadow disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {isSaving
                  ? "Saving..."
                  : mode === "add-lesson"
                  ? "Save lesson"
                  : "Save lesson changes"}
              </button>
            </div>
          </Card>
        )}

        {savedMessage ? (
          <p className="text-sm font-medium text-[#1d5f63]">{savedMessage}</p>
        ) : null}

        {errorMessage ? (
          <p className="text-sm font-medium text-[#a23d35]">{errorMessage}</p>
        ) : null}

        <Card className="bg-white">
          <p className="text-xs font-medium uppercase tracking-widest text-[#7b756d]">
            Current journeys
          </p>

          <div className="mt-4 space-y-3">
            {journeys.map((journey) => (
              <div
                key={journey.id}
                className="flex items-center justify-between rounded-2xl bg-[#fcfbf8] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[#171717]">
                    {journey.surahName}
                  </p>
                  <p className="mt-1 text-xs text-[#7b756d]">
                    {journey.segments.length} total sessions
                  </p>
                </div>

                <div
                  className="h-4 w-4 rounded-full border border-white shadow"
                  style={{ backgroundColor: journey.cardColor ?? "#7CC8D0" }}
                />
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}