import { answerQuestion, type AskContext } from '@/lib/engine';
import { LEVELS, type Level } from '@/lib/recipe';
import { json, limited, readJson } from '@/lib/server';

export const maxDuration = 45;

const str = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');

export async function POST(req: Request) {
  const body = await readJson(req, 20_000);
  const question = str(body?.question, 500).trim();
  const c = (body?.context ?? {}) as Record<string, unknown>;
  if (!question) return json({ error: 'Ask a question.' }, 400);
  if (limited(req, 'ask')) return json({ error: 'Lots of questions in the last hour. Try again a little later.' }, 429);
  const level = (LEVELS as readonly string[]).includes(c.level as string) ? (c.level as Level) : 'beginner';
  const ctx: AskContext = {
    topic: str(c.topic, 100),
    level,
    lessonTitle: str(c.lessonTitle, 100),
    beatText: str(c.beatText, 500),
    sceneSummary: str(c.sceneSummary, 800),
    sceneIds: (Array.isArray(c.sceneIds) ? c.sceneIds : []).filter((x): x is string => typeof x === 'string').slice(0, 60).map((x) => x.slice(0, 40)),
    params: (Array.isArray(c.params) ? c.params : []).slice(0, 4).flatMap((p) => {
      const q = p as Record<string, unknown>;
      return typeof q.id === 'string' && [q.value, q.min, q.max].every((n) => typeof n === 'number')
        ? [{ id: q.id.slice(0, 24), label: str(q.label, 40), value: q.value as number, min: q.min as number, max: q.max as number }]
        : [];
    }),
  };
  const history = (Array.isArray(body?.history) ? body!.history : []).slice(-3).map((h) => ({ q: str((h as Record<string, unknown>).q, 300), a: str((h as Record<string, unknown>).a, 600) }));
  try {
    const { answer, meter } = await answerQuestion(question, ctx, history);
    console.log(JSON.stringify({ ev: 'ask', cost: meter.costUsd, ms: meter.ms, calls: meter.calls }));
    return json({ answer });
  } catch (e) {
    console.error(JSON.stringify({ ev: 'ask-failed', err: (e as Error).message }));
    return json({ error: 'ProfAI could not answer just now. Try asking again.' }, 502);
  }
}
