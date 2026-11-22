// @ts-nocheck: a Bun-only dev script. Runs the inspector over a curated course and prints its findings.
import { chatJson } from '../src/lib/ai';
import { describeSteps } from '../src/lib/animation/inspect';
import { CHECK_SYSTEM, checkUser } from '../src/lib/animation/prompts';
const file = process.argv[2] ?? 'src/content/library/how-ai-works.json';
const c = JSON.parse(await Bun.file(file).text());
await Promise.all(c.lessons.map(async (l, i) => {
  const r = await chatJson({ model: 'deepseek/deepseek-v4.1-flash', reasoning: { enabled: false }, maxTokens: 1500 }, [{ role: 'system', content: CHECK_SYSTEM }, { role: 'user', content: checkUser(c.plan, i, 'beginner', describeSteps(l)) }], { temperature: 0, timeoutMs: 60000 });
  console.log(`\n== ${i + 1}. ${l.title}\n - ${(r.data.issues ?? []).join('\n - ')}`);
}));
