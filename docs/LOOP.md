---
topic: profai-improvement-loop
audience: frank
summary: The all-day fix loop for ProfAI. It works through the panel tracker one class at a time, verifies each fix, and re-runs the blind panel.
last_updated: 2026-10-29
---

# The ProfAI improvement loop

Logan, 2026-10-29 (voice note, verbatim): "Treat them like they are your customer reports ... Word for word, leave nothing that they say out. Make sure to fix everything ... create a loop to just keep iterating ... go research loops for AI agents ... keep iterating throughout the day."

## What the research says

- Anthropic, "Effective harnesses for long-running agents" (anthropic.com/engineering/effective-harnesses-for-long-running-agents, read through secondary write-ups):
  - Keep state in files, not in the context: a feature list with a pass flag on every item, a progress log, and git.
  - Each session reads the progress file and the git log, runs a baseline check, takes ONE feature, verifies it end to end in a browser, and only then marks it passing.
- The "Ralph" loop (Geoffrey Huntley, 2025):
  - Feed the same prompt again and again, each pass building on the last, with failures fed back in.
  - It works best where an automatic check exists. Where judgement is needed, a human gate (here: Frank reading screenshots, then the blind panel) has to sit in the loop.

## Our loop (one turn = one class)

1. **Orient.** Read `docs/qa/2026-10-29-panel/TRACKER.md` (the feature list), the progress log below, and `git log -5`.
2. **Baseline.** Run `bun test scripts/`. Before a deploy, also run the prod suites.
3. **Pick.** Take the highest open class: P0 before P1 before P2, and more personas first.
4. **Research.** Get a source for the fix: a WCAG, HIG or NN/g rule, or a primary source for subject facts.
5. **Fix the class, not the instance.** Prefer rules held in code (validator, renderer) over prompt-only rules, because the cheap models ignore prompt rules.
6. **Verify.**
   - Unit tests.
   - `scripts/adversarial.mjs` and `scripts/ui-adversarial.mjs`.
   - `scripts/walk.mjs` on the persona's own topic, read with my own eyes.
   - Bump `CACHE_VERSION` if prompts changed.
7. **Ship.** Commit, push (Vercel deploys main), and confirm the deploy is Ready.
8. **Record.**
   - Set each item's status to `fixed (<commit>, <check>)`.
   - Add one line to the progress log.
   - Send a terse Discord line on each deploy.
9. **No panel re-runs.** Logan, 2026-10-29, verbatim: "you don't have to keep rerunning these reviews. They are way too token-heavy ... you don't have to keep deploying every time ... loop over fixing, building, testing". So:
   - Use only the five reports we have.
   - Deploy in batches, not after every fix.
   - Testing is light: unit tests, a type check and build, a few walks. The full prod suites run once per batch deploy.
10. **Stop rules.** Rails still hold. Spend stays under the daily cap (`scripts/budget.sh`). Anything that is Logan's call becomes `needs-logan` and gets one batched question.

## Progress log

- 2026-10-29 09:15: loop started. The tracker is being built from the 5 reports. First fix: the ask answer was hidden behind the recap card.
- 2026-10-29 batch 1 (450af6e): the answer now shows above the recap card (C03). Taps are forgiving: duplicate targets count, empty-space taps get a message, the target highlights after a miss, and thin lines get wide hit strokes (C02). A words-vs-picture inspector checks each lesson, with one repair turn (C01, C04, C06). The checker now catches blank readouts and feedback that quotes a fixed goal value.
- batch 2 (2962e7f): the UI follows the learner's language (C18). Searches use only the learner's words, and junk sources are filtered (C05). Also: the disclaimer moved up; the home screen gets a level picker and example topics (C10, C26); Show me sits inside the task card and gives no tick (C12); Continue explains itself (C24); the step count is labelled; a course-end card has share and restart (C13); readouts sit in a strip; labels and callouts are placed to avoid overlap (C07); the writer prompt carries the panel's rules.
- batch 2b (5de12c5): the app is renamed AHA, at ahapoc.vercel.app. The picture area is stable. Knobs with two states show named buttons, and sliders get +/- buttons with a full-width track (C19). Knobs a step moves are named on screen (C11).
- batch 3 (94ee08b): the course outline shows while lesson 1 draws (C08). Prediction choices are compact. Prompts now cover Expert depth (C21), Malay wording (C20), follow-up answers (C14) and pacing (C17).
- Deployed; prod: API 25/26 then 26/26 on a clean rerun; UI 18/18 (3 new checks).
- batch 4 (b1086ef): a wrong tap names what it hit, a wrong prediction names the answer, and a slide that stops short gets a nudge (C15). Contrast went up (C22), the writer got chart and number rules (C23), and reloading keeps the course (C25).
- batch 5 (39c1228, 3786424, ef1ee32): the inspector now sees overlaps and tiny targets. Tick numbers sit in the margins. ENGINE.md was written. **New AHA templates: spectrum, network, attention**, routed in code. Prod: API 26/26, UI 19/19.
- batch 6 (a4ddfc6 to ab54bbb): the planner now covers everything the request names, links lessons and adds exam practice (C09). The inspector is more precise. Lesson 1 inspects within a time budget. **AI templates added: next word, tokens, embedding, descent** (Logan: AI topics first). Prod: API 26/26, UI 19/19.
