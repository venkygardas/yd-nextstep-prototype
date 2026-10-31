import { byId } from "./catalog";
import { CATALOG_FOR_PROMPT } from "./fallback";
import type { CheckIn, NextStepResult, Pick, Risk } from "./types";

const SYSTEM = `You help employees on a workplace mental wellbeing platform figure out ONE good next step.
You are not a therapist. Never diagnose, never label a condition, never give medical advice.

You get: what the person wrote, their mood (1 really low to 5 great), how long it has been going on, and whether they prefer talking to someone or doing things themselves.

Pick from this catalog ONLY (use the exact id):
${JSON.stringify(CATALOG_FOR_PROMPT)}

How to choose:
- Prefer the lightest step that truly fits (self-help, check, program) for recent, everyday stress.
- Recommend "counselling" when it has gone on for weeks or months with low mood, when daily life is clearly affected, for grief, relationship breakdown, trauma, or abuse, or when they prefer talking and it's not a passing thing.
- Recommend "instant-chat" when they need to talk today but it doesn't sound long-term.
- An assessment is a good first step when they're unsure how serious it is.
- If the message is too vague to choose well, set confidence below 0.5 and give ONE short follow-up question with 3 to 6 tap options. Do not ask a follow-up if a follow-up answer is already provided.

Risk:
- "crisis" if there is any hint of suicide, self-harm, wanting to die, or being in danger.
- "elevated" if they sound hopeless, unable to cope, or describe abuse.
- otherwise "none".

Write "summary" as one or two warm, plain sentences that reflect back what you heard, starting with "It sounds like". Write each "why" in one sentence, speaking to the person as "you", linked to what they said. Simple words. No emojis. No dashes.

Reply with JSON only, matching:
{"risk":"none|elevated|crisis","summary":string,"themes":[string],"primary":{"id":string,"why":string},"alternatives":[{"id":string,"why":string}],"followUp":null|{"question":string,"options":[string]},"confidence":number}`;

function userPrompt(c: CheckIn, redactedMessage: string, redactedAnswer?: string) {
  const mood = ["", "really low", "low", "okay", "good", "great"][c.mood] ?? "unknown";
  return [
    `What they wrote: """${redactedMessage}"""`,
    `Mood: ${mood}`,
    `Going on for: ${c.duration}`,
    `Prefers: ${c.preference === "talk" ? "talking to someone" : c.preference === "self" ? "doing it myself" : "not sure"}`,
    c.followUpQuestion ? `Follow-up asked: ${c.followUpQuestion}\nTheir answer: ${redactedAnswer}` : "",
  ].filter(Boolean).join("\n");
}

async function callAnthropic(system: string, user: string): Promise<string> {
  const res = await fetch(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
      max_tokens: 700,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.map((b: { text?: string }) => b.text ?? "").join("") ?? "";
}

// Any OpenAI-compatible endpoint. Groq and Google Gemini both offer a free tier
// (no card needed), so the prototype can run at zero cost.
const PROVIDERS = {
  groq: { key: "GROQ_API_KEY", base: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-20b", json: false },
  gemini: { key: "GEMINI_API_KEY", base: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-flash", json: false },
  openai: { key: "OPENAI_API_KEY", base: "https://api.openai.com/v1", model: "gpt-4o-mini", json: true },
} as const;
type ProviderName = keyof typeof PROVIDERS;

function activeOpenAICompatible(): ProviderName | null {
  for (const name of Object.keys(PROVIDERS) as ProviderName[]) {
    if (process.env[PROVIDERS[name].key]) return name;
  }
  return null;
}

async function callOpenAICompatible(name: ProviderName, system: string, user: string): Promise<string> {
  const p = PROVIDERS[name];
  const res = await fetch(`${process.env.AI_BASE_URL || p.base}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env[p.key]}` },
    body: JSON.stringify({
      model: process.env.AI_MODEL || p.model,
      temperature: 0.2,
      max_tokens: 1200,
      ...(p.json ? { response_format: { type: "json_object" } } : {}),
      // Open reasoning models on Groq: keep thinking short so replies stay fast and inside free limits.
      ...(name === "groq" ? { reasoning_effort: "low" } : {}),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${name} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export function aiProvider(): string | null {
  return activeOpenAICompatible() ?? (process.env.ANTHROPIC_API_KEY ? "anthropic" : null);
}

export function aiConfigured() {
  return aiProvider() !== null;
}

// Parse and validate. Anything we can't trust throws, and the caller falls back to rules.
export function parseAndValidate(raw: string): NextStepResult {
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  const o = JSON.parse(json);
  const risk: Risk = ["none", "elevated", "crisis"].includes(o.risk) ? o.risk : "elevated";
  const validPick = (p: unknown): p is Pick =>
    !!p && typeof (p as Pick).id === "string" && !!byId((p as Pick).id) && typeof (p as Pick).why === "string";

  const followUp =
    o.followUp && typeof o.followUp.question === "string" && Array.isArray(o.followUp.options) && o.followUp.options.length >= 2
      ? { question: String(o.followUp.question), options: o.followUp.options.slice(0, 6).map(String) }
      : null;

  const primary = validPick(o.primary) ? { id: o.primary.id, why: o.primary.why } : null;
  if (!primary && !followUp && risk !== "crisis") throw new Error("AI returned no valid catalog item and no follow-up");

  const alternatives: Pick[] = (Array.isArray(o.alternatives) ? o.alternatives : [])
    .filter(validPick)
    .filter((a: Pick) => a.id !== primary?.id)
    .slice(0, 2);

  return {
    risk,
    summary: typeof o.summary === "string" ? o.summary : "",
    themes: Array.isArray(o.themes) ? o.themes.map(String).slice(0, 4) : [],
    primary,
    alternatives,
    followUp,
    confidence: typeof o.confidence === "number" ? Math.max(0, Math.min(1, o.confidence)) : 0.5,
    source: "ai",
  };
}

export async function aiRecommend(c: CheckIn, redactedMessage: string, redactedAnswer?: string): Promise<NextStepResult> {
  const user = userPrompt(c, redactedMessage, redactedAnswer);
  const oa = activeOpenAICompatible();
  const raw = oa ? await callOpenAICompatible(oa, SYSTEM, user) : await callAnthropic(SYSTEM, user);
  return parseAndValidate(raw);
}
