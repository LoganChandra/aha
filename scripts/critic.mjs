// Vision critic: a second model looks at lesson screenshots and reports what a picky designer would.
// node scripts/critic.mjs <png> [<png> ...]   (uses OPENROUTER_API_KEY; model via CRITIC_MODEL)
import { readFileSync } from 'node:fs';
const MODEL = process.env.CRITIC_MODEL ?? 'google/gemini-3.5-flash';
const RUBRIC = `You are the harshest product designer at Apple, reviewing one screen of an interactive learning app (like Brilliant). Judge ONLY what you see.
Score 1-10 and list concrete defects. Check:
1. Overlap: any text on top of other text, lines through labels, labels covering the thing they name, callouts covering the action.
2. Clipping: any text cut off, truncated with "…", or running outside its box or the screen.
3. Legibility: text too small or too faint, poor contrast, dimmed elements that should be readable.
4. Composition: the subject too small or off-centre, big empty areas, cramped areas, unbalanced layout.
5. Teaching: is it obvious what to look at and what to do right now? Does the picture itself show the idea?
6. Polish: anything janky, misaligned, inconsistent, or that looks like a bug.
Return ONLY JSON: {"score": n, "defects": [{"severity": "P0|P1|P2", "what": "...", "where": "..."}], "best": "the one change that would help most"}`;
const files = process.argv.slice(2);
const key = process.env.OPENROUTER_API_KEY;
let total = 0;
for (const f of files) {
  const b64 = readFileSync(f).toString('base64');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, temperature: 0, max_tokens: 6000, reasoning: { effort: 'low' }, usage: { include: true }, messages: [{ role: 'user', content: [{ type: 'text', text: RUBRIC }, { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } }] }] }),
  });
  const j = await res.json();
  const text = j.choices?.[0]?.message?.content ?? JSON.stringify(j).slice(0, 300);
  total += Number(j.usage?.cost ?? 0);
  let out;
  const body = text.replace(/```(json)?/g, '');
  const a = body.indexOf('{'), b = body.lastIndexOf('}');
  try { out = JSON.parse(body.slice(a, b + 1)); } catch { out = { raw: text.slice(0, 400) }; }
  console.log(JSON.stringify({ file: f.split('/').pop(), ...out }));
}
console.error(`cost $${total.toFixed(4)}`);
