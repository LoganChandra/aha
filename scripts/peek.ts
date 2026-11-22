import { chatJson } from '../src/lib/ai';
import { PLAN_SYSTEM, planBrief, planUser } from '../src/lib/planning/prompts';
import { Plan } from '../src/lib/recipe';
const [model, prompt, level] = process.argv.slice(2);
const r = await chatJson({ model, maxTokens: 3000, reasoning: { enabled: false } }, [{ role: 'system', content: PLAN_SYSTEM }, { role: 'system', content: planBrief(level as never) }, { role: 'user', content: planUser(prompt) }]);
const p = Plan.safeParse(r.data);
console.log(p.success ? 'OK' : JSON.stringify(p.error.issues.slice(0, 6), null, 1));
console.log(r.text.slice(0, 1500));
