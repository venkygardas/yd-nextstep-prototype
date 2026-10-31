// Synthetic catalog. Every item is fictional and only for this prototype.

export type ItemType = "counselling" | "chat" | "assessment" | "program" | "self-help";

export interface CatalogItem {
  id: string;
  type: ItemType;
  title: string;
  blurb: string;
  time: string; // effort shown to the user
  intensity: 1 | 2 | 3; // 1 = light self-help, 3 = 1:1 professional support
  themes: string[];
  cta: string;
}

export const CATALOG: CatalogItem[] = [
  {
    id: "counselling",
    type: "counselling",
    title: "Talk to a counsellor (1:1)",
    blurb: "A private 50-minute online session with a qualified expert, matched to what you're going through.",
    time: "50 min · first slot often within 48 hrs",
    intensity: 3,
    themes: ["persistent low mood", "anxiety", "relationships", "grief", "trauma", "anything ongoing for weeks"],
    cta: "See matched experts",
  },
  {
    id: "instant-chat",
    type: "chat",
    title: "Chat with someone now",
    blurb: "Text with a trained listener right away. Good when you need to get something off your chest today.",
    time: "Now · 15 to 30 min",
    intensity: 2,
    themes: ["need to vent", "feeling overwhelmed right now", "lonely", "after a tough day"],
    cta: "Start a chat",
  },
  {
    id: "check-stress",
    type: "assessment",
    title: "Stress check",
    blurb: "10 quick questions to see how much stress is affecting you, with a simple score and what it means.",
    time: "3 min",
    intensity: 1,
    themes: ["work stress", "pressure", "not sure how bad it is"],
    cta: "Take the check",
  },
  {
    id: "check-mood",
    type: "assessment",
    title: "Mood check",
    blurb: "A short, widely used set of questions about mood and energy over the last two weeks.",
    time: "4 min",
    intensity: 1,
    themes: ["low mood", "no energy", "not enjoying things", "not sure if it's serious"],
    cta: "Take the check",
  },
  {
    id: "check-anxiety",
    type: "assessment",
    title: "Anxiety check",
    blurb: "7 questions about worry and restlessness, so you know where you stand.",
    time: "2 min",
    intensity: 1,
    themes: ["worry", "overthinking", "restless", "nervous"],
    cta: "Take the check",
  },
  {
    id: "prog-sleep",
    type: "program",
    title: "Sleep Reset · 7-day program",
    blurb: "One small habit a day to wind down and fall asleep more easily. 10 minutes daily.",
    time: "7 days · 10 min a day",
    intensity: 2,
    themes: ["can't sleep", "racing thoughts at night", "tired all day"],
    cta: "Start day 1",
  },
  {
    id: "prog-smoking",
    type: "program",
    title: "Quit Smoking · 21-day program",
    blurb: "A guided plan with daily check-ins, craving tools and a buddy reminder.",
    time: "21 days · 5 min a day",
    intensity: 2,
    themes: ["smoking", "cigarettes", "quit", "nicotine"],
    cta: "Start the plan",
  },
  {
    id: "prog-work-stress",
    type: "program",
    title: "Managing Work Stress · 4-week program",
    blurb: "Practical tools for workload, boundaries and switching off after work.",
    time: "4 weeks · 15 min, 3x a week",
    intensity: 2,
    themes: ["deadlines", "workload", "burnout", "manager", "switching off"],
    cta: "Start week 1",
  },
  {
    id: "prog-gratitude",
    type: "program",
    title: "Gratitude · 14-day campaign",
    blurb: "A 2-minute daily reflection to notice what's going right. Light and easy to keep up.",
    time: "14 days · 2 min a day",
    intensity: 1,
    themes: ["feeling flat", "want to feel more positive", "general wellbeing"],
    cta: "Join the campaign",
  },
  {
    id: "prog-confidence",
    type: "program",
    title: "Building Self-Confidence · 3-week program",
    blurb: "Exercises to quiet the inner critic and handle feedback without spiralling.",
    time: "3 weeks · 10 min a day",
    intensity: 2,
    themes: ["self-doubt", "imposter feeling", "comparison", "low confidence"],
    cta: "Start the program",
  },
  {
    id: "video-breathing",
    type: "self-help",
    title: "Video: 5-minute calm breathing",
    blurb: "A simple guided breathing exercise you can do at your desk when things feel too much.",
    time: "5 min",
    intensity: 1,
    themes: ["panic", "anxious right now", "before a meeting", "need to calm down"],
    cta: "Watch now",
  },
  {
    id: "article-manager",
    type: "self-help",
    title: "Article: Talking to your manager about workload",
    blurb: "A short guide with example lines for asking for help or pushing back on priorities.",
    time: "6 min read",
    intensity: 1,
    themes: ["manager", "workload", "too many tasks", "saying no"],
    cta: "Read",
  },
  {
    id: "article-conflict",
    type: "self-help",
    title: "Article: Calmer conversations at home",
    blurb: "How to have hard conversations with a partner or family without it turning into a fight.",
    time: "7 min read",
    intensity: 1,
    themes: ["arguments", "partner", "family", "conflict"],
    cta: "Read",
  },
  {
    id: "article-grief",
    type: "self-help",
    title: "Article: When you're grieving",
    blurb: "What grief can feel like, why it comes in waves, and small ways to get through the day.",
    time: "8 min read",
    intensity: 1,
    themes: ["loss", "grief", "someone passed away", "bereavement"],
    cta: "Read",
  },
];

export const byId = (id: string) => CATALOG.find((c) => c.id === id);
