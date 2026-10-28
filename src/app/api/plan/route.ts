import { makePlan } from '@/lib/engine';
import { preCheck } from '@/lib/intent';
import { LEVELS, type Level, type Plan, type Source } from '@/lib/recipe';
import { cacheGet, cacheSet, json, limited, normalisePrompt, readJson, signPlan } from '@/lib/server';

export const maxDuration = 60;

type Cached = { plan: Plan; sources: Source[] };

export async function POST(req: Request) {
  const body = await readJson(req, 5000);
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim().slice(0, 600) : '';
  const level = (LEVELS as readonly string[]).includes(body?.level as string) ? (body!.level as Level) : 'beginner';
  if (!prompt) return json({ error: 'Type what you want to understand.' }, 400);

  const early = preCheck(prompt);
  if (early) return json({ plan: early, sources: [], level, planId: '', cached: false });

  const key = `plan:${level}:${normalisePrompt(prompt)}`;
  const hit = await cacheGet<Cached>(key);
  if (hit) return json({ ...hit, level, planId: signPlan({ ...hit, level }), cached: true });

  if (limited(req, 'plan')) return json({ error: 'You have started a lot of courses in the last hour. Try again a little later.' }, 429);
  try {
    const { plan, sources, meter } = await makePlan(prompt, level);
    const out: Cached = { plan, sources };
    // Only finished courses are worth sharing; a clarifying question is cheap to ask again.
    if (plan.status === 'ok') await cacheSet(key, out);
    console.log(JSON.stringify({ ev: 'plan', level, status: plan.status, lessons: plan.lessons.length, cost: meter.costUsd, ms: meter.ms, calls: meter.calls }));
    return json({ ...out, level, planId: signPlan({ ...out, level }), cached: false });
  } catch (e) {
    console.error(JSON.stringify({ ev: 'plan-failed', err: (e as Error).message }));
    return json({ error: 'ProfAI could not plan that just now. Try again in a moment.' }, 502);
  }
}
