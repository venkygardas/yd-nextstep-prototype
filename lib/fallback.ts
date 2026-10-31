// Rule-based recommender. Used when no AI key is set, when the AI call
// fails, or when the AI returns something we can't trust.

import { CATALOG, byId } from "./catalog";
import type { CheckIn, NextStepResult, Pick, Risk } from "./types";

const RULES: { re: RegExp; id: string; theme: string; why: string }[] = [
  { re: /smok|cigarette|nicotine|vape|habit/i, id: "prog-smoking", theme: "quitting smoking", why: "You mentioned wanting to cut down on smoking. A structured daily plan works better than willpower alone." },
  { re: /sleep|insomnia|awake at night|can'?t fall asleep|tired all/i, id: "prog-sleep", theme: "your sleep", why: "Sleep came up. Small nightly habits are a good first step and often ease stress too." },
  { re: /grie|passed away|died|loss of|lost my/i, id: "counselling", theme: "a loss", why: "Grief is heavy to carry alone. Talking it through with an expert can really help." },
  { re: /partner|wife|husband|girlfriend|boyfriend|family|parents|fight|argu/i, id: "article-conflict", theme: "tension at home", why: "It sounds like things are tense at home. This guide has simple ways to keep hard talks calm." },
  { re: /manager|boss|deadline|workload|\bwork\b|job|burn ?out|appraisal|office|stud(y|ies)|exam/i, id: "prog-work-stress", theme: "work pressure", why: "Work pressure seems to be the main thing. This program gives practical tools for workload and switching off." },
  { re: /panic|anxious|anxiety|nervous|worr|overthink/i, id: "check-anxiety", theme: "a lot of worry", why: "You described a lot of worry. A 2-minute check helps you see how much it's affecting you and what fits next." },
  { re: /confiden|imposter|not good enough|compar|self[- ]?doubt/i, id: "prog-confidence", theme: "self-doubt", why: "Self-doubt came through. This program has exercises to quiet the inner critic." },
  { re: /sad|\blow\b|down|empty|numb|flat|no energy|unmotivated|nothing (really )?feels|no fun|not enjoy/i, id: "check-mood", theme: "feeling low", why: "You've been feeling low. A short mood check helps us understand how serious it is and what would help most." },
  { re: /lonely|alone|no one to talk|vent/i, id: "instant-chat", theme: "feeling alone", why: "Sometimes you just need someone to listen. You can chat with a trained listener right now." },
];

export function rulesRecommend(c: CheckIn, risk: Risk): NextStepResult {
  const text = `${c.message} ${c.answerToFollowUp ?? ""}`;
  const hits = RULES.filter((r) => r.re.test(text));
  const themes = hits.map((h) => h.theme);

  const candidates: Pick[] = hits.map((h) => ({ id: h.id, why: h.why }));
  let primary: Pick | null = candidates[0] ?? null;

  // Escalate to 1:1 support when it's been going on a while, mood is very low,
  // the user asks to talk, or the safety screen flagged it.
  const needsHuman = risk === "elevated" || c.mood <= 1 || (c.duration === "months" && c.mood <= 2);
  if (needsHuman && (primary || c.mood <= 1 || risk === "elevated")) {
    primary = { id: "counselling", why: "From what you've shared, this has been weighing on you for a while. A counsellor can help you work through it properly, not just get through today." };
  } else if (c.preference === "talk" && primary && byId(primary.id)!.intensity < 3) {
    primary = { id: c.duration === "days" ? "instant-chat" : "counselling", why: "You said you'd rather talk to someone, so here's a person, not a program." };
  }

  if (!primary && c.answerToFollowUp) {
    // Never ask twice. A quick check is a safe, light default.
    primary = { id: "check-stress", why: "A quick check is a simple way to see how things are and what would help most." };
  }

  if (!primary) {
    return {
      risk,
      summary: "I want to make sure I suggest the right thing.",
      themes: [],
      primary: null,
      alternatives: [],
      followUp: {
        question: "Which of these is closest to what's going on?",
        options: ["Work or study pressure", "Feeling low or flat", "Worry or overthinking", "Sleep", "Relationships or family", "Smoking or another habit"],
      },
      confidence: 0.3,
      source: "rules",
      note: "No clear theme found, so asking one clarifying question.",
    };
  }

  const alternatives: Pick[] = [];
  for (const h of candidates) {
    if (h.id !== primary.id && !alternatives.find((a) => a.id === h.id)) alternatives.push(h);
  }
  for (const fill of ["counselling", "instant-chat", "check-stress"]) {
    if (alternatives.length >= 2) break;
    if (fill !== primary.id && !alternatives.find((a) => a.id === fill)) {
      alternatives.push({ id: fill, why: byId(fill)!.blurb });
    }
  }

  return {
    risk,
    summary: themes.length
      ? `It sounds like ${themes.slice(0, 2).join(" and ")} ${themes.length > 1 ? "have" : "has"} been weighing on you${c.duration === "months" ? ", and it's been going on for months" : ""}.`
      : "It sounds like you've had a lot going on.",
    themes,
    primary,
    alternatives: alternatives.slice(0, 2),
    followUp: null,
    confidence: hits.length ? 0.6 : 0.4,
    source: "rules",
    note: "Keyword rules (AI not configured or unavailable).",
  };
}

export const CATALOG_FOR_PROMPT = CATALOG.map(({ id, type, title, blurb, intensity, themes }) => ({ id, type, title, blurb, intensity, themes }));
