import { supabase } from "@/lib/supabase";
import { slugifyJourneyName } from "@/lib/data/journey-builder";
import type { LessonPhase, LessonStep, LessonStepType } from "@/lib/data/types";

export async function uploadJourneyArt(file: File, journeyId: string) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${journeyId}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("journey-art")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("journey-art").getPublicUrl(path);
  return data.publicUrl;
}

export async function createJourneyInDb(input: {
  surahName: string;
  surahNumber: number | null;
  cardColor: string;
  artImageUrl: string | null;
  artPositionX: number;
  artScale: number;
}) {
  const journeyId = slugifyJourneyName(input.surahName);

  if (!journeyId) {
    throw new Error("Could not generate a valid journey id.");
  }

  const { data: existingJourneys, error: existingError } = await supabase
    .from("journeys")
    .select("id, sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  if (existingError) throw existingError;

  const nextSortOrder = (existingJourneys?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("journeys").insert({
    id: journeyId,
    surah_name: input.surahName,
    surah_number: input.surahNumber,
    surah_label: null,
    description: null,
    card_color: input.cardColor,
    art_image_url: input.artImageUrl,
    art_position_x: input.artPositionX,
    art_scale: input.artScale,
    sort_order: nextSortOrder,
    is_published: true,
  });

  if (error) throw error;

  return journeyId;
}

export async function updateJourneyInDb(input: {
  id: string;
  surahName: string;
  surahNumber: number | null;
  cardColor: string;
  artImageUrl: string | null;
  artPositionX: number;
  artScale: number;
}) {
  const { error } = await supabase
    .from("journeys")
    .update({
  surah_name: input.surahName,
  surah_number: input.surahNumber,
  card_color: input.cardColor,
      art_image_url: input.artImageUrl,
      art_position_x: input.artPositionX,
      art_scale: input.artScale,
    })
    .eq("id", input.id);

  if (error) throw error;
}

export async function createLessonSegment(input: {
  journeyId: string;
  title: string;
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
}) {
  const baseId = slugifyJourneyName(input.title) || "lesson";

  const { data: existingSegments, error: existingError } = await supabase
    .from("journey_segments")
    .select("id, sort_order")
    .eq("journey_id", input.journeyId)
    .order("sort_order", { ascending: false });

  if (existingError) throw existingError;

  const existingIds = new Set((existingSegments ?? []).map((row) => row.id));
  let segmentId = `${input.journeyId}-${baseId}`;
  let suffix = 2;

  while (existingIds.has(segmentId)) {
    segmentId = `${input.journeyId}-${baseId}-${suffix}`;
    suffix += 1;
  }

  const nextSortOrder = (existingSegments?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("journey_segments").insert({
    id: segmentId,
    journey_id: input.journeyId,
    surah_number: input.surahNumber,
    ayah_start: input.ayahStart,
    ayah_end: input.ayahEnd,
    title: input.title,
    arabic: null,
    translation: null,
    insights: [],
    focus_anchor: "",
    reflection_prompt: "",
    action_options: [],
    sort_order: nextSortOrder,
  });

  if (error) throw error;

  return segmentId;
}

export async function updateLessonSegment(input: {
  segmentId: string;
  title: string;
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
}) {
  const { error } = await supabase
    .from("journey_segments")
    .update({
      title: input.title,
      surah_number: input.surahNumber,
      ayah_start: input.ayahStart,
      ayah_end: input.ayahEnd,
    })
    .eq("id", input.segmentId);

  if (error) throw error;
}

export async function getLessonStepsForSegment(segmentId: string) {
  const { data, error } = await supabase
    .from("lesson_steps")
    .select("*")
    .eq("segment_id", segmentId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    segmentId: row.segment_id,
    phase: row.phase as LessonPhase,
    stepType: row.step_type as LessonStepType,
    title: row.title ?? undefined,
    prompt: row.prompt ?? undefined,
    content: row.content ?? {},
    sortOrder: row.sort_order,
  })) as LessonStep[];
}

export async function replaceLessonStepsForSegment(
  segmentId: string,
  steps: Array<{
    phase: LessonPhase;
    stepType: LessonStepType;
    title?: string;
    prompt?: string;
    content?: Record<string, unknown>;
    sortOrder: number;
  }>
) {
  const { error: deleteError } = await supabase
    .from("lesson_steps")
    .delete()
    .eq("segment_id", segmentId);

  if (deleteError) throw deleteError;

  if (steps.length === 0) return;

  const { error: insertError } = await supabase.from("lesson_steps").insert(
    steps.map((step) => ({
      segment_id: segmentId,
      phase: step.phase,
      step_type: step.stepType,
      title: step.title ?? null,
      prompt: step.prompt ?? null,
      content: step.content ?? {},
      sort_order: step.sortOrder,
    }))
  );

  if (insertError) throw insertError;
}

export async function createLessonStep(step: {
  segmentId: string;
  phase: LessonPhase;
  stepType: LessonStepType;
  title?: string;
  prompt?: string;
  content?: Record<string, unknown>;
  sortOrder?: number;
}) {
  const { error } = await supabase.from("lesson_steps").insert({
    segment_id: step.segmentId,
    phase: step.phase,
    step_type: step.stepType,
    title: step.title ?? null,
    prompt: step.prompt ?? null,
    content: step.content ?? {},
    sort_order: step.sortOrder ?? 0,
  });

  if (error) throw error;
}