// The tutor: answers a question asked mid-lesson, using what is on screen.
import { AiError, chatJson } from '../ai';
import { hedge, meter, type Meter } from '../models';
import type { Level } from '../recipe';
import { ASK_SYSTEM } from './prompts';
import { ASK_ROUTES } from './routes';

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
      let r = await chatJson<Answer>(route, [{ role: 'system', content: ASK_SYSTEM }, { role: 'user', content: user }], { timeoutMs: 20_000, temperature: 0.3 });
      m.costUsd += r.costUsd;
      m.calls.push({ model: route.model, ok: true, costUsd: r.costUsd, ms: r.ms });
      // Health answers never promise certainty (panel, Nurul: "Vaksin selamat" said flatly): one honest rewrite.
      const health = /\b(vaccin\w*|vaksin|medicin\w*|ubat|disease|penyakit|imun\w*|immun\w*|virus|demam|fever|dose|dos)\b/i.test(`${ctx.topic} ${question}`);
      const flat = typeof r.data?.answer === 'string' ? r.data.answer.match(/\b(100 ?%|completely safe|totally safe|always safe|guaranteed|no side effects|vaksin (adalah )?selamat\b(?! (diuji|dipantau))|tiada kesan sampingan|pasti selamat)/i) : null;
      if (health && flat) {
        const again = await chatJson<Answer>(route, [{ role: 'system', content: ASK_SYSTEM }, { role: 'user', content: user }, { role: 'assistant', content: r.text.slice(0, 2000) }, { role: 'user', content: `Rewrite: "${flat[0]}" is a certainty no health professional would promise. Say it honestly (tested and monitored, usually, rarely) and say when to see a nurse or doctor. Same JSON.` }], { timeoutMs: 15_000, temperature: 0.3 }).catch(() => null);
        if (again && typeof again.data?.answer === 'string') { r = again; m.costUsd += again.costUsd; m.calls.push({ model: `${route.model} (honest rewrite)`, ok: true, costUsd: again.costUsd, ms: again.ms }); }
      }
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
