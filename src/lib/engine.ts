// The engine: Score (plan the path) and Stage (write each lesson's scene), plus answers to mid-lesson questions.
// Each stage walks a chain of models: the cheap strong one first, a different family as the fallback.
import { AiError, chatJson, type Msg, type Route } from './ai';
import { ASK_SYSTEM, CHECK_SYSTEM, LESSON_SYSTEM, PLAN_SYSTEM, RESEARCH_SYSTEM, checkUser, lessonUser, planBrief, planUser, repairUser, researchUser } from './prompts';
import { describeSteps } from './inspect';
import { detectLanguage } from './intent';
import { PATTERN_IDS, PLAYBOOK } from './playbook';
import { Plan, type Lesson, type Level, type Source } from './recipe';
import { checkLesson, repair } from './validate';

// Chosen by the 2026-10-28 bake-off (scripts/bakeoff.ts, docs/bakeoff.md):
//   plans:   DeepSeek V4.1 Flash 18/18, 6s, $0.0006, best teaching.
//   lessons: DeepSeek V4.1 Flash 20/24 first try, 24/24 after one repair, 3.8s median, $0.0012.
// Backup: GLM 5.3 Flash, Logan's pick (2026-10-28). Bake-off: lessons 18/24 then 23/24, 13.5s median; plans 13/18.
//   It cannot run with thinking off, so it gets the lightest thinking and a bigger token budget.
// Last resort: MiniMax M3.1 Flash (18/18 plans, 17/24 then 20/24 lessons), only when both others fail.
// Each tier is a different company, so one provider's outage never stops a lesson.
// Thinking: Logan, 2026-10-28: "have thinking on when necessary all running on medium". Planner and lesson writer
// think at medium (built once, then cached, so the extra seconds are paid once per topic). The tutor answers live
// mid-lesson, so it stays fast with thinking off. Token budgets include the thinking.
const PRIMARY = 'deepseek/deepseek-v4.1-flash';
const BACKUP = 'z-ai/glm-5.3-flash';
// Logan, 2026-10-28: "only use chinese models, when you can". Last resort is MiniMax M3.1 Flash (bake-off: plans 18/18,
// lessons 17/24 first try, 20/24 after repair). It cannot run with thinking off either.
const LAST = 'minimax/minimax-m3.1-flash';
const MEDIUM = { effort: 'medium' } as const;
const tiers = (maxTokens: number, think: boolean): Route[] => [
  { model: PRIMARY, reasoning: think ? MEDIUM : { enabled: false }, maxTokens },
  { model: BACKUP, reasoning: think ? MEDIUM : { effort: 'low' }, maxTokens: maxTokens + 4000 }, // GLM cannot turn thinking off
  { model: LAST, reasoning: think ? MEDIUM : { effort: 'low' }, maxTokens: maxTokens + 4000 },
];
// Measured 2026-10-28 on prod: planner with thinking took 14-34 s against about 6 s without, and it was already
// 18/18 without; lessons with medium thinking took 21-71 s against 4-8 s, for a small inspector gain (4.12 vs 3.94).
// So: the planner and lesson 1 run without thinking (the first screen must be quick); lessons 2+ think at medium,
// built in the background while the learner works through lesson 1.
export const PLAN_ROUTES: Route[] = tiers(4000, false);
// Re-measured after the visual guide grew the prompt to ~18k tokens: DeepSeek with thinking (low or medium) did
// not finish within 80 s and prod fell through to GLM after 50-90 s. Without thinking it writes a lesson in 8-10 s.
// The A/B gain from thinking was small (4.12 vs 3.94); the quality now comes from the guide and the playbook.
export const LESSON_ROUTES: Route[] = tiers(12_000, process.env.LESSON_THINK === 'on');
export const FIRST_LESSON_ROUTES: Route[] = tiers(8000, false);
export const ASK_ROUTES: Route[] = tiers(800, false);

export type Meter = { costUsd: number; ms: number; calls: { model: string; ok: boolean; costUsd: number; ms: number; note?: string }[] };
const meter = (): Meter => ({ costUsd: 0, ms: 0, calls: [] });

/**
 * Hedged call: start the first route; if it has not succeeded within `delayMs`, start the next as well. The first
 * accepted result wins. A slow provider then costs the learner a few seconds, not a minute.
 */
