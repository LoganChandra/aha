// Quality sweep: plan + first two lessons for each prompt via the real API, saved as gallery fixtures.
// node scripts/sweep.mjs <base> "<prompt>|<level>" ...
import { writeFileSync } from 'node:fs';
const [base, ...items] = process.argv.slice(2);
const post = async (p, b) => { const r = await fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); return r.json(); };
await Promise.all(items.map(async (it, n) => {
  const [prompt, level] = it.split('|');
  const t0 = Date.now();
  const p = await post('/api/plan', { prompt, level });
  if (p.plan?.status !== 'ok') return console.log(prompt, p.plan?.status ?? p.error);
  const tPlan = Date.now() - t0;
  for (const i of [0, 1]) {
    const t1 = Date.now();
    const l = await post('/api/lesson', { plan: p.plan, sources: p.sources, level, planId: p.planId, index: i });
    if (!l.lesson) { console.log(prompt, i, l.error); continue; }
    writeFileSync(`scripts/out/lesson-sw-${String(n).padStart(2, '0')}-${i}.json`, JSON.stringify(l.lesson));
    console.log(`${prompt} [${level}] L${i + 1}: ${l.lesson.scene.type} "${l.lesson.title}" plan ${tPlan}ms lesson ${Date.now() - t1}ms`);
  }
}));
