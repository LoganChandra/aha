# Model bake-off, 2026-10-28

How the models behind ProfAI were chosen. To rerun: `OPENROUTER_API_KEY=... bun scripts/bakeoff.ts plan`, then `REF_PLANNER=deepseek/deepseek-v4.1-flash bun scripts/bakeoff.ts lesson`.

## Method

- **Plans.** Each model planned the same 18 prompts (`scripts/bakeoff.ts`): 14 real topics at every level (including a Malay and a Chinese prompt), plus 4 hostile ones ("yo", gibberish, a pipe-bomb request, a prompt injection). A plan passes when it has the right status (ok, clarify or refuse) and 2 to 6 lessons. Refusing the injection counts as a pass. Web search was off in this run.
- **Lessons.** Each model wrote lessons 1 and 2 for the same 12 plans (24 lessons), with DeepSeek's plans used as the fixed brief. A lesson is valid when it passes `checkLesson`: the shape matches, every expression parses, only known names are used, curves have real values on screen, and the focus and set ids exist. Invalid lessons get one repair turn with the exact errors.
- Thinking is off wherever the endpoint allows it. GLM 5.3 Flash and MiniMax M3.1 Flash require thinking, so they ran at the lowest level.

## Results

| Model | Plans correct | Avg time | Cost per plan |
|---|---|---|---|
| inclusionai/ling-3.0-flash | 7/18 | 6.5s | $0.00005 |
| inclusionai/ling-3.1-flash | 16/18 | 26.5s | $0.00021 |
| qwen/qwen3.7-flash | 17/18 | 8.2s | $0.00010 |
| qwen/qwen3.8-flash | 14/18 | 13.2s | $0.00032 |
| deepseek/deepseek-v4.1-flash | 18/18 | 6.2s | $0.00060 |
| z-ai/glm-5.3-flash | 13/18 | 10.8s | $0.00018 |
| minimax/minimax-m3.1-flash | 18/18 | 11.1s | $0.00078 |
| xiaomi/mimo-v2.6-flash | 11/18 | 6.9s | $0.00017 |
| google/gemini-3.1-flash-lite | 18/18 | 3.3s | $0.00107 |
| qwen/qwen3.7-plus | 13/18 | 13.2s | $0.00107 |

| Model | Lessons valid first try | After one repair | Median time | Cost per lesson |
|---|---|---|---|---|
| inclusionai/ling-3.0-flash | 8/24 | 17/24 | 9.6s | $0.0001 |
| inclusionai/ling-3.1-flash | 8/24 | 17/24 | 26.1s | $0.0004 |
| qwen/qwen3.7-flash | 8/24 | 11/24 | 17.7s | $0.0003 |
| qwen/qwen3.8-flash | 10/24 | 16/24 | 22.4s | $0.0009 |
| deepseek/deepseek-v4.1-flash | 20/24 | 24/24 | 3.8s | $0.0012 |
| z-ai/glm-5.3-flash | 18/24 | 23/24 | 13.5s | $0.0007 |
| minimax/minimax-m3.1-flash | 17/24 | 20/24 | 14.7s | $0.0016 |
| xiaomi/mimo-v2.6-flash | 14/24 | 20/24 | 17.2s | $0.0005 |
| google/gemini-3.1-flash-lite | 17/24 | 24/24 | 3.6s | $0.0024 |
| qwen/qwen3.7-plus | 9/24 | 18/24 | 29.5s | $0.0027 |

## Decision

- **Primary, for all three jobs (plan, lesson, tutor):** DeepSeek V4.1 Flash. It was the only model valid on 20+ lessons first try, it was the fastest, and its plans had the best teaching (for example, the circle-to-wave link for trigonometry).
- **Backup:** GLM 5.3 Flash, picked by Logan on 2026-10-28. It is second on first-try validity but slow because thinking cannot be turned off. It starts when DeepSeek has not answered within 9-12s, or fails.
- **Last resort:** Gemini 3.1 Flash Lite. It runs only if both of the above fail.
- **Ling 3.0 Flash** (IR Assist's model) was the cheapest, but too unreliable at the recipe format: 8/24 valid first try.

## Caveats

- These numbers come from one run of 24 lessons per model. Treat close scores as ties.
- The prompt has been improved since this run: renames, design rules, the parts library and diagram wording. Rerun before changing models.