async function hedge<T>(routes: Route[], delayMs: number, run: (route: Route) => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let done = false;
    let failed = 0;
    let started = 0;
    let lastErr: unknown;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const launch = (i: number) => {
      if (done || i >= routes.length || i < started) return;
      started = i + 1;
      run(routes[i]).then(
        (v) => { if (!done) { done = true; timers.forEach(clearTimeout); resolve(v); } },
        (e) => {
          lastErr = e;
          failed++;
          if (done) return;
          if (failed >= routes.length) { done = true; reject(lastErr); return; }
          launch(started); // a failure starts the next route at once instead of waiting for the timer
        },
      );
      if (i + 1 < routes.length) timers.push(setTimeout(() => launch(i + 1), delayMs));
    };
    launch(0);
  });
}

// Sources a learner can trust for the topic: never prompt-engineering pages, tool directories or code files
// (the panel saw "concept-explainer/SKILL.md" and an MCP hub in German and Russian cited for trigonometry).
const JUNK_SOURCE = /SKILL\.md|\bMCP\b|Model ?Context ?Protocol|Modellkontextprotokoll|Claude Skill|prompt engineering|agent-skills|github\.com|gitlab\.com|nngroup\.com/i;
// Designed templates beat free drawing, and the cheap planner rarely picks them on its own. When a lesson is plainly
// about one of these, its pattern is switched in code (blind panel 2026-10-29: hand-drawn rainbows ran backwards,
// hand-drawn attention matrices never summed to 100%).
const TEMPLATE_ROUTES: [RegExp, string][] = [
  [/\b(self-?attention|attention|attends?|query|queries|keys? and values?|causal mask)\b|\bperhatian\b/i, 'who-looks-at-whom'],
  [/\b(neuron|perceptron|neural net|weights? and bias|activation|hidden layer)\b|\bneuron\b/i, 'weigh-the-inputs'],
  [/\b(reinforcement|rewards?|RLHF|human feedback|explor(e|ation) (vs|versus|and) exploit|exploit|thumbs[- ]up)\b/i, 'learn-from-reward'],
  [/\b(sunsets?|sunrise|horizon|haze|dusk|dawn)\b|\b(matahari terbenam|senja)\b/i, 'watch-the-sky'],
  [/\b(trigonometr\w*|trigonometri|sines?|cosines?|tangents?|hypotenuse|hipotenus|SOH.?CAH.?TOA|sin, cos|sin cos|right[- ]angled? triangles?|segi tiga tegak)\b/i, 'name-the-sides'],
  [/\b(convolution\w*|CNNs?|filters? (slide|over)|edge detection|feature maps?|how (an? )?AI sees|computer vision|image recognition|pixels?|recognis\w* images|recogniz\w* images)\b/i, 'slide-the-filter'],
  [/\b(diffusion|denois\w*|image generat\w*|stable diffusion|midjourney|dall-?e)\b/i, 'out-of-the-noise'],
  [/\b(training loop|one (word|token) at a time|loop|epochs?|iterat\w+)\b/i, 'go-round-the-loop'],
  [/\b(next[- ]word|temperature|sampling|softmax|predicts? the next)\b/i, 'odds-and-temperature'],
  [/\b(embeddings?|word vectors?|vector space|semantic search|similar meanings?|meaning)\b/i, 'map-of-meaning'],
  [/\b(tokens?|tokeni[sz](er|ation)|subwords?)\b/i, 'chop-into-tokens'],
  [/\b(gradient descent|learning rate|loss (curve|function)|minimi[sz]e the (error|loss)|overshoot)\b/i, 'find-the-minimum'],
  [/\b(wavelengths?|spectrum|rainbow|colou?rs? of light|visible light|(short|long)(er)? waves?|pH scale|acidity|panjang gelombang|pelangi)\b/i, 'slide-the-scale'],
];
const FREE_PATTERNS = new Set(['shape-stays-true', 'drag-to-discover', 'act-it-out', 'tipping-point', 'predict-reveal', 'map-of-meaning', 'add-the-pieces', 'find-the-minimum', 'trace-the-path']);
export function templateFor(text: string, pattern: string, title = ''): string {
  // The title is the strongest signal ("Tokens become meaning (embeddings)" is about embeddings); then everything.
  for (const t of [title, text]) {
    if (!t) continue;
    for (const [re, id] of TEMPLATE_ROUTES) if (re.test(t) && PATTERN_IDS.includes(id)) return FREE_PATTERNS.has(pattern) || TEMPLATE_IDS.has(pattern) ? id : pattern;
  }
  return pattern;
}
const TEMPLATE_IDS = new Set(TEMPLATE_ROUTES.map(([, id]) => id));

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

