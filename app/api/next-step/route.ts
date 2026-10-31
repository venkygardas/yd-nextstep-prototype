import { NextResponse } from "next/server";
import { screen, redact } from "@/lib/safety";
import { rulesRecommend } from "@/lib/fallback";
import { aiConfigured, aiProvider, aiRecommend } from "@/lib/llm";
import type { CheckIn, NextStepResult } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let c: CheckIn;
  try {
    c = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const message = String(c.message ?? "").trim();
  if (message.length < 3) return NextResponse.json({ error: "Tell me a little more" }, { status: 400 });
  c.mood = Math.max(1, Math.min(5, Number(c.mood) || 3));

  // 1. Safety screen first. A crisis never waits on the AI.
  const screened = screen(`${message} ${c.answerToFollowUp ?? ""}`);
  if (screened === "crisis") {
    const r: NextStepResult = {
      risk: "crisis", summary: "", themes: [], primary: null, alternatives: [], followUp: null,
      confidence: 1, source: "safety-screen", note: "Crisis phrase matched by the rule-based screen. AI was not called.",
    };
    return NextResponse.json(r);
  }

  // 2. AI recommendation, with rules as the fallback.
  let result: NextStepResult;
  if (aiConfigured()) {
    try {
      result = await aiRecommend(c, redact(message), c.answerToFollowUp ? redact(c.answerToFollowUp) : undefined);
      result.note = `AI provider: ${aiProvider()}`;
      // Never ask more than one follow-up.
      if (c.answerToFollowUp && !result.primary) throw new Error("No pick after follow-up");
    } catch (e) {
      result = rulesRecommend({ ...c, message }, screened);
      result.note = `AI failed or was not trusted (${(e as Error).message.slice(0, 120)}). Used rules.`;
    }
  } else {
    result = rulesRecommend({ ...c, message }, screened);
  }

  // 3. Merge risk: take the more serious of the screen and the AI.
  const order = { none: 0, elevated: 1, crisis: 2 } as const;
  if (order[screened] > order[result.risk]) result.risk = screened;

  // 4. Elevated risk always puts a human first.
  if (result.risk === "elevated" && result.primary && !["counselling", "instant-chat"].includes(result.primary.id)) {
    result.alternatives = [result.primary, ...result.alternatives].slice(0, 2);
    result.primary = { id: "counselling", why: "What you're carrying sounds heavy. A counsellor can help you with this properly, and you don't have to figure it out alone." };
    result.followUp = null;
  }

  return NextResponse.json(result);
}
