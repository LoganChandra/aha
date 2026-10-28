// The engine: Score (plan the path) and Stage (write each lesson's scene), plus answers to mid-lesson questions.
// Each stage walks a chain of models: the cheap strong one first, a different family as the fallback.
import { AiError, chatJson, type Msg, type Route } from './ai';
import { ASK_SYSTEM, LESSON_SYSTEM, PLAN_SYSTEM, lessonUser, planUser, repairUser } from './prompts';
import { Plan, type Lesson, type Level, type Source } from './recipe';
import { checkLesson, repair } from './validate';

// Chosen by the 2026-10-28 bake-off (scripts/bakeoff.ts, docs/bakeoff.md):
//   plans:   DeepSeek V4.1 Flash 18/18, 6s, $0.0006, best teaching.
//   lessons: DeepSeek V4.1 Flash 20/24 first try, 24/24 after one repair, 3.8s median, $0.0012.
// Backup: GLM 5.3 Flash, Logan's pick (2026-10-28). Bake-off: lessons 18/24 then 23/24, 13.5s median; plans 13/18.
//   It cannot run with thinking off, so it gets the lightest thinking and a bigger token budget.
// Last resort: Gemini 3.1 Flash Lite (18/18 plans, 24/24 lessons, 3.6s), only when both others fail.
// Each tier is a different company, so one provider's outage never stops a lesson.
// Thinking: Logan, 2026-10-28: "have thinking on when necessary all running on medium". Planner and lesson writer
// think at medium (built once, then cached, so the extra seconds are paid once per topic). The tutor answers live
// mid-lesson, so it stays fast with thinking off. Token budgets include the thinking.
const PRIMARY = 'deepseek/deepseek-v4.1-flash';
const BACKUP = 'z-ai/glm-5.3-flash';
const LAST = 'google/gemini-3.1-flash-lite';
const MEDIUM = { effort: 'medium' } as const;
const tiers = (maxTokens: number, think: boolean): Route[] => [
  { model: PRIMARY, reasoning: think ? MEDIUM : { enabled: false }, maxTokens },
  { model: BACKUP, reasoning: think ? MEDIUM : { effort: 'low' }, maxTokens: maxTokens + 4000 }, // GLM cannot turn thinking off
  { model: LAST, reasoning: think ? MEDIUM : { enabled: false }, maxTokens },
];
export const PLAN_ROUTES: Route[] = tiers(10_000, true);
export const LESSON_ROUTES: Route[] = tiers(20_000, true);
export const ASK_ROUTES: Route[] = tiers(800, false);

export type Meter = { costUsd: number; ms: number; calls: { model: string; ok: boolean; costUsd: number; ms: number; note?: string }[] };
const meter = (): Meter => ({ costUsd: 0, ms: 0, calls: [] });

/**
 * Hedged call: start the first route; if it has not succeeded within `delayMs`, start the next as well. The first
 * accepted result wins. A slow provider then costs the learner a few seconds, not a minute.
 */
async function hedge<T>(routes: Route[], delayMs: number, run: (route: Route) => Promise<T>): Promise<T> {
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

export async function makePlan(prompt: string, level: Level, routes = PLAN_ROUTES, web = true): Promise<{ plan: Plan; sources: Source[]; meter: Meter }> {
  const m = meter();
  const t0 = Date.now();
  const res = await hedge(routes, 20_000, async (route) => {
    try {
      const r = await chatJson(route, [{ role: 'system', content: PLAN_SYSTEM }, { role: 'user', content: planUser(prompt, level) }], { web, timeoutMs: 40_000, temperature: 0.3 });
      m.costUsd += r.costUsd;
      const parsed = Plan.safeParse(r.data);
      if (!parsed.success) throw new AiError(`plan shape: ${parsed.error.issues[0]?.message}`);
      const plan = parsed.data;
      if (plan.status === 'ok' && plan.lessons.length < 2) throw new AiError('plan has fewer than 2 lessons');
      if (plan.status === 'clarify' && !plan.question) plan.question = 'What would you like to understand?';
      m.calls.push({ model: route.model, ok: true, costUsd: r.costUsd, ms: r.ms });
      return { plan, sources: r.sources.slice(0, 6) };
    } catch (e) {
      m.calls.push({ model: route.model, ok: false, costUsd: 0, ms: 0, note: (e as Error).message.slice(0, 160) });
      throw e;
    }
  });
  m.ms = Date.now() - t0;
  return { ...res, meter: m };
}

type Written = { lesson: Lesson; errors: string[] };

/** One model writes the lesson, with one repair turn if the checker finds problems. */
async function writeWith(route: Route, user: string, m: Meter, deadline: number): Promise<Written> {
  const messages: Msg[] = [{ role: 'system', content: LESSON_SYSTEM }, { role: 'user', content: user }];
  let best: Written | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    // Every call fits inside the function's time limit, so a slow first try cannot starve the others.
    const left = deadline - Date.now() - 2000;
    if (left < 8000) break;
    let r;
    try {
      r = await chatJson(route, messages, { timeoutMs: Math.min(80_000, left), temperature: 0.4 });
    } catch (e) {
      m.calls.push({ model: route.model, ok: false, costUsd: 0, ms: 0, note: (e as Error).message.slice(0, 160) });
      break; // a dead or garbled model gets no repair turn
    }
    m.costUsd += r.costUsd;
    const checked = checkLesson(r.data);
    m.calls.push({ model: route.model, ok: checked.errors.length === 0 && !!checked.lesson, costUsd: r.costUsd, ms: r.ms, note: checked.errors.slice(0, 3).join(' | ') || undefined });
    if (checked.lesson && checked.errors.length === 0) return { lesson: checked.lesson, errors: [] };
    if (checked.lesson && (!best || checked.errors.length < best.errors.length)) best = { lesson: checked.lesson, errors: checked.errors };
    messages.push({ role: 'assistant', content: r.text.slice(0, 12000) }, { role: 'user', content: repairUser(checked.errors) });
  }
  if (best) throw Object.assign(new AiError('lesson still had problems after a repair'), { best });
  throw new AiError(`${route.model} produced no lesson`);
}

