export type Question = {
  id?: string;
  type?: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
};

export type LessonPhase =
  | "encounter"
  | "explore"
  | "engage"
  | "enrich"
  | "embody"
  | "execute";

export type LessonStepType =
  | "key_word"
  | "divine_name"
  | "true_false_chain"
  | "scenario_choice"
  | "ayah_match"
  | "insight"
  | "role_model"
  | "anchor_choice"
  | "reflection_prompt"
  | "action_choice";

export type LessonStep = {
  id: string;
  segmentId: string;
  phase: LessonPhase;
  stepType: LessonStepType;
  title?: string;
  prompt?: string;
  content: Record<string, unknown>;
  sortOrder: number;
};

export type Segment = {
  id: string;
  title: string;
  surahNumber?: number;
  ayahStart: number;
  ayahEnd: number;
  arabic?: string;
  translation?: string;
  insights: string[];
  focusAnchor: string;
  background?: string;
  reflectionPrompt: string;
  actionOptions: string[];
  questions?: Question[];
  lessonSteps?: LessonStep[];
};

export type Journey = {
  id: string;
  surahName: string;
  surahNumber?: number;
  surahLabel?: string;
  description?: string;
  cardColor?: string;
  artImage?: string;
  artPositionX?: number;
  artScale?: number;
  segments: Segment[];
};