import { makePlan } from '@/lib/engine';
import { preCheck } from '@/lib/intent';
import { findCourse } from '@/lib/library';
import { LEVELS, type Level, type Plan, type Source } from '@/lib/recipe';
import { RESTING, addSpend, askToken, cacheGet, cacheSet, json, limited, normalisePrompt, overBudget, readJson, signPlan } from '@/lib/server';

export const maxDuration = 120;

type Cached = { plan: Plan; sources: Source[] };

export async function POST(req: Request) {
  const body = await readJson(req, 5000);
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim().slice(0, 600) : '';
  const level = (LEVELS as readonly string[]).includes(body?.level as string) ? (body!.level as Level) : 'beginner';
  if (!prompt) return json({ error: 'Type what you want to understand.' }, 400);

  const early = preCheck(prompt);
  if (early) return json({ plan: early, sources: [], level, planId: '', cached: false });

  // Curated courses first: built with the best models, inspected, free to serve.
  const lib = findCourse(prompt, level);
  if (lib) {
    const out = { plan: lib.plan, sources: lib.sources };
    const planId = signPlan({ ...out, level });
    await Promise.all(lib.lessons.map((l, i) => cacheSet(`lesson:${planId}:${i}`, l)));
    return json({ ...out, level, planId, askToken: askToken(planId), cached: true, curated: true });
  }

  const key = `plan:${level}:${normalisePrompt(prompt)}`;
  const hit = await cacheGet<Cached>(key);
  if (hit) { const planId = signPlan({ ...hit, level }); return json({ ...hit, level, planId, askToken: askToken(planId), cached: true }); }

  if (limited(req, 'plan')) return json({ error: 'You have started a lot of courses in the last hour. Try again a little later.' }, 429);
  if (await overBudget()) return json({ error: RESTING }, 503);
  try {
    const { plan, sources, meter } = await makePlan(prompt, level);
    const out: Cached = { plan, sources };
    // Only finished courses are worth sharing; a clarifying question is cheap to ask again.
    if (plan.status === 'ok') await cacheSet(key, out);
    await addSpend(meter.costUsd);
    console.log(JSON.stringify({ ev: 'plan', level, status: plan.status, lessons: plan.lessons.length, cost: meter.costUsd, ms: meter.ms, calls: meter.calls }));
    const planId = signPlan({ ...out, level });
    return json({ ...out, level, planId, askToken: askToken(planId), cached: false });
  } catch (e) {
    console.error(JSON.stringify({ ev: 'plan-failed', err: (e as Error).message }));
    return json({ error: 'ProfAI could not plan that just now. Try again in a moment.' }, 502);
  }
}