export async function makeLesson(plan: Plan, index: number, level: Level, sources: Source[], routes = LESSON_ROUTES, deadline = Date.now() + 170_000): Promise<{ lesson: Lesson; meter: Meter; repaired: boolean; errors: string[] }> {
  const m = meter();
  const t0 = Date.now();
  const user = lessonUser(plan, index, level, sources);
  // Imperfect drafts from every route are kept; if no route writes a clean lesson, the least broken one is repaired.
  const drafts: Written[] = [];
  try {
    const { lesson } = await hedge(routes, 35_000, (route) => writeWith(route, user, m, deadline).catch((e) => {
      if ((e as { best?: Written }).best) drafts.push((e as { best: Written }).best);
      throw e;
    }));
    m.ms = Date.now() - t0;
    return { lesson, meter: m, repaired: false, errors: [] };
  } catch (e) {
    m.ms = Date.now() - t0;
    const best = drafts.sort((a, b) => a.errors.length - b.errors.length)[0];
    if (best) return { lesson: repair(best.lesson), meter: m, repaired: true, errors: best.errors };
    throw e instanceof Error ? e : new AiError('no model produced a usable lesson');
  }
}

export type AskContext = {
  topic: string;
  level: Level;
  lessonTitle: string;
  beatText: string;
  params: { id: string; label: string; value: number; min: number; max: number }[];
  sceneIds: string[];
  sceneSummary: string;
};

export type Answer = { answer: string; set?: Record<string, number>; focus?: string[] };

export async function answerQuestion(question: string, ctx: AskContext, history: { q: string; a: string }[] = [], routes = ASK_ROUTES): Promise<{ answer: Answer; meter: Meter }> {
  const m = meter();
  const t0 = Date.now();
  const user = `Course: ${ctx.topic}
Learner level: ${ctx.level}
Lesson: ${ctx.lessonTitle}
They were reading: "${ctx.beatText}"
Scene: ${ctx.sceneSummary}
Knobs (param ids): ${ctx.params.map((p) => `${p.id} "${p.label}" = ${p.value} (range ${p.min} to ${p.max})`).join('; ') || 'none'}
Scene ids you may focus: ${ctx.sceneIds.slice(0, 40).join(', ') || 'none'}
${history.length ? `Earlier in this lesson:\n${history.slice(-3).map((h) => `Q: ${h.q}\nA: ${h.a}`).join('\n')}\n` : ''}
Their question: """${question.slice(0, 500)}"""`;
  const answer = await hedge(routes, 6000, async (route) => {
    try {
      const r = await chatJson<Answer>(route, [{ role: 'system', content: ASK_SYSTEM }, { role: 'user', content: user }], { timeoutMs: 20_000, temperature: 0.3 });
      m.costUsd += r.costUsd;
      m.calls.push({ model: route.model, ok: true, costUsd: r.costUsd, ms: r.ms });
      const a = r.data;
      if (typeof a?.answer !== 'string' || !a.answer.trim()) throw new AiError('empty answer');
      const ids = new Set(ctx.params.map((p) => p.id));
      const set = a.set && typeof a.set === 'object'
        ? Object.fromEntries(Object.entries(a.set).filter(([k, v]) => ids.has(k) && typeof v === 'number' && Number.isFinite(v)).map(([k, v]) => {
            const p = ctx.params.find((q) => q.id === k)!;
            return [k, Math.min(p.max, Math.max(p.min, v))];
          }))
        : undefined;
      const scene = new Set(ctx.sceneIds);
      const focus = Array.isArray(a.focus) ? a.focus.filter((f) => typeof f === 'string' && scene.has(f)) : undefined;
      return { answer: a.answer.slice(0, 1200), set, focus };
    } catch (e) {
      m.calls.push({ model: route.model, ok: false, costUsd: 0, ms: 0, note: (e as Error).message.slice(0, 160) });
      throw e;
    }
  });
  m.ms = Date.now() - t0;
  return { answer, meter: m };
}