export async function makePlan(prompt: string, level: Level, routes = PLAN_ROUTES, web = true, langPref?: string): Promise<{ plan: Plan; sources: Source[]; meter: Meter }> {
  const m = meter();
  const t0 = Date.now();
  // What they typed in wins; English typing with Bahasa Melayu (or another language) picked in the app follows the pick.
  const typed = detectLanguage(prompt);
  const lang = typed === 'English' && langPref ? langPref : typed;
  const res = await hedge(routes, 12_000, async (route) => {
    try {
      const r = await chatJson(route, [{ role: 'system', content: PLAN_SYSTEM }, { role: 'system', content: planBrief(level, lang) }, { role: 'user', content: planUser(prompt) }], { web, timeoutMs: 30_000, temperature: 0.3 });
      m.costUsd += r.costUsd;
      const parsed = Plan.safeParse(r.data);
      if (!parsed.success) throw new AiError(`plan shape: ${parsed.error.issues[0]?.message}`);
      const plan = { ...parsed.data, lang };
      if (plan.status === 'ok' && plan.lessons.length < 2) throw new AiError('plan has fewer than 2 lessons');
      if (plan.status === 'clarify' && !plan.question) plan.question = 'What would you like to understand?';
      // Decided in code, not left to the prompt: the first lesson is never a boxes-and-arrows diagram (it is the
      // learner's first impression), at most one per course, and unknown patterns fall back to a drawn scene.
      let flows = 0;
      // A template is routed at most twice per course: every lesson looking the same was Logan's 2/10 complaint.
      const used: Record<string, number> = {};
      plan.lessons = plan.lessons.map((l, i) => {
        let pattern = PATTERN_IDS.includes(l.pattern) ? l.pattern : 'act-it-out';
        if (pattern === 'follow-the-flow' && (i === 0 || flows++ > 0)) pattern = 'act-it-out';
        // In an attention course, softmax, scaling and masking lessons belong on the attention grid, not next-word odds.
        const attentionCourse = /\b(attention|transformers?|queries|keys? and values?)\b/i.test(plan.topic);
        const trigCourse = /\b(trigonometr\w*|trigonometri|sin|cos|kos|tan|SOH)\b/i.test(plan.topic);
        const routed = trigCourse && !/\b(circle|bulatan|graph|graf|wave|gelombang)\b/i.test(l.title) && /\b(sides?|angles?|ratios?|sisi|sudut|nisbah|sin|cos|kos|tan|missing|hilang|hypotenuse|hipotenus)\b/i.test(`${l.title} ${l.goal}`) ? 'name-the-sides'
          : attentionCourse && /\b(softmax|scal\w*|d_k|√d|temperature|mask\w*|heads?)\b/i.test(`${l.title} ${l.goal}`) ? 'who-looks-at-whom' : templateFor(`${l.title} ${l.goal} ${l.aha}`, pattern, l.title);
        if (routed !== pattern && (used[routed] ?? 0) < 2) pattern = routed;
        if ((used[pattern] ?? 0) >= 2) pattern = 'act-it-out';
        used[pattern] = (used[pattern] ?? 0) + 1;
        return { ...l, pattern };
      });
      m.calls.push({ model: route.model, ok: true, costUsd: r.costUsd, ms: r.ms });
      return { plan, sources: usefulSources(r.sources).slice(0, 6) };
    } catch (e) {
      m.calls.push({ model: route.model, ok: false, costUsd: 0, ms: 0, note: (e as Error).message.slice(0, 160) });
      throw e;
    }
  });
  m.ms = Date.now() - t0;
  return { ...res, meter: m };
}

type Written = { lesson: Lesson; errors: string[] };

/**
 * The inspector: replay the lesson as the learner meets it and let a cheap model list contradictions between the
 * words and the picture, and wrong or overclaimed facts (blind panel 2026-10-29). Fails open: a slow or broken
 * inspector never blocks a lesson.
 */
