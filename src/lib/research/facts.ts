// Research: what is true about a topic. A web-grounded fact sheet per lesson, a filter for junk sources, and the
// gate that checks a lesson really used its facts. Hands off `Fact[]` (and the clean `Source[]`) to the other parts.
import { chatJson, type Route } from '../ai';
import { PRIMARY, type Meter } from '../models';
import type { Lesson, Plan, Level, Source } from '../recipe';
import { RESEARCH_SYSTEM, researchUser } from './prompts';

// Sources a learner can trust for the topic: never prompt-engineering pages, tool directories or code files
// (the panel saw "concept-explainer/SKILL.md" and an MCP hub in German and Russian cited for trigonometry).
const JUNK_SOURCE = /SKILL\.md|\bMCP\b|Model ?Context ?Protocol|Modellkontextprotokoll|Claude Skill|prompt engineering|agent-skills|github\.com|gitlab\.com|nngroup\.com/i;

export function usefulSources(list: Source[]): Source[] {
  const seen = new Set<string>();
  return list.map((s) => ({ ...s, title: s.title.replace(/\s+/g, ' ').trim() })).filter((s) => {
    if (!s.title || JUNK_SOURCE.test(`${s.title} ${s.url}`) || /[\u0400-\u04FF]/.test(s.title)) return false;
    const k = s.url.replace(/[#?].*$/, '').replace(/^https?:\/\/(www\.)?/, '').toLowerCase();
    if (seen.has(k) || seen.has(s.title.toLowerCase())) return false;
    seen.add(k);
    seen.add(s.title.toLowerCase());
    return true;
  });
}

export type Fact = { fact: string; source?: string; url?: string };
/** One web-grounded call per lesson: a fact sheet the writer must build on. Fails open (no facts, no block). */
export async function research(plan: Plan, index: number, level: Level, m: Meter, timeoutMs = 14_000): Promise<Fact[]> {
  if (process.env.LESSON_RESEARCH === 'off') return [];
  const route: Route = { model: PRIMARY, reasoning: { enabled: false }, maxTokens: 1200 };
  try {
    const r = await chatJson<{ facts?: unknown }>(route, [{ role: 'system', content: RESEARCH_SYSTEM }, { role: 'user', content: researchUser(plan, index, level) }], { web: true, timeoutMs, temperature: 0.2 });
    m.costUsd += r.costUsd;
    const facts = (Array.isArray(r.data?.facts) ? r.data.facts : []).filter((f): f is Fact => !!f && typeof (f as Fact).fact === 'string' && (f as Fact).fact.length > 12).slice(0, 7)
      .map((f) => ({ fact: f.fact.slice(0, 240), source: typeof f.source === 'string' ? f.source.slice(0, 60) : undefined, url: typeof f.url === 'string' ? f.url : undefined }));
    m.calls.push({ model: `${route.model} (research)`, ok: true, costUsd: r.costUsd, ms: r.ms, note: `${facts.length} facts` });
    return facts;
  } catch (e) {
    m.calls.push({ model: `${route.model} (research)`, ok: false, costUsd: 0, ms: 0, note: (e as Error).message.slice(0, 160) });
    return [];
  }
}

/** Numbers and capitalised names in the fact sheet that a lesson's words can be checked against. */
export function factAnchors(facts: Fact[]): string[] {
  const out = new Set<string>();
  for (const f of facts) {
    for (const n of f.fact.match(/\d[\d,.]*\d|\d/g) ?? []) if (n.replace(/[,.]/g, '').length >= 2 && !/^(19|20)\d\d$/.test(n)) out.add(n.replace(/,/g, ''));
    for (const w of f.fact.match(/\b[A-Z][a-zA-Z]{2,}(?:\s[A-Z][a-zA-Z]+)*/g) ?? []) if (!/^(The|A|An|In|On|By|At|It|This|That|About|Estimated|According)$/.test(w)) out.add(w);
  }
  return [...out];
}
/** How many fact anchors a lesson actually uses in what the learner reads or sees. */
export function factsUsed(lesson: Lesson, anchors: string[]): number {
  // Only what the learner reads counts: stuffing fact text into a template's labels is not using the facts.
  const text = JSON.stringify([lesson.steps.map((s) => [s.say, s.after, s.task]), lesson.scene.type === 'graph2d' || lesson.scene.type === 'chart' ? lesson.scene : null]).replace(/,(?=\d{3})/g, '');
  return anchors.filter((a) => text.includes(a)).length;
}
