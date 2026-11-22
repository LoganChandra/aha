# ProfAI

Type anything you want to understand. ProfAI plans a short lesson path for your level and teaches each lesson with a visual you can play with: drag points, turn knobs, explode a machine, and stop at any point to ask why.

Live: https://profai-poc.vercel.app

## How it works

```
prompt + level ──> curated library? ──yes──> instant, free
                        │ no
                        ▼
                 Score (planner) ──> 3-5 lessons, each with a teaching pattern, grounded with web search, signed
                        ▼
                 Stage (lesson writer) ──> recipe JSON ──> checker (+1 repair) ──> our renderers
   question mid-lesson ──> Tutor ──> short answer, can move knobs and highlight parts
```

- **Learn by doing.** A lesson is 4-7 steps. Each step is a short line inside the picture, labels pinned to parts, and a task done in the scene: slide to a goal, tap a part, or predict before the reveal. Feedback is instant and a quiet "Show me" skips. Draggable handles pulse, an arrow shows the way, and tap targets ring.
- **Models write data, never code.** There are five scene types (`src/lib/recipe.ts`): `graph2d` (curves, shapes, draggable points, 130 icons), `diagram`, `model3d` (a parts library), `chart` and `timeline`. Numbers can be expressions over knobs and time (`src/lib/expr.ts`: compiled, no eval, with a work budget).
- **Prompt engineering is the product:**
  - `src/lib/animation/guide.ts`: the visual teaching guide, which goes subject by subject through what to draw and what to let the learner touch.
  - `src/lib/animation/playbook.ts`: 17 hand-written, validated example lessons.
  - `docs/research/2026-10-28-learning-science.md`: the research behind both.
- **Rules held in code, not left to the prompt:**
  - Greetings never become courses (`intent.ts`).
  - Lesson 1 is never a flowchart, and there is at most one per course.
  - The validator replays every step: goals start false, are reachable, and nothing contradicts the picture.
- **Models (Chinese only, Logan 2026-10-28):** DeepSeek V4.1 Flash first, GLM 5.3 Flash as backup, MiniMax M3.1 Flash as last resort. Calls are hedged and run without thinking: with the 18k-token prompt, thinking timed out. Bake-off: `docs/bakeoff.md`.
- **Cost (measured on prod):**
  - About $0.002 per new course plan (web search included) and about $0.002 per lesson.
  - A full new course costs about $0.01. Repeats are served from cache for free.
  - Curated library courses (`src/content/library/`) are free to serve.
  - There is a soft daily cap (`DAILY_CAP_USD`, default 10).

## Run

```bash
pnpm install
echo "OPENROUTER_API_KEY=..." > .env.local
pnpm dev
```

## Test

```bash
bun test scripts/expr.test.ts                     # expression engine, including runaway loops
node scripts/adversarial.mjs <base-url>           # 26 hostile API cases
node scripts/ui-adversarial.mjs <base-url>        # 15 browser cases: tasks, Show me, ask, phone, laptop, dark, offline, Tamil...
node scripts/walk.mjs "<prompt>" <Level> 390 844 <base-url>   # screenshot every step of lesson 1, before and after its task
bun test scripts/                                  # expression engine + every playbook example validates
node scripts/e2e.mjs "<prompt>" <Level> 390 844 <base-url>   # full walk with screenshots
```

The browser scripts use the Chromium already in `~/.cache/ms-playwright`. In development, `/dev/gallery` renders saved lessons for screenshot checks.

## Env

| Name | What |
|---|---|
| `OPENROUTER_API_KEY` | Model calls |
| `PROFAI_SECRET` | Signs plans and ask tokens |
| `DAILY_CAP_USD` | Soft daily spend cap, default 10 |