async function inspect(lesson: Lesson, ctx: { plan: Plan; index: number; level: Level }, m: Meter, timeoutMs: number): Promise<string[]> {
  if (process.env.LESSON_INSPECT === 'off' || timeoutMs < 6000) return [];
  const route: Route = { model: PRIMARY, reasoning: { enabled: false }, maxTokens: 1500 };
  try {
    const r = await chatJson<{ issues?: unknown }>(route, [{ role: 'system', content: CHECK_SYSTEM }, { role: 'user', content: checkUser(ctx.plan, ctx.index, ctx.level, describeSteps(lesson)) }], { timeoutMs, temperature: 0 });
    m.costUsd += r.costUsd;
    // Cheap models sometimes list a check that passed ("...is consistent. No issue."); those never reach the writer.
    const issues = Array.isArray(r.data?.issues) ? (r.data.issues as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 8 && !/\bno issue\b|\bis consistent\b|\bthis is fine\b|\bacceptable\b/i.test(x)).slice(0, 6) : [];
    m.calls.push({ model: `${route.model} (inspect)`, ok: true, costUsd: r.costUsd, ms: r.ms, note: issues.slice(0, 3).join(' | ') || undefined });
    return issues;
  } catch (e) {
    m.calls.push({ model: `${route.model} (inspect)`, ok: false, costUsd: 0, ms: 0, note: (e as Error).message.slice(0, 160) });
    return [];
  }
}

