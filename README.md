# NextStep: wellbeing next-step guide (prototype)

A small Next.js app for the YourDOST PM assignment (Task 3). A user shares how they feel in a line or two, and the app suggests **one** next step from a (fictional) catalog of counselling, instant chat, quick checks, programs and self-help, with a plain-language reason.

All data is synthetic. Not a medical service.

## Run locally

```bash
npm install
cp .env.example .env.local   # add a free GROQ_API_KEY or GEMINI_API_KEY (optional)
npm run dev                  # http://localhost:3000
```

With no key, the app still works using its rule-based fallback, so the demo never breaks.

## Deploy on Vercel (about 5 minutes)

1. Push this folder to a new GitHub repo (or run `npx vercel` from this folder).
2. On vercel.com: **Add New → Project → Import** the repo. Framework is detected as Next.js. No build settings to change.
3. In **Settings → Environment Variables**, add ONE free key (no credit card needed):
   - `GROQ_API_KEY` from https://console.groq.com/keys (default model `llama-3.3-70b-versatile`), or
   - `GEMINI_API_KEY` from https://aistudio.google.com/apikey (default model `gemini-2.5-flash`)
   - Paid options also work: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`. `AI_MODEL` overrides the model name.
4. Redeploy. Open the link and use "Show behind the scenes" at the bottom to confirm `"source": "ai"`.

Free tiers have rate limits, which is plenty for a demo. If a limit is hit, the app quietly falls back to its rules.

## How it works

```
User check-in ──► Safety screen (regex, no AI) ──crisis──► Crisis screen (Tele-MANAS 14416, on-call counsellor, 112)
                        │
                        ▼
                 Redact emails / phone numbers
                        │
                        ▼
                 LLM picks 1 step + 2 alternatives from the catalog (JSON)
                        │
                 Validate: ids must exist, schema must match ──fail──► Rule-based fallback
                        │
                        ▼
                 Merge risk (screen vs AI, take the higher)
                 Elevated risk ──► a human (counsellor) is always the primary step
                        │
                        ▼
                 Result: "Here's what I heard" + next step + why + alternatives + human option + feedback
```

| File | What it does |
|---|---|
| `app/page.tsx` | The whole UI flow (intro, check-in, follow-up, result, crisis, demo action, reviewer panel) |
| `app/api/next-step/route.ts` | Orchestrates safety screen, AI call, fallback and risk rules |
| `lib/catalog.ts` | Synthetic catalog of 14 support options |
| `lib/llm.ts` | Prompt, Anthropic / OpenAI call, strict output validation |
| `lib/safety.ts` | Crisis and elevated-risk patterns, PII redaction |
| `lib/fallback.ts` | Keyword rules used when AI is off or untrusted |
