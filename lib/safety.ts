// Deterministic safety layer. Runs BEFORE any AI call, so a crisis never
// depends on the model getting it right.

const CRISIS_PATTERNS = [
  /\bkill(ing)? myself\b/i,
  /\bsuicid/i,
  /\bend (it all|my life)\b/i,
  /\bwant to die\b/i,
  /\bdon'?t want to (live|be alive|wake up)\b/i,
  /\bno (reason|point) (to|in) (live|living|go on)\b/i,
  /\b(hurt|harm|cut)(ting)? myself\b/i,
  /\bself[- ]?harm/i,
  /\bbetter off (dead|without me)\b/i,
  /\boverdose\b/i,
];

const ELEVATED_PATTERNS = [
  /\bhopeless\b/i,
  /\bcan'?t (cope|go on|take it)( anymore)?\b/i,
  /\bpanic attacks?\b/i,
  /\bnumb\b/i,
  /\bnothing (helps|matters)\b/i,
  /\b(abuse|abusive|hits me|beaten)\b/i,
];

export function screen(text: string): "none" | "elevated" | "crisis" {
  if (CRISIS_PATTERNS.some((p) => p.test(text))) return "crisis";
  if (ELEVATED_PATTERNS.some((p) => p.test(text))) return "elevated";
  return "none";
}

// Strip obvious personal identifiers before text leaves our server.
export function redact(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/(\+?\d[\d\s-]{8,}\d)/g, "[number]")
    .slice(0, 1500);
}
