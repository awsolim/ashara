export type Question = {
  id: string;
  type: "multiple_choice" | "scenario";
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
};

export type Segment = {
  id: string;
  ayahStart: number;
  ayahEnd: number;
  title: string;
  focusAnchor: string;
  arabic: string;
  translation: string;
  insights: string[];
  background?: string;
  questions: Question[];
  reflectionPrompt: string;
  actionOptions: string[];
};

export type Journey = {
  id: string;
  surahName: string;
  surahLabel: string;
  description: string;
  segments: Segment[];
};