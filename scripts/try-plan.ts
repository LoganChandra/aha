// @ts-nocheck: a Bun-only dev script. Usage: bun scripts/try-plan.ts "<prompt>" <Level>
import { makePlan } from '../src/lib/engine';
const [prompt, level = 'beginner'] = process.argv.slice(2);
const { plan, sources, meter } = await makePlan(prompt, level);
console.log(JSON.stringify({ status: plan.status, topic: plan.topic, lang: plan.lang, q: plan.question, lessons: plan.lessons?.map((l) => `${l.title} [${l.pattern}]`), sources: sources.map((s) => s.title + ' | ' + s.url) }, null, 1), `$${meter.costUsd.toFixed(4)}`);
