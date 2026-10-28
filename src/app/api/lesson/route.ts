import { makeLesson } from '@/lib/engine';
import { Plan, LEVELS, type Lesson, type Level, type Source } from '@/lib/recipe';
import { cacheGet, cacheSet, json, limited, readJson, verifyPlan } from '@/lib/server';

export const maxDuration = 120;

export async function POST(req: Request) {
  const body = await readJson(req);
  const level = body?.level as Level;
  const index = Number(body?.index);
  const planId = String(body?.planId ?? '');
  const parsed = Plan.safeParse(body?.plan);
  const sources = (Array.isArray(body?.sources) ? body!.sources : []) as Source[];
  if (!parsed.success || !(LEVELS as readonly string[]).includes(level) || !Number.isInteger(index)) return json({ error: 'Bad request' }, 400);
  // Parsing re-trims text, so verify against what the client actually holds (as it came from /api/plan).
  if (!verifyPlan({ plan: body!.plan as Plan, sources, level }, planId)) return json({ error: 'This course has expired. Start it again.' }, 403);
  const plan = parsed.data;
  if (index < 0 || index >= plan.lessons.length) return json({ error: 'No such lesson' }, 400);

  const key = `lesson:${planId}:${index}`;
  const hit = await cacheGet<Lesson>(key);
  if (hit) return json({ lesson: hit, cached: true });

  if (limited(req, 'lesson')) return json({ error: 'Too many lessons in the last hour. Try again a little later.' }, 429);
  try {
    const { lesson, meter, repaired, errors } = await makeLesson(plan, index, level, sources);
    await cacheSet(key, lesson);
    console.log(JSON.stringify({ ev: 'lesson', index, scene: lesson.scene.type, repaired, errors: errors.slice(0, 3), cost: meter.costUsd, ms: meter.ms, calls: meter.calls }));
    return json({ lesson, cached: false });
  } catch (e) {
    console.error(JSON.stringify({ ev: 'lesson-failed', err: (e as Error).message }));
    return json({ error: 'This lesson did not build. Try again.' }, 502);
  }
}
