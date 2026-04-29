import { supabase } from "@/lib/supabase";
import type {
  Journey,
  LessonStep,
  LessonStepType,
  LessonPhase,
  Question,
  Segment,
} from "@/lib/data/types";

type JourneyRow = {
  id: string;
  surah_name: string;
  surah_number: number | null;
  surah_label: string | null;
  description: string | null;
  card_color: string | null;
  art_image_url: string | null;
  art_position_x: number | null;
  art_scale: number | null;
  sort_order: number;
  is_published: boolean;
};

type SegmentRow = {
  id: string;
  journey_id: string;
  surah_number: number | null;
  title: string;
  ayah_start: number;
  ayah_end: number;
  arabic: string | null;
  translation: string | null;
  insights: string[] | null;
  focus_anchor: string;
  reflection_prompt: string;
  action_options: string[] | null;
  sort_order: number;
};

type QuestionRow = {
  id: string;
  segment_id: string;
  type: string;
  prompt: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  sort_order: number;
};

type LessonStepRow = {
  id: string;
  segment_id: string;
  phase: LessonPhase;
  step_type: LessonStepType;
  title: string | null;
  prompt: string | null;
  content: Record<string, unknown> | null;
  sort_order: number;
};

function mapQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    type: row.type,
    prompt: row.prompt,
    options: row.options ?? [],
    correctAnswer: row.correct_answer,
    explanation: row.explanation ?? undefined,
  };
}

function mapLessonStep(row: LessonStepRow): LessonStep {
  return {
    id: row.id,
    segmentId: row.segment_id,
    phase: row.phase,
    stepType: row.step_type,
    title: row.title ?? undefined,
    prompt: row.prompt ?? undefined,
    content: row.content ?? {},
    sortOrder: row.sort_order,
  };
}

function mapSegment(
  row: SegmentRow,
  questions: Question[],
  lessonSteps: LessonStep[]
): Segment {
  return {
    id: row.id,
    title: row.title,
    surahNumber: row.surah_number ?? undefined,
    ayahStart: row.ayah_start,
    ayahEnd: row.ayah_end,
    arabic: row.arabic ?? undefined,
    translation: row.translation ?? undefined,
    insights: row.insights ?? [],
    focusAnchor: row.focus_anchor,
    reflectionPrompt: row.reflection_prompt,
    actionOptions: row.action_options ?? [],
    questions,
    lessonSteps,
  };
}

function mapJourney(row: JourneyRow, segments: Segment[]): Journey {
  return {
    id: row.id,
    surahName: row.surah_name,
    surahNumber: row.surah_number ?? undefined,
    surahLabel: row.surah_label ?? undefined,
    description: row.description ?? undefined,
    cardColor: row.card_color ?? undefined,
    artImage: row.art_image_url ?? undefined,
    artPositionX: row.art_position_x ?? 0,
    artScale: row.art_scale ?? 1,
    segments,
  };
}

async function fetchAssembledJourneys(): Promise<Journey[]> {
  const { data: journeysData, error: journeysError } = await supabase
    .from("journeys")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (journeysError) {
    throw journeysError;
  }

  const journeyRows = (journeysData ?? []) as JourneyRow[];
  const journeyIds = journeyRows.map((row) => row.id);

  const { data: segmentsData, error: segmentsError } = await supabase
    .from("journey_segments")
    .select("*")
    .in("journey_id", journeyIds.length ? journeyIds : ["__none__"])
    .order("sort_order", { ascending: true });

  if (segmentsError) {
    throw segmentsError;
  }

  const segmentRows = (segmentsData ?? []) as SegmentRow[];
  const segmentIds = segmentRows.map((row) => row.id);

  const { data: questionsData, error: questionsError } = await supabase
    .from("segment_questions")
    .select("*")
    .in("segment_id", segmentIds.length ? segmentIds : ["__none__"])
    .order("sort_order", { ascending: true });

  if (questionsError) {
    throw questionsError;
  }

  const { data: lessonStepsData, error: lessonStepsError } = await supabase
    .from("lesson_steps")
    .select("*")
    .in("segment_id", segmentIds.length ? segmentIds : ["__none__"])
    .order("sort_order", { ascending: true });

  if (lessonStepsError) {
    throw lessonStepsError;
  }

  const questionRows = (questionsData ?? []) as QuestionRow[];
  const lessonStepRows = (lessonStepsData ?? []) as LessonStepRow[];

  const questionsBySegment = new Map<string, Question[]>();

  for (const row of questionRows) {
    const list = questionsBySegment.get(row.segment_id) ?? [];
    list.push(mapQuestion(row));
    questionsBySegment.set(row.segment_id, list);
  }

  const lessonStepsBySegment = new Map<string, LessonStep[]>();

  for (const row of lessonStepRows) {
    const list = lessonStepsBySegment.get(row.segment_id) ?? [];
    list.push(mapLessonStep(row));
    lessonStepsBySegment.set(row.segment_id, list);
  }

  const segmentsByJourney = new Map<string, Segment[]>();

  for (const row of segmentRows) {
    const questions = questionsBySegment.get(row.id) ?? [];
    const lessonSteps = lessonStepsBySegment.get(row.id) ?? [];
    const segment = mapSegment(row, questions, lessonSteps);
    const list = segmentsByJourney.get(row.journey_id) ?? [];
    list.push(segment);
    segmentsByJourney.set(row.journey_id, list);
  }

  return journeyRows.map((row) =>
    mapJourney(row, segmentsByJourney.get(row.id) ?? [])
  );
}

export async function getAllJourneysFromDb() {
  return fetchAssembledJourneys();
}

export async function getJourneyByIdFromDb(journeyId: string) {
  const journeys = await fetchAssembledJourneys();
  return journeys.find((journey) => journey.id === journeyId) ?? null;
}

export async function getSegmentByIdFromDb(segmentId: string) {
  const journeys = await fetchAssembledJourneys();

  for (const journey of journeys) {
    const segment = journey.segments.find((item) => item.id === segmentId);
    if (segment) {
      return segment;
    }
  }

  return null;
}

export async function getJourneyForSegmentIdFromDb(segmentId: string) {
  const journeys = await fetchAssembledJourneys();

  for (const journey of journeys) {
    if (journey.segments.some((item) => item.id === segmentId)) {
      return journey;
    }
  }

  return null;
}