---
topic: aha-engine
audience: frank, logan, anyone building a new front end on AHA
summary: AHA (Adaptive Hands-on Animator) is the engine, and this is its contract. Any topic goes in; out comes a renderer-neutral lesson recipe that any UI or visual style can draw.
last_updated: 2026-10-29
---

# AHA: Adaptive Hands-on Animator

Logan, 2026-10-29: "rmb youre building the engine. the POC is just a way to show case this engine. it should be able to adapt to any UI or style for the visualizations later on."

AHA turns a request ("why is the sky blue", "attention in transformers", "bagaimana vaksin berfungsi") into a short course of hands-on lessons. The app at ahapoc.vercel.app is one skin over it.

## Pipeline

| Stage | What it does | Code |
|---|---|---|
| Intent | Greetings and filler never become courses; picks the language | `src/lib/intent.ts` |
| **Score** (planner) | Writes 3 to 5 lessons, each with a goal, an aha and a teaching pattern. A web search runs on the learner's words, and junk sources are filtered out | `makePlan` in `src/lib/engine.ts` |
| **Stage** (writer) | Writes one lesson as recipe JSON, guided by the visual guide and the 19-pattern playbook | `makeLesson` and `writeWith` |
| **Checker** | Replays every step deterministically: expressions, ids, reachable goals, blank readouts, overlaps, giveaways. Gives one repair turn | `src/lib/validate.ts` |
| **Inspector** | Records what the screen shows at each step. A cheap model compares the words with that record and checks facts, then gives one repair turn | `src/lib/inspect.ts`, `CHECK_SYSTEM` |
| Tutor | Answers mid-lesson questions; it may move knobs and highlight parts | `answerQuestion` |

Models are Chinese only, run without thinking, and hedged across providers: DeepSeek V4.1 Flash, then GLM 5.3 Flash, then MiniMax M3.1 Flash. Measured cost is about $0.002 per plan and about $0.003 per lesson including the inspector. Results are cached.

## The contract: the lesson recipe

The schema is in `src/lib/recipe.ts` and is validated with zod. A recipe holds **no pixels, fonts or colours**:

- `params`: knobs with a range, a unit, and optional `choices` (named states).
- `scene`: what to draw, as data. Coordinates are in the scene's own units, not pixels. It can be one of these:
  - free drawings: `graph2d` (curves, shapes, icons, draggable points, readouts), `model3d` (parts from the parts library), `diagram`, `chart`, `timeline`;
  - designed templates the model only fills in: `pipeline`, `iconArray`, `balance`, `spectrum`, `network`;
  - AI templates, whose maths runs in the renderer, not the model: `attention` (softmax, scale, causal mask), `nextWord` (softmax at a temperature), `tokens`, `embedding` (nearest neighbours by real distance), `descent` (slope and steps on the loss curve).
  - Lessons plainly about one of these are routed to its pattern in code (`templateFor` in `engine.ts`).
- Colours are roles (`primary`, `accent`, `warm`, `cool`, `green`, `red`, `neutral`), and the renderer maps them to its own palette.
- `steps`: `say`, `callouts` (pinned to scene ids), `set` / `focus` / `play`, a `task` (`slide` toward a goal, `tap` a target, or `predict` with a reveal), and `after`.
- Every number on screen is an expression of the knobs (`{sin(theta)}`), so any renderer can recompute it live.

## Writing a new skin

A front end needs to do five things:

1. Map the roles to its palette and pick its fonts.
2. Draw each scene type: implement `Stage` (`src/components/Stage.tsx` routes each scene type to a renderer).
3. Run steps and tasks: goals are checked with `evaluate(goal, env)`, and the "Show me" target is found with `goalTarget`.
4. Show the app's own words in the learner's language (`src/lib/i18n.ts`).
5. Call `/api/plan`, `/api/lesson` and `/api/ask`.

Nothing in the engine assumes the current look. The POC's look (Source Serif, warm paper, springs) lives only in `src/components` and `globals.css`.

## Quality loop

The blind persona panel of 2026-10-29 is in `docs/qa/2026-10-29-panel/` (221 items), and the fix loop is in `docs/LOOP.md`. Rules that cheap models ignore in a prompt are enforced in code (the checker), and the inspector covers the words-versus-picture class.
