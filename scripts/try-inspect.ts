// @ts-nocheck: a Bun-only dev script. Usage: bun scripts/try-inspect.ts <saved try-N.json> <index>
import { chatJson } from '../src/lib/ai';
import { describeSteps } from '../src/lib/inspect';
import { CHECK_SYSTEM, checkUser } from '../src/lib/prompts';
const [file, idx = '0'] = process.argv.slice(2);
const { plan, lesson } = JSON.parse(await Bun.file(file).text());
const user = checkUser(plan, Number(idx), 'expert', describeSteps(lesson));
for (const reasoning of [{ enabled: false }, { effort: 'low' }]) {
  const r = await chatJson({ model: 'deepseek/deepseek-v4.1-flash', reasoning, maxTokens: 4000 }, [{ role: 'system', content: CHECK_SYSTEM }, { role: 'user', content: user }], { temperature: 0, timeoutMs: 60000 });
  console.log(JSON.stringify(reasoning), `${r.ms}ms $${r.costUsd.toFixed(4)}`, '\n -', (r.data.issues ?? []).join('\n - '));
}
