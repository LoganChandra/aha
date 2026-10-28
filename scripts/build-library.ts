// Build curated courses with a chosen model. Drafts land in scripts/library-drafts/<model>/ for inspection;
// approved ones are copied into src/content/library/.
// MODEL=z-ai/glm-5.3-prime EFFORT=high bun scripts/build-library.ts "trigonometry|beginner|trig,trigonometry basics" ...
import { mkdirSync, writeFileSync } from 'node:fs';
import type { Route } from '../src/lib/ai';
import { makeLesson, makePlan } from '../src/lib/engine';
import type { Level } from '../src/lib/recipe';

const model = process.env.MODEL ?? 'deepseek/deepseek-v4.1-flash';
const effort = process.env.EFFORT as 'low' | 'medium' | 'high' | undefined;
const route: Route = { model, maxTokens: 40_000, reasoning: effort ? { effort } : { enabled: false } };
const dir = `scripts/library-drafts/${model.replace(/\W/g, '_')}`;
mkdirSync(dir, { recursive: true });
let total = 0;
await Promise.all(process.argv.slice(2).map(async (arg) => {
  const [prompt, level = 'beginner', aliases = ''] = arg.split('|');
  const plan = await makePlan(prompt, level as Level, [{ ...route, maxTokens: 12_000 }]);
  total += plan.meter.costUsd;
  const lessons = [];
  for (let i = 0; i < plan.plan.lessons.length; i++) {
    try {
      const l = await makeLesson(plan.plan, i, level as Level, plan.sources, [route], Date.now() + 600_000);
      total += l.meter.costUsd;
      lessons.push(l.lesson);
    } catch (e) { console.log(prompt, i, 'failed', (e as Error).message); }
  }
  const slug = `${level}-${prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  writeFileSync(`${dir}/${slug}.json`, JSON.stringify({ slug, level, aliases: aliases.split(',').filter(Boolean), plan: plan.plan, sources: plan.sources, lessons }, null, 1));
  console.log(`${slug}: ${lessons.length}/${plan.plan.lessons.length} lessons`);
}));
console.log(`model ${model} total $${total.toFixed(3)}`);
