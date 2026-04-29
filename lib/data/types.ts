export type Question = {
  id?: string;
  type?: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
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
};

export type Journey = {
  id: string;
  surahName: string;
  surahLabel?: string;
  description?: string;
  cardColor?: string;
  artImage?: string;
  artPositionX?: number;
  artScale?: number;
  segments: Segment[];
};