# ProfAI

Type anything you want to understand. ProfAI plans a short lesson path for your level and teaches each lesson with a visual you can play with: drag points, turn knobs, explode a machine, and stop at any point to ask why.

Live: https://profai-two.vercel.app

## How it works

```
prompt + level ──> Score (planner) ──> 3-5 lessons, grounded with web search, signed
                                   └─> Stage (lesson writer) ──> recipe JSON ──> checker ──> our renderers
                       question mid-lesson ──> Tutor ──> answer + optional knob moves and highlights
```

- **Models write data, never code.** A lesson is a recipe in one of five scene types (`src/lib/recipe.ts`): `graph2d`, `diagram`, `model3d`, `chart` and `timeline`. Any number in a recipe can be an expression over the lesson's knobs and time.
- **Polish comes from the renderers** (`src/components/scene/*`). There is a hand-built parts library (`parts.ts`) of gears, wheels, coils, springs, arrows, fans, magnets, cells, lenses and chips, so a cheap model can't produce a janky scene.
- **Expressions** run through a small parser and compiler (`src/lib/expr.ts`). It never uses `eval`, and there is a work budget per evaluation.
- **The checker** (`src/lib/validate.ts`) forgives small slips (renamed knobs, trimmed text) and returns real problems to the model for one repair turn. Anything still broken is removed before rendering.
- **Greetings and filler** ("yo", "hi", an emoji) are caught in code before any model runs (`src/lib/intent.ts`).
- **Models:** DeepSeek V4.1 Flash first, GLM 5.3 Flash as backup and Gemini 3.1 Flash Lite as last resort. Calls are hedged: the next model starts when the current one is slow. See `docs/bakeoff.md`.
- **Cost:**
  - Plans and lessons are cached in the Vercel Runtime Cache, so a topic is built once and served to everyone.
  - Plans are HMAC-signed, so the server only writes lessons for plans it made.
  - `/api/ask` requires a token from a real course.
  - Visitors are rate-limited, and there is a soft daily cap (`DAILY_CAP_USD`, default 10).

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
node scripts/ui-adversarial.mjs <base-url>        # 13 browser cases: phone, laptop, dark, offline, Tamil...
node scripts/e2e.mjs "<prompt>" <Level> 390 844 <base-url>   # full walk with screenshots
```

The browser scripts use the Chromium already in `~/.cache/ms-playwright`. In development, `/dev/gallery` renders saved lessons for screenshot checks.

## Env

| Name | What |
|---|---|
| `OPENROUTER_API_KEY` | Model calls |
| `PROFAI_SECRET` | Signs plans and ask tokens |
| `DAILY_CAP_USD` | Soft daily spend cap, default 10 |
