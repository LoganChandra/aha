// Force one tier through the real engine: bun scripts/route-test.ts <tierIndex>
import { LESSON_ROUTES, PLAN_ROUTES, makeLesson, makePlan } from '../src/lib/engine';
const i = Number(process.argv[2] ?? 1);
const p = await makePlan('how does a bicycle stay upright', 'beginner', [PLAN_ROUTES[i]]);
console.log('plan', p.plan.status, p.plan.lessons.length, p.meter.ms, 'ms', p.meter.costUsd.toFixed(5));
const l = await makeLesson(p.plan, 0, 'beginner', p.sources, [LESSON_ROUTES[i]]);
console.log('lesson', l.lesson.scene.type, 'repaired', l.repaired, l.meter.ms, 'ms', l.meter.costUsd.toFixed(5), JSON.stringify(l.meter.calls.map((c) => [c.ok, c.ms])));
