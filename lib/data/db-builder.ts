import { supabase } from "@/lib/supabase";
import { slugifyJourneyName } from "@/lib/data/journey-builder";

export async function uploadJourneyArt(file: File, journeyId: string) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${journeyId}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("journey-art")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("journey-art").getPublicUrl(path);

  return data.publicUrl;
}

export async function createJourneyInDb(input: {
  surahName: string;
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

  if (existingError) {
    throw existingError;
  }

  const nextSortOrder = (existingJourneys?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("journeys").insert({
    id: journeyId,
    surah_name: input.surahName,
    surah_label: null,
    description: null,
    card_color: input.cardColor,
    art_image_url: input.artImageUrl,
    art_position_x: input.artPositionX,
    art_scale: input.artScale,
    sort_order: nextSortOrder,
    is_published: true,
  });

  if (error) {
    throw error;
  }

  return journeyId;
}

export async function updateJourneyInDb(input: {
  id: string;
  surahName: string;
  cardColor: string;
  artImageUrl: string | null;
  artPositionX: number;
  artScale: number;
}) {
  const { error } = await supabase
    .from("journeys")
    .update({
      surah_name: input.surahName,
      card_color: input.cardColor,
      art_image_url: input.artImageUrl,
      art_position_x: input.artPositionX,
      art_scale: input.artScale,
    })
    .eq("id", input.id);

  if (error) {
    throw error;
  }
}