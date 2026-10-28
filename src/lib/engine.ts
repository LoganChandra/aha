// The engine: Score (plan the path) and Stage (write each lesson's scene), plus answers to mid-lesson questions.
// Each stage walks a chain of models: the cheap strong one first, a different family as the fallback.
import { AiError, chatJson, type Msg, type Route } from './ai';
import { ASK_SYSTEM, LESSON_SYSTEM, PLAN_SYSTEM, lessonUser, planUser, repairUser } from './prompts';
import { Plan, type Lesson, type Level, type Source } from './recipe';
import { checkLesson, repair } from './validate';

// Chosen by the 2026-10-28 bake-off (scripts/bakeoff.ts, docs/bakeoff.md):
//   plans:   DeepSeek V4.1 Flash 18/18, 6s, $0.0006, best teaching; Gemini 3.1 Flash Lite 18/18, 3s.
//   lessons: DeepSeek V4.1 Flash 20/24 first try, 24/24 after one repair, 3.8s median, $0.0012.
//            Gemini 3.1 Flash Lite 17/24 then 24/24, 3.6s, $0.0024. Ling 3.0 Flash: 8/24 then 17/24.
// The fallback is a different model family so one provider's outage never stops a lesson.
const PRIMARY = 'deepseek/deepseek-v4.1-flash';
const FALLBACK = 'google/gemini-3.1-flash-lite';
export const PLAN_ROUTES: Route[] = [
  { model: PRIMARY, reasoning: { enabled: false }, maxTokens: 3000 },
  { model: FALLBACK, reasoning: { enabled: false }, maxTokens: 3000 },
];
export const LESSON_ROUTES: Route[] = [
  { model: PRIMARY, reasoning: { enabled: false }, maxTokens: 7000 },
  { model: FALLBACK, reasoning: { enabled: false }, maxTokens: 7000 },
];
export const ASK_ROUTES: Route[] = [
  { model: PRIMARY, reasoning: { enabled: false }, maxTokens: 800 },
  { model: FALLBACK, reasoning: { enabled: false }, maxTokens: 800 },
];

export type Meter = { costUsd: number; ms: number; calls: { model: string; ok: boolean; costUsd: number; ms: number; note?: string }[] };
const meter = (): Meter => ({ costUsd: 0, ms: 0, calls: [] });

export async function makePlan(prompt: string, level: Level, routes = PLAN_ROUTES, web = true): Promise<{ plan: Plan; sources: Source[]; meter: Meter }> {
  const m = meter();
  const t0 = Date.now();
  let lastErr: unknown;
  for (const route of routes) {
    try {
      const r = await chatJson(route, [{ role: 'system', content: PLAN_SYSTEM }, { role: 'user', content: planUser(prompt, level) }], { web, timeoutMs: 60_000, temperature: 0.3 });
      m.costUsd += r.costUsd;
      const parsed = Plan.safeParse(r.data);
      if (!parsed.success) throw new AiError(`plan shape: ${parsed.error.issues[0]?.message}`);
      const plan = parsed.data;
      if (plan.status === 'ok' && plan.lessons.length < 2) throw new AiError('plan has fewer than 2 lessons');
      if (plan.status === 'clarify' && !plan.question) plan.question = 'What would you like to understand?';
      plan.lessons = plan.lessons.slice(0, 6);
      m.calls.push({ model: route.model, ok: true, costUsd: r.costUsd, ms: r.ms });
      m.ms = Date.now() - t0;
      return { plan, sources: r.sources.slice(0, 6), meter: m };
    } catch (e) {
      lastErr = e;
      m.calls.push({ model: route.model, ok: false, costUsd: 0, ms: 0, note: (e as Error).message.slice(0, 160) });
    }
  }
  throw lastErr instanceof Error ? lastErr : new AiError('planning failed');
}

export async function makeLesson(plan: Plan, index: number, level: Level, sources: Source[], routes = LESSON_ROUTES): Promise<{ lesson: Lesson; meter: Meter; repaired: boolean; errors: string[] }> {
  const m = meter();
  const t0 = Date.now();
  const user = lessonUser(plan, index, level, sources);
  let best: { lesson: Lesson; errors: string[] } | null = null;
  for (const route of routes) {
    const messages: Msg[] = [{ role: 'system', content: LESSON_SYSTEM }, { role: 'user', content: user }];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await chatJson(route, messages, { timeoutMs: 75_000, temperature: 0.4 });
        m.costUsd += r.costUsd;
        const checked = checkLesson(r.data);
        m.calls.push({ model: route.model, ok: checked.errors.length === 0 && !!checked.lesson, costUsd: r.costUsd, ms: r.ms, note: checked.errors.slice(0, 3).join(' | ') || undefined });
        if (checked.lesson && checked.errors.length === 0) {
          m.ms = Date.now() - t0;
          return { lesson: checked.lesson, meter: m, repaired: false, errors: [] };
        }
        if (checked.lesson && (!best || checked.errors.length < best.errors.length)) best = { lesson: checked.lesson, errors: checked.errors };
        // One repair turn with the same model, showing it exactly what to fix.
        messages.push({ role: 'assistant', content: r.text.slice(0, 12000) }, { role: 'user', content: repairUser(checked.errors) });
      } catch (e) {
        m.calls.push({ model: route.model, ok: false, costUsd: 0, ms: 0, note: (e as Error).message.slice(0, 160) });
        break; // a dead or garbled model gets no repair turn; go to the next one
      }
    }
  }
  m.ms = Date.now() - t0;
  if (best) return { lesson: repair(best.lesson), meter: m, repaired: true, errors: best.errors };
  throw new AiError('no model produced a usable lesson');
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
  let lastErr: unknown;
  for (const route of routes) {
    try {
      const r = await chatJson<Answer>(route, [{ role: 'system', content: ASK_SYSTEM }, { role: 'user', content: user }], { timeoutMs: 30_000, temperature: 0.3 });
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
      m.ms = Date.now() - t0;
      return { answer: { answer: a.answer.slice(0, 1200), set, focus }, meter: m };
    } catch (e) {
      lastErr = e;
      m.calls.push({ model: route.model, ok: false, costUsd: 0, ms: 0, note: (e as Error).message.slice(0, 160) });
    }
  }
  throw lastErr instanceof Error ? lastErr : new AiError('could not answer');
}
