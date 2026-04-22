"use client";

import { useMemo, useState } from "react";
import type { Segment } from "@/lib/data/types";

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function escapeForCode(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

export default function BuilderPage() {
  const [segmentId, setSegmentId] = useState("mulk-3");
  const [ayahStart, setAyahStart] = useState("12");
  const [ayahEnd, setAyahEnd] = useState("15");
  const [title, setTitle] = useState("Walk the earth with awareness");
  const [focusAnchor, setFocusAnchor] = useState(
    "These ayat call the believer to live with awareness of Allah’s knowledge, power, and provision."
  );
  const [arabic, setArabic] = useState("");
  const [translation, setTranslation] = useState("");
  const [background, setBackground] = useState("");
  const [insightsText, setInsightsText] = useState(
    "Allah knows what is hidden as well as what is spoken openly.\nThe earth is made manageable for people, but that does not mean independence from Allah.\nProvision should lead to gratitude and awareness, not heedlessness."
  );
  const [questionId, setQuestionId] = useState("mulk-3-q1");
  const [questionType, setQuestionType] = useState<"multiple_choice" | "scenario">(
    "multiple_choice"
  );
  const [questionPrompt, setQuestionPrompt] = useState(
    "What is the main attitude these ayat encourage?"
  );
  const [questionOptionsText, setQuestionOptionsText] = useState(
    "Self-sufficiency\nAwareness and gratitude\nFear of effort"
  );
  const [correctAnswer, setCorrectAnswer] = useState("Awareness and gratitude");
  const [questionExplanation, setQuestionExplanation] = useState(
    "The ayat connect Allah’s knowledge, mastery, and provision to a life of grateful awareness."
  );
  const [reflectionPrompt, setReflectionPrompt] = useState(
    "Where in your daily routine do you move through Allah’s blessings without awareness or gratitude?"
  );
  const [actionOptionsText, setActionOptionsText] = useState(
    "Pause before one meal today and thank Allah consciously.\nTake one ordinary routine and do it with more awareness of Allah.\nNotice one blessing today and mention it in du'a."
  );

  const insights = useMemo(() => splitLines(insightsText), [insightsText]);
  const questionOptions = useMemo(
    () => splitLines(questionOptionsText),
    [questionOptionsText]
  );
  const actionOptions = useMemo(
    () => splitLines(actionOptionsText),
    [actionOptionsText]
  );

  const segment: Segment = useMemo(
    () => ({
      id: segmentId.trim(),
      ayahStart: Number(ayahStart) || 0,
      ayahEnd: Number(ayahEnd) || 0,
      title: title.trim(),
      focusAnchor: focusAnchor.trim(),
      arabic: arabic.trim(),
      translation: translation.trim(),
      ...(background.trim() ? { background: background.trim() } : {}),
      insights,
      questions: [
        {
          id: questionId.trim(),
          type: questionType,
          prompt: questionPrompt.trim(),
          options: questionOptions,
          correctAnswer: correctAnswer.trim(),
          ...(questionExplanation.trim()
            ? { explanation: questionExplanation.trim() }
            : {}),
        },
      ],
      reflectionPrompt: reflectionPrompt.trim(),
      actionOptions,
    }),
    [
      actionOptions,
      arabic,
      ayahEnd,
      ayahStart,
      background,
      correctAnswer,
      focusAnchor,
      insights,
      questionExplanation,
      questionId,
      questionOptions,
      questionPrompt,
      questionType,
      reflectionPrompt,
      segmentId,
      title,
      translation,
    ]
  );

  const validation = useMemo(() => {
    const errors: string[] = [];

    if (!segment.id) errors.push("Segment id is required.");
    if (!segment.title) errors.push("Title is required.");
    if (!segment.focusAnchor) errors.push("Focus anchor is required.");
    if (!segment.reflectionPrompt) errors.push("Reflection prompt is required.");
    if (!segment.questions[0]?.id) errors.push("Question id is required.");
    if (!segment.questions[0]?.prompt) errors.push("Question prompt is required.");
    if (segment.ayahStart <= 0) errors.push("Ayah start must be greater than 0.");
    if (segment.ayahEnd <= 0) errors.push("Ayah end must be greater than 0.");
    if (segment.ayahEnd < segment.ayahStart) {
      errors.push("Ayah end must be greater than or equal to ayah start.");
    }
    if (segment.insights.length === 0) errors.push("Add at least one insight.");
    if (segment.questions[0]?.options.length < 2) {
      errors.push("Add at least two question options.");
    }
    if (!segment.questions[0]?.correctAnswer) {
      errors.push("Correct answer is required.");
    }
    if (segment.actionOptions.length === 0) {
      errors.push("Add at least one action option.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [segment]);

  const generatedCode = useMemo(() => {
    const insightsCode = insights
      .map((item) => `    "${escapeForCode(item)}"`)
      .join(",\n");

    const optionsCode = questionOptions
      .map((item) => `        "${escapeForCode(item)}"`)
      .join(",\n");

    const actionsCode = actionOptions
      .map((item) => `    "${escapeForCode(item)}"`)
      .join(",\n");

    return `{
  id: "${escapeForCode(segment.id)}",
  ayahStart: ${segment.ayahStart},
  ayahEnd: ${segment.ayahEnd},
  title: "${escapeForCode(segment.title)}",
  focusAnchor: "${escapeForCode(segment.focusAnchor)}",
  arabic: \`${escapeForCode(segment.arabic)}\`,
  translation: \`${escapeForCode(segment.translation)}\`,
${
  segment.background
    ? `  background: "${escapeForCode(segment.background)}",\n`
    : ""
}  insights: [
${insightsCode}
  ],
  questions: [
    {
      id: "${escapeForCode(segment.questions[0].id)}",
      type: "${segment.questions[0].type}",
      prompt: "${escapeForCode(segment.questions[0].prompt)}",
      options: [
${optionsCode}
      ],
      correctAnswer: "${escapeForCode(segment.questions[0].correctAnswer)}",${
        segment.questions[0].explanation
          ? `\n      explanation: "${escapeForCode(
              segment.questions[0].explanation
            )}",`
          : ""
      }
    }
  ],
  reflectionPrompt: "${escapeForCode(segment.reflectionPrompt)}",
  actionOptions: [
${actionsCode}
  ]
}`;
  }, [actionOptions, insights, questionOptions, segment]);

  async function copyGeneratedCode() {
    try {
      await navigator.clipboard.writeText(generatedCode);
    } catch {
      // no-op
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="pt-8">
        <p className="text-sm text-neutral-500">Internal builder</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
          Lesson segment builder
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
          Use this to draft a valid segment object for your journey files. Fill
          in the fields, review the preview, then copy the generated object into
          your surah file.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-neutral-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-neutral-900">Inputs</h2>

          <div className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Segment id"
                value={segmentId}
                onChange={setSegmentId}
                placeholder="mulk-3"
              />
              <Field
                label="Ayah start"
                value={ayahStart}
                onChange={setAyahStart}
                placeholder="12"
              />
              <Field
                label="Ayah end"
                value={ayahEnd}
                onChange={setAyahEnd}
                placeholder="15"
              />
            </div>

            <Field
              label="Title"
              value={title}
              onChange={setTitle}
              placeholder="Walk the earth with awareness"
            />

            <TextareaField
              label="Focus anchor"
              value={focusAnchor}
              onChange={setFocusAnchor}
              rows={3}
              placeholder="One clear takeaway for this segment"
            />

            <TextareaField
              label="Arabic text"
              value={arabic}
              onChange={setArabic}
              rows={6}
              placeholder="Paste the Arabic ayat here for now"
            />

            <TextareaField
              label="Translation"
              value={translation}
              onChange={setTranslation}
              rows={5}
              placeholder="Paste the translation here for now"
            />

            <TextareaField
              label="Background / context (optional)"
              value={background}
              onChange={setBackground}
              rows={3}
              placeholder="Optional context note"
            />

            <TextareaField
              label="Insights (one per line)"
              value={insightsText}
              onChange={setInsightsText}
              rows={5}
              placeholder="Enter one insight per line"
            />

            <div className="rounded-2xl border border-neutral-200 p-4">
              <h3 className="text-base font-semibold text-neutral-900">
                Question
              </h3>

              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Question id"
                    value={questionId}
                    onChange={setQuestionId}
                    placeholder="mulk-3-q1"
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">
                      Question type
                    </label>
                    <select
                      value={questionType}
                      onChange={(e) =>
                        setQuestionType(
                          e.target.value as "multiple_choice" | "scenario"
                        )
                      }
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                    >
                      <option value="multiple_choice">multiple_choice</option>
                      <option value="scenario">scenario</option>
                    </select>
                  </div>
                </div>

                <TextareaField
                  label="Question prompt"
                  value={questionPrompt}
                  onChange={setQuestionPrompt}
                  rows={3}
                  placeholder="Enter the question"
                />

                <TextareaField
                  label="Question options (one per line)"
                  value={questionOptionsText}
                  onChange={setQuestionOptionsText}
                  rows={4}
                  placeholder="Enter one option per line"
                />

                <Field
                  label="Correct answer"
                  value={correctAnswer}
                  onChange={setCorrectAnswer}
                  placeholder="Must match one of the options"
                />

                <TextareaField
                  label="Question explanation (optional)"
                  value={questionExplanation}
                  onChange={setQuestionExplanation}
                  rows={3}
                  placeholder="Optional explanation shown after answering"
                />
              </div>
            </div>

            <TextareaField
              label="Reflection prompt"
              value={reflectionPrompt}
              onChange={setReflectionPrompt}
              rows={3}
              placeholder="Where does this apply in the user's life?"
            />

            <TextareaField
              label="Action options (one per line)"
              value={actionOptionsText}
              onChange={setActionOptionsText}
              rows={4}
              placeholder="Enter one action option per line"
            />
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-neutral-900">Preview</h2>
              <div
                className={`rounded-full px-3 py-1 text-sm ${
                  validation.isValid
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {validation.isValid ? "Valid enough" : "Needs fixes"}
              </div>
            </div>

            {!validation.isValid ? (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm font-medium text-neutral-800">
                  Missing or invalid fields
                </p>
                <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                  {validation.errors.map((error) => (
                    <li key={error}>• {error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-5 space-y-5">
              <PreviewBlock label="Id" value={segment.id || "—"} />
              <PreviewBlock
                label="Ayah range"
                value={
                  segment.ayahStart > 0 && segment.ayahEnd > 0
                    ? `${segment.ayahStart}–${segment.ayahEnd}`
                    : "—"
                }
              />
              <PreviewBlock label="Title" value={segment.title || "—"} />
              <PreviewBlock
                label="Focus anchor"
                value={segment.focusAnchor || "—"}
              />
              <PreviewBlock
                label="Arabic"
                value={segment.arabic || "No Arabic added yet."}
                preserveWhitespace
              />
              <PreviewBlock
                label="Translation"
                value={segment.translation || "No translation added yet."}
              />
              {segment.background ? (
                <PreviewBlock label="Background" value={segment.background} />
              ) : null}

              <div>
                <p className="text-sm font-medium text-neutral-700">Insights</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-800">
                  {segment.insights.length > 0 ? (
                    segment.insights.map((insight) => (
                      <li key={insight}>• {insight}</li>
                    ))
                  ) : (
                    <li>No insights yet.</li>
                  )}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-700">Question</p>
                <div className="mt-3 rounded-2xl border border-neutral-200 p-4">
                  <p className="text-sm text-neutral-500">
                    {segment.questions[0]?.type ?? "—"}
                  </p>
                  <p className="mt-2 text-base font-medium text-neutral-900">
                    {segment.questions[0]?.prompt || "No question prompt yet."}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                    {segment.questions[0]?.options.length ? (
                      segment.questions[0].options.map((option) => (
                        <li key={option}>• {option}</li>
                      ))
                    ) : (
                      <li>No options yet.</li>
                    )}
                  </ul>
                  <p className="mt-3 text-sm text-neutral-600">
                    Correct answer:{" "}
                    <span className="font-medium text-neutral-900">
                      {segment.questions[0]?.correctAnswer || "—"}
                    </span>
                  </p>
                </div>
              </div>

              <PreviewBlock
                label="Reflection prompt"
                value={segment.reflectionPrompt || "—"}
              />

              <div>
                <p className="text-sm font-medium text-neutral-700">
                  Action options
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-800">
                  {segment.actionOptions.length > 0 ? (
                    segment.actionOptions.map((action) => (
                      <li key={action}>• {action}</li>
                    ))
                  ) : (
                    <li>No action options yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-neutral-900">
                Generated object
              </h2>
              <button
                type="button"
                onClick={copyGeneratedCode}
                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-800 transition hover:border-neutral-900"
              >
                Copy
              </button>
            </div>

            <pre className="mt-4 overflow-x-auto rounded-2xl bg-neutral-950 p-4 text-xs leading-6 text-neutral-100">
              <code>{generatedCode}</code>
            </pre>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm leading-6 text-neutral-900 outline-none transition focus:border-neutral-900"
      />
    </div>
  );
}

function PreviewBlock({
  label,
  value,
  preserveWhitespace = false,
}: {
  label: string;
  value: string;
  preserveWhitespace?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-neutral-700">{label}</p>
      <p
        className={`mt-2 text-sm leading-6 text-neutral-800 ${
          preserveWhitespace ? "whitespace-pre-line" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}