/** One model writes the lesson; the checker and then the inspector each get one repair turn. */
async function writeWith(route: Route, user: string, m: Meter, deadline: number, ctx: { plan: Plan; index: number; level: Level; anchors?: string[] }): Promise<Written> {
  const messages: Msg[] = [{ role: 'system', content: LESSON_SYSTEM }, { role: 'user', content: user }];
  let best: Written | null = null;
  let inspected = false;
  // Lesson 1 is what the learner waits for: the inspector runs only if the draft came quickly (measured 2026-10-29:
  // a slow draft plus inspection plus repair took 55 s). Later lessons build in the background and always get it.
  const started = Date.now(), inspectWithin = ctx.index === 0 ? 14_000 : 50_000;
  for (let attempt = 0; attempt < 3; attempt++) {
    // Every call fits inside the function's time limit, so a slow first try cannot starve the others.
    const left = deadline - Date.now() - 2000;
    if (left < 8000) break;
    let r;
    try {
      r = await chatJson(route, messages, { timeoutMs: Math.min(80_000, left), temperature: 0.4 });
    } catch (e) {
      m.calls.push({ model: route.model, ok: false, costUsd: 0, ms: 0, note: (e as Error).message.slice(0, 160) });
      break; // a dead or garbled model gets no repair turn
    }
    m.costUsd += r.costUsd;
    const checked = checkLesson(r.data);
    m.calls.push({ model: route.model, ok: checked.errors.length === 0 && !!checked.lesson, costUsd: r.costUsd, ms: r.ms, note: checked.errors.slice(0, 3).join(' | ') || undefined });
    if (checked.lesson && checked.errors.length === 0) {
      // Clean by the rules: once per lesson, check the words against the picture before accepting it.
      if (inspected || attempt === 2 || Date.now() - started > inspectWithin) return { lesson: checked.lesson, errors: [] };
      inspected = true;
      // A copy of a playbook example is not a lesson about this topic (walk: "Unbelievable cats love boxes" again).
      const copied = PLAYBOOK.some((p) => p.example.steps.filter((es) => checked.lesson!.steps.some((st) => st.say.trim() === es.say.trim())).length >= 2 || JSON.stringify(p.example.scene) === JSON.stringify(checked.lesson!.scene) || sameWords(p.example.scene, checked.lesson!.scene) || (p.example.scene.type === 'nextWord' && checked.lesson!.scene.type === 'nextWord' && p.example.scene.context === checked.lesson!.scene.context) || (p.example.scene.type === 'tokens' && checked.lesson!.scene.type === 'tokens' && JSON.stringify(p.example.scene.pieces.map((x) => x.text)) === JSON.stringify(checked.lesson!.scene.pieces.slice(0, p.example.scene.pieces.length).map((x) => x.text))))
        ? ['The scene copies the playbook example. Write your own content from this lesson\'s topic and fact sheet.'] : [];
      // A lesson that ignores its fact sheet is generic; the inspector's repair turn also asks for the facts.
      const anchors = ctx.anchors ?? [];
      // Health topics never promise certainty (panel, Nurul: "pertahanan: 100%", "Anda tidak sakit").
      const health = /\b(vaccin\w*|vaksin|medicin\w*|ubat|disease|penyakit|immun\w*|imun\w*|virus|infection|jangkitan|cancer|kanser|diabetes|drug|dose|dos)\b/i.test(`${ctx.plan.topic} ${ctx.plan.lessons[ctx.index]?.title ?? ''}`);
      const absolute = health ? [...new Set(JSON.stringify([checked.lesson.steps, checked.lesson.scene]).match(/\b(100 ?%|always|never get sick|completely safe|totally safe|guaranteed|cannot get sick|won'?t get sick|tidak akan sakit|tidak sakit|pasti selamat|sentiasa|selamat sepenuhnya)\b/gi) ?? [])] : [];
      const healthGap = absolute.length ? [`Health claims must be honest and hedged: replace ${absolute.slice(0, 3).map((x) => `"${x}"`).join(', ')} with "usually", "much less likely", "milder", or a real figure from the FACT SHEET.`] : [];
      // Money and big-number claims must come from the fact sheet or the knobs, never from thin air (C04).
      const sheet = (ctx.anchors ?? []).join(' ');
      const unsourced = anchors.length >= 3 ? [...new Set(checked.lesson.steps.flatMap((st) => `${st.say} ${st.after ?? ''}`.replace(/\{[^}]*\}/g, '').match(/\$?\d[\d,.]*\s?(?:bn|billion|trillion|tn|million|m\b)/gi) ?? []))]
        .filter((x) => { const n = x.replace(/[^\d.]/g, ''); return n && !sheet.includes(n) && !JSON.stringify(checked.lesson!.scene).includes(n); }) : [];
      const factGap = [...(unsourced.length ? [`These figures are not in the FACT SHEET: ${unsourced.slice(0, 4).join(', ')}. Use the sheet's numbers or remove them.`] : []), ...(anchors.length >= 3 && factsUsed(checked.lesson, anchors) < 2 ? ['The lesson uses none of the FACT SHEET: rebuild it around at least 2 of those facts (their numbers, names or dates) and show them in the picture.'] : [])];
      const issues = [...copied, ...healthGap, ...factGap, ...(await inspect(checked.lesson, ctx, m, Math.min(ctx.index === 0 ? 10_000 : 25_000, deadline - Date.now() - 20_000)))];
      if (!issues.length) return { lesson: checked.lesson, errors: [] };
      best = { lesson: checked.lesson, errors: [] }; // already usable; the repair can only improve it
      messages.push({ role: 'assistant', content: r.text.slice(0, 12000) }, { role: 'user', content: repairUser(issues.map((x) => `Inspector: ${x}`)) });
      continue;
    }
    if (checked.lesson && (!best || (best.errors.length > 0 && checked.errors.length < best.errors.length))) best = { lesson: checked.lesson, errors: checked.errors };
    messages.push({ role: 'assistant', content: r.text.slice(0, 12000) }, { role: 'user', content: repairUser(checked.errors) });
  }
  if (best && best.errors.length === 0) return best;
  if (best) throw Object.assign(new AiError('lesson still had problems after a repair'), { best });
  throw new AiError(`${route.model} produced no lesson`);
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

/** True when a scene reuses most of a playbook example's words (labels and texts), i.e. it was copied, not written. */
function sameWords(a: unknown, b: unknown): boolean {
  const words = (v: unknown): string[] => (typeof v === 'string' ? [] : Array.isArray(v) ? v.flatMap(words) : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => (['label', 'text', 'context', 'caption'].includes(k) && typeof x === 'string' ? [x.toLowerCase().trim()] : k === 'image' && Array.isArray(x) ? x.map((r, i) => `${i}:${r}`) : words(x))) : []);
  const wa = new Set(words(a)), wb = words(b);
  if (wa.size < 3 || !wb.length) return false;
  return wb.filter((w) => wa.has(w)).length / Math.min(wa.size, wb.length) >= 0.6;
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
  const text = JSON.stringify([lesson.steps.map((s) => [s.say, s.after, s.task]), lesson.scene]).replace(/,(?=\d{3})/g, '');
  return anchors.filter((a) => text.includes(a)).length;
}

export async function makeLesson(plan: Plan, index: number, level: Level, sources: Source[], routes = index === 0 ? FIRST_LESSON_ROUTES : LESSON_ROUTES, deadline = Date.now() + 170_000): Promise<{ lesson: Lesson; meter: Meter; repaired: boolean; errors: string[]; facts: Fact[] }> {
  const m = meter();
  const t0 = Date.now();
  // Lesson 1 is waited for: when the planner already researched it (2+ concrete facts from its web search), use those
  // and save about 6 s. Later lessons build in the background and always get their own research call.
  const planned = (plan.lessons[index]?.facts ?? []).filter((f) => /\d/.test(f) || /\b[A-Z][a-z]{2,}/.test(f));
  const facts = index === 0 && planned.length >= 2 ? planned.map((fact) => ({ fact })) : await research(plan, index, level, m, index === 0 ? 10_000 : 16_000);
  const user = lessonUser(plan, index, level, sources, facts);
  // Imperfect drafts from every route are kept; if no route writes a clean lesson, the least broken one is repaired.
  const drafts: Written[] = [];
  try {
    const { lesson } = await hedge(routes, 30_000, (route) => writeWith(route, user, m, deadline, { plan, index, level, anchors: factAnchors(facts) }).catch((e) => {
      if ((e as { best?: Written }).best) drafts.push((e as { best: Written }).best);
      throw e;
    }));
    m.ms = Date.now() - t0;
    return { lesson, meter: m, repaired: false, errors: [], facts };
  } catch (e) {
    m.ms = Date.now() - t0;
    const best = drafts.sort((a, b) => a.errors.length - b.errors.length)[0];
    if (best) return { lesson: repair(best.lesson), meter: m, repaired: true, errors: best.errors, facts };
    throw e instanceof Error ? e : new AiError('no model produced a usable lesson');
  }
}

export type AskContext = {
  topic: string;
  level: Level;
  lessonTitle: string;
  beatText: string;
  params: { id: string; label: string; value: number; min: number; max: number }[];
  sceneIds: string[];
  sceneSummary: string;
};

export type Answer = { answer: string; set?: Record<string, number>; focus?: string[] };

export async function answerQuestion(question: string, ctx: AskContext, history: { q: string; a: string }[] = [], routes = ASK_ROUTES): Promise<{ answer: Answer; meter: Meter }> {
  const m = meter();
  const t0 = Date.now();
  const user = `Course: ${ctx.topic}
Learner level: ${ctx.level}
Lesson: ${ctx.lessonTitle}
They were reading: "${ctx.beatText}"
Scene: ${ctx.sceneSummary}
Knobs (param ids): ${ctx.params.map((p) => `${p.id} "${p.label}" = ${p.value} (range ${p.min} to ${p.max})`).join('; ') || 'none'}
Scene ids you may focus: ${ctx.sceneIds.slice(0, 40).join(', ') || 'none'}
${history.length ? `Earlier in this lesson:\n${history.slice(-3).map((h) => `Q: ${h.q}\nA: ${h.a}`).join('\n')}\n` : ''}
Their question: """${question.slice(0, 500)}"""`;
  const answer = await hedge(routes, 6000, async (route) => {
    try {
      const r = await chatJson<Answer>(route, [{ role: 'system', content: ASK_SYSTEM }, { role: 'user', content: user }], { timeoutMs: 20_000, temperature: 0.3 });
      m.costUsd += r.costUsd;
      m.calls.push({ model: route.model, ok: true, costUsd: r.costUsd, ms: r.ms });
      const a = r.data;
      if (typeof a?.answer !== 'string' || !a.answer.trim()) throw new AiError('empty answer');
      const ids = new Set(ctx.params.map((p) => p.id));
      const set = a.set && typeof a.set === 'object'
        ? Object.fromEntries(Object.entries(a.set).filter(([k, v]) => ids.has(k) && typeof v === 'number' && Number.isFinite(v)).map(([k, v]) => {
            const p = ctx.params.find((q) => q.id === k)!;
            return [k, Math.min(p.max, Math.max(p.min, v))];
          }))
        : undefined;
      const scene = new Set(ctx.sceneIds);
      const focus = Array.isArray(a.focus) ? a.focus.filter((f) => typeof f === 'string' && scene.has(f)) : undefined;
      return { answer: a.answer.slice(0, 1200), set, focus };
    } catch (e) {
      m.calls.push({ model: route.model, ok: false, costUsd: 0, ms: 0, note: (e as Error).message.slice(0, 160) });
      throw e;
    }
  });
  m.ms = Date.now() - t0;
  return { answer, meter: m };
}
