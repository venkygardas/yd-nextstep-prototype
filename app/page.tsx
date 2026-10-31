"use client";

import { useState } from "react";
import { byId, type CatalogItem } from "@/lib/catalog";
import type { CheckIn, NextStepResult } from "@/lib/types";

type Screen = "intro" | "checkin" | "loading" | "followup" | "result" | "crisis" | "action";

const MOODS = [
  { v: 1, label: "Really low" },
  { v: 2, label: "Low" },
  { v: 3, label: "Okay" },
  { v: 4, label: "Good" },
  { v: 5, label: "Great" },
];
const EXAMPLES = [
  "I can't switch off after work and I'm sleeping badly before every deadline",
  "I want to quit smoking but I keep giving in when I'm stressed",
  "Things have felt flat for a couple of months. Nothing really feels fun anymore",
  "My partner and I keep fighting about small things",
];
const TYPE_LABEL: Record<CatalogItem["type"], string> = {
  counselling: "1:1 counselling",
  chat: "Instant chat",
  assessment: "Quick check",
  program: "Structured program",
  "self-help": "Self-help",
};

interface LogEvent { t: string; e: string; d?: string }

export default function Home() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [mood, setMood] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState<CheckIn["duration"] | "">("");
  const [preference, setPreference] = useState<CheckIn["preference"] | "">("");
  const [result, setResult] = useState<NextStepResult | null>(null);
  const [followQ, setFollowQ] = useState<{ question: string; options: string[] } | null>(null);
  const [chosen, setChosen] = useState<CatalogItem | null>(null);
  const [feedback, setFeedback] = useState<"" | "yes" | "no">("");
  const [showBts, setShowBts] = useState(false);
  const [log, setLog] = useState<LogEvent[]>([]);
  const [error, setError] = useState("");

  const track = (e: string, d?: string) =>
    setLog((l) => [...l, { t: new Date().toLocaleTimeString(), e, d }]);

  const canSubmit = mood > 0 && message.trim().length >= 3 && duration && preference;

  async function submit(answer?: string, question?: string) {
    setError("");
    setScreen("loading");
    track(answer ? "followup_answered" : "checkin_submitted", answer);
    const body: CheckIn = {
      message, mood, duration: duration as CheckIn["duration"], preference: preference as CheckIn["preference"],
      ...(answer ? { answerToFollowUp: answer, followUpQuestion: question } : {}),
    };
    try {
      const res = await fetch("/api/next-step", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error || "Something went wrong");
      const r: NextStepResult = await res.json();
      setResult(r);
      track("recommendation_shown", `${r.source} · risk ${r.risk} · ${r.primary?.id ?? (r.followUp ? "follow-up" : "none")} · conf ${r.confidence}`);
      if (r.risk === "crisis") { setScreen("crisis"); track("crisis_screen_shown"); return; }
      if (!r.primary && r.followUp) { setFollowQ(r.followUp); setScreen("followup"); return; }
      setScreen("result");
    } catch (e) {
      setError((e as Error).message);
      setScreen("checkin");
    }
  }

  function act(item: CatalogItem, from: "primary" | "alternative" | "human") {
    setChosen(item);
    track("step_started", `${item.id} (${from})`);
    setScreen("action");
  }

  function restart() {
    setScreen("checkin"); setResult(null); setFollowQ(null); setChosen(null); setFeedback("");
  }

  const primaryItem = result?.primary ? byId(result.primary.id) : null;

  return (
    <main className="wrap">
      <div className="top">
        <div className="logo">Next<span>Step</span></div>
        <div className="demo">Prototype · fictional data</div>
      </div>

      {screen === "intro" && (
        <>
          <div className="card">
            <h1>Not sure where to start?</h1>
            <p className="sub">Tell me a little about what's going on. In about a minute, I'll suggest one next step that fits, out of everything available to you: counsellors, quick checks, programs and self-help.</p>
            <div style={{ height: 14 }} />
            <button className="btn" onClick={() => { setScreen("checkin"); track("started"); }}>Let's start</button>
          </div>
          <div className="privacy">
            <b>Your privacy.</b> This is a demo, so please use made-up details. In a real version, what you write stays private between you and the platform. Your employer never sees it.
          </div>
        </>
      )}

      {screen === "checkin" && (
        <div className="card">
          <h2>How are you feeling today?</h2>
          <div className="mood">
            {MOODS.map((m) => (
              <button key={m.v} className={mood === m.v ? "on" : ""} onClick={() => setMood(m.v)} aria-pressed={mood === m.v}>
                <b>{m.v}</b>{m.label}
              </button>
            ))}
          </div>

          <label className="label" htmlFor="msg">What's on your mind?</label>
          <textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write it the way you'd say it to a friend. A line or two is enough." />
          <div className="hint" style={{ margin: "8px 0 6px" }}>Or try an example:</div>
          <div className="chips">
            {EXAMPLES.map((ex) => (
              <button key={ex} className="chip ghost" onClick={() => setMessage(ex)}>{ex.length > 46 ? ex.slice(0, 44) + "…" : ex}</button>
            ))}
          </div>

          <span className="label">How long has this been going on?</span>
          <div className="chips">
            {([["days", "A few days"], ["weeks", "A few weeks"], ["months", "Months"], ["unsure", "Not sure"]] as const).map(([v, l]) => (
              <button key={v} className={`chip ${duration === v ? "on" : ""}`} onClick={() => setDuration(v)}>{l}</button>
            ))}
          </div>

          <span className="label">What sounds better right now?</span>
          <div className="chips">
            {([["talk", "Talking to someone"], ["self", "Something I can do myself"], ["unsure", "Not sure"]] as const).map(([v, l]) => (
              <button key={v} className={`chip ${preference === v ? "on" : ""}`} onClick={() => setPreference(v)}>{l}</button>
            ))}
          </div>

          {error && <div className="notice" style={{ marginTop: 14 }}>{error}</div>}
          <div style={{ height: 18 }} />
          <button className="btn" disabled={!canSubmit} onClick={() => submit()}>Find my next step</button>
        </div>
      )}

      {screen === "loading" && (
        <div className="card" style={{ textAlign: "center", padding: 36 }}>
          <div className="dots"><i /><i /><i /></div>
          <p className="sub" style={{ marginTop: 12 }}>Thinking about what would help most…</p>
        </div>
      )}

      {screen === "followup" && followQ && (
        <div className="card">
          <h2>One quick question</h2>
          <p className="sub">{followQ.question}</p>
          <div style={{ height: 8 }} />
          <div className="chips">
            {followQ.options.map((o) => (
              <button key={o} className="chip" onClick={() => submit(o, followQ.question)}>{o}</button>
            ))}
          </div>
        </div>
      )}

      {screen === "result" && result && primaryItem && (
        <>
          {result.risk === "elevated" && (
            <div className="notice">
              It sounds like a lot right now. If things ever feel unsafe, you can call <b>Tele-MANAS on 14416</b> (free, 24x7) or speak to an on-call counsellor below.
            </div>
          )}

          <div className="card heard">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
              <b>Here's what I heard</b>
              <button className="link" onClick={() => { setScreen("checkin"); track("edited_input"); }}>Not quite right? Edit</button>
            </div>
            <p>{result.summary}</p>
          </div>

          <div className="card primary">
            <div className="badge">Your next step · {TYPE_LABEL[primaryItem.type]}</div>
            <h2>{primaryItem.title}</h2>
            <p className="sub">{primaryItem.blurb}</p>
            <div className="why"><b>Why this</b>{result.primary!.why}</div>
            <div className="meta" style={{ marginBottom: 14 }}>{primaryItem.time}</div>
            <button className="btn" onClick={() => act(primaryItem, "primary")}>{primaryItem.cta}</button>
          </div>

          {result.alternatives.length > 0 && (
            <div className="card">
              <b>Other options</b>
              <div style={{ height: 4 }} />
              {result.alternatives.map((a) => {
                const it = byId(a.id)!;
                return (
                  <div className="alt" key={a.id}>
                    <div>
                      <div className="t">{it.title}</div>
                      <div className="w">{a.why}</div>
                    </div>
                    <button className="chip" onClick={() => act(it, "alternative")}>Open</button>
                  </div>
                );
              })}
            </div>
          )}

          {primaryItem.type !== "counselling" && primaryItem.type !== "chat" && (
            <div className="card human">
              <div><b>Rather talk to a person?</b><div className="w hint">A real human is always one tap away.</div></div>
              <button className="chip" onClick={() => act(byId("instant-chat")!, "human")}>Chat now</button>
            </div>
          )}

          <div className="card feedback">
            {feedback ? <span>Thanks, that helps us get better.</span> : (
              <>
                <span>Did this feel right for you?</span>
                <div className="row">
                  <button className="chip" onClick={() => { setFeedback("yes"); track("feedback", "helpful"); }}>Yes</button>
                  <button className="chip" onClick={() => { setFeedback("no"); track("feedback", "not helpful"); }}>Not really</button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {screen === "crisis" && (
        <div className="card crisis">
          <h1>You don't have to go through this alone.</h1>
          <p className="sub">What you shared matters, and talking to someone right now can help. These are free and confidential.</p>
          <a href="tel:14416" style={{ textDecoration: "none" }}><button className="btn warm">Call Tele-MANAS · 14416 (24x7)</button></a>
          <button className="btn" onClick={() => act(byId("counselling")!, "human")}>Connect me to an on-call counsellor now</button>
          <a href="tel:112" style={{ textDecoration: "none" }}><button className="btn secondary">In immediate danger? Call 112</button></a>
          <p className="hint" style={{ marginTop: 14 }}>If you can, let someone you trust know how you're feeling and stay with them.</p>
          <button className="link" onClick={restart}>I'm safe right now, go back</button>
        </div>
      )}

      {screen === "action" && chosen && (
        <div className="card done">
          <div className="badge" style={{ color: "var(--ok)" }}>Demo action</div>
          <h2>{chosen.type === "counselling" ? "Here's who we'd match you with" : chosen.type === "chat" ? "Connecting you to a listener" : "You're all set"}</h2>
          <p className="sub">
            In the real product this opens <b>{chosen.title}</b>
            {chosen.type === "counselling" ? ", with your check-in shared with the expert only if you agree, so you don't have to repeat yourself." : "."}
            {" "}We'd check in after a few days to see how it's going and suggest what to do next.
          </p>
          <div style={{ height: 10 }} />
          <div className="row">
            <button className="btn secondary" onClick={() => setScreen(result?.risk === "crisis" ? "crisis" : "result")}>Back</button>
            <button className="btn" onClick={restart}>Start over</button>
          </div>
        </div>
      )}

      {screen !== "intro" && (
        <div style={{ marginTop: 18 }}>
          <button className="link" onClick={() => setShowBts((s) => !s)}>{showBts ? "Hide" : "Show"} behind the scenes (for reviewers)</button>
          {showBts && (
            <div className="bts" style={{ marginTop: 8 }}>
              {result ? JSON.stringify(result, null, 2) : "No recommendation yet."}
              {"\n\n// event log (what we'd send to analytics)\n"}
              {log.map((l) => `${l.t}  ${l.e}${l.d ? "  " + l.d : ""}`).join("\n")}
            </div>
          )}
        </div>
      )}

      <div className="footer">Prototype for the YourDOST PM assignment · all content is fictional · not a medical service</div>
    </main>
  );
}
