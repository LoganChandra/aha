import { makeLesson, usefulSources } from '@/lib/engine';
import { Plan, LEVELS, type Lesson, type Level, type Source } from '@/lib/recipe';
import { findCourse } from '@/lib/library';
import { RESTING, addSpend, cacheGet, cacheSet, json, limited, overBudget, readJson, verifyPlan } from '@/lib/server';

export const maxDuration = 200;

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
  // The lesson's researched sources travel with it, so the learner can check them (panel: Nurul, Aisyah).
  if (hit) return json({ lesson: hit, sources: (await cacheGet<Source[]>(`lsrc:${planId}:${index}`)) ?? [], cached: true });
  // A curated course whose cached lessons were evicted: serve straight from the library file.
  const lib = findCourse(plan.topic, level);
  if (lib && lib.plan.topic === plan.topic && lib.lessons[index]) return json({ lesson: lib.lessons[index], cached: true });

  if (limited(req, 'lesson')) return json({ error: 'Too many lessons in the last hour. Try again a little later.' }, 429);
  if (await overBudget()) return json({ error: RESTING }, 503);
  try {
    const { lesson, meter, repaired, errors, facts } = await makeLesson(plan, index, level, sources, undefined, Date.now() + 170_000);
    const found: Source[] = usefulSources(facts.filter((f) => f.url && /^https?:\/\//.test(f.url)).map((f) => ({ title: f.source || f.url!.replace(/^https?:\/\//, '').split('/')[0], url: f.url! })));
    await cacheSet(key, lesson);
    await cacheSet(`lsrc:${planId}:${index}`, found);
    await addSpend(meter.costUsd);
    console.log(JSON.stringify({ ev: 'lesson', index, scene: lesson.scene.type, repaired, errors: errors.slice(0, 3), cost: meter.costUsd, ms: meter.ms, calls: meter.calls }));
    return json({ lesson, sources: found, cached: false });
  } catch (e) {
    console.error(JSON.stringify({ ev: 'lesson-failed', err: (e as Error).message }));
    return json({ error: 'This lesson did not build. Try again.' }, 502);
  }
}
