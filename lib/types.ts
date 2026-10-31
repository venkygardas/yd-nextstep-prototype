export type Risk = "none" | "elevated" | "crisis";

export interface CheckIn {
  message: string;
  mood: number; // 1 (really low) to 5 (great)
  duration: "days" | "weeks" | "months" | "unsure";
  preference: "talk" | "self" | "unsure";
  answerToFollowUp?: string;
  followUpQuestion?: string;
}

export interface Pick {
  id: string;
  why: string;
}

export interface NextStepResult {
  risk: Risk;
  summary: string; // "Here's what I heard"
  themes: string[];
  primary: Pick | null;
  alternatives: Pick[];
  followUp: { question: string; options: string[] } | null;
  confidence: number; // 0 to 1
  source: "ai" | "rules" | "safety-screen";
  note?: string; // shown in the behind-the-scenes panel
}
