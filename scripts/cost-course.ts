// @ts-nocheck: a Bun-only dev script. Builds a whole course exactly as the server does and sums the real model cost.
import { makeLesson, makePlan } from '../src/lib/engine';
const [prompt, level = 'beginner'] = process.argv.slice(2);
const { plan, sources, meter } = await makePlan(prompt, level);
let total = meter.costUsd;
const per = [];
for (let i = 0; i < plan.lessons.length; i++) { const r = await makeLesson(plan, i, level, sources); total += r.meter.costUsd; per.push(r.meter.costUsd); }
console.log(JSON.stringify({ prompt, level, lessons: plan.lessons.length, plan: +meter.costUsd.toFixed(4), perLesson: per.map((x) => +x.toFixed(4)), total: +total.toFixed(4) }));
