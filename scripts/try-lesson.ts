// @ts-nocheck: a Bun-only dev script
// Build one plan and one lesson locally and print every model call, including the inspector's findings.
// Usage: bun scripts/try-lesson.ts "<prompt>" <Level> <lessonIndex>
import { makeLesson, makePlan } from '../src/lib/engine';
import type { Level } from '../src/lib/recipe';
const [prompt, level = 'Beginner', idx = '0'] = process.argv.slice(2);
const { plan, sources, meter } = await makePlan(prompt, level as Level);
console.log('PLAN', plan.topic, plan.lang, plan.lessons.map((l) => l.title).join(' | '), `$${meter.costUsd.toFixed(4)}`);
const i = Number(idx);
const r = await makeLesson(plan, i, level as Level, sources);
for (const c of r.meter.calls) console.log(c.ok ? 'ok ' : 'BAD', c.model, `${c.ms}ms`, `$${c.costUsd.toFixed(4)}`, c.note ?? '');
console.log('lesson', i + 1, r.lesson.title, `${r.meter.ms}ms`, `$${r.meter.costUsd.toFixed(4)}`, r.repaired ? 'REPAIRED' : '');
await Bun.write(`scripts/shots/try-${i}.json`, JSON.stringify({ plan, lesson: r.lesson }, null, 1));
