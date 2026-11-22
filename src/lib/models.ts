// Shared by all three parts: which models run, the hedged call, and the cost meter.
import type { Route } from './ai';

// Chosen by the 2026-10-28 bake-off (scripts/bakeoff.ts, docs/bakeoff.md):
//   plans:   DeepSeek V4.1 Flash 18/18, 6s, $0.0006, best teaching.
//   lessons: DeepSeek V4.1 Flash 20/24 first try, 24/24 after one repair, 3.8s median, $0.0012.
// Backup: GLM 5.3 Flash, Logan's pick (2026-10-28). Bake-off: lessons 18/24 then 23/24, 13.5s median; plans 13/18.
//   It cannot run with thinking off, so it gets the lightest thinking and a bigger token budget.
// Last resort: MiniMax M3.1 Flash (18/18 plans, 17/24 then 20/24 lessons), only when both others fail.
// Each tier is a different company, so one provider's outage never stops a lesson.
// Thinking: Logan, 2026-10-28: "have thinking on when necessary all running on medium". Planner and lesson writer
// think at medium (built once, then cached, so the extra seconds are paid once per topic). The tutor answers live
// mid-lesson, so it stays fast with thinking off. Token budgets include the thinking.
export const PRIMARY = 'deepseek/deepseek-v4.1-flash';
export const BACKUP = 'z-ai/glm-5.3-flash';
// Logan, 2026-10-28: "only use chinese models, when you can". Last resort is MiniMax M3.1 Flash (bake-off: plans 18/18,
// lessons 17/24 first try, 20/24 after repair). It cannot run with thinking off either.
export const LAST = 'minimax/minimax-m3.1-flash';
export const MEDIUM = { effort: 'medium' } as const;
export const tiers = (maxTokens: number, think: boolean): Route[] => [
  { model: PRIMARY, reasoning: think ? MEDIUM : { enabled: false }, maxTokens },
  { model: BACKUP, reasoning: think ? MEDIUM : { effort: 'low' }, maxTokens: maxTokens + 4000 }, // GLM cannot turn thinking off
  { model: LAST, reasoning: think ? MEDIUM : { effort: 'low' }, maxTokens: maxTokens + 4000 },
];

export type Meter = { costUsd: number; ms: number; calls: { model: string; ok: boolean; costUsd: number; ms: number; note?: string }[] };
export const meter = (): Meter => ({ costUsd: 0, ms: 0, calls: [] });

/**
 * Hedged call: start the first route; if it has not succeeded within `delayMs`, start the next as well. The first
 * accepted result wins. A slow provider then costs the learner a few seconds, not a minute.
 */
export async function hedge<T>(routes: Route[], delayMs: number, run: (route: Route) => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let done = false;
    let failed = 0;
    let started = 0;
    let lastErr: unknown;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const launch = (i: number) => {
      if (done || i >= routes.length || i < started) return;
      started = i + 1;
      run(routes[i]).then(
        (v) => { if (!done) { done = true; timers.forEach(clearTimeout); resolve(v); } },
        (e) => {
          lastErr = e;
          failed++;
          if (done) return;
          if (failed >= routes.length) { done = true; reject(lastErr); return; }
          launch(started); // a failure starts the next route at once instead of waiting for the timer
        },
      );
      if (i + 1 < routes.length) timers.push(setTimeout(() => launch(i + 1), delayMs));
    };
    launch(0);
  });
}
