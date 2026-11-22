// Lesson planning (Score): turns what the learner typed into a short path of lessons, each with a goal, an aha and a
// teaching pattern. Hands off a `Plan` (and its `Source[]`) to the animation part.
import { AiError, chatJson, type Route } from '../ai';
import { detectLanguage } from './intent';
import { PATTERN_IDS } from '../animation/playbook';
import { Plan, type Level, type Source } from '../recipe';
import { hedge, meter, tiers, type Meter } from '../models';
import { usefulSources } from '../research';
import { PLAN_SYSTEM, planBrief, planUser } from './prompts';

// Measured 2026-10-28 on prod: planner with thinking took 14-34 s against about 6 s without, and it was already
// 18/18 without; lessons with medium thinking took 21-71 s against 4-8 s, for a small inspector gain (4.12 vs 3.94).
// So: the planner and lesson 1 run without thinking (the first screen must be quick); lessons 2+ think at medium,
// built in the background while the learner works through lesson 1.
export const PLAN_ROUTES: Route[] = tiers(4000, false);

// Designed templates beat free drawing, and the cheap planner rarely picks them on its own. When a lesson is plainly
// about one of these, its pattern is switched in code (blind panel 2026-10-29: hand-drawn rainbows ran backwards,
// hand-drawn attention matrices never summed to 100%).
const TEMPLATE_ROUTES: [RegExp, string][] = [
  [/\b(self-?attention|attention|attends?|query|queries|keys? and values?|causal mask)\b|\bperhatian\b/i, 'who-looks-at-whom'],
  [/\b(neuron|perceptron|neural net|weights? and bias|activation|hidden layer)\b|\bneuron\b/i, 'weigh-the-inputs'],
  [/\b(context (window|length)|forget\w*|memory|hallucinat\w*|RAG|retrieval|retrieves?|look(s|ing)? (it |things )?up|grounding)\b/i, 'what-it-remembers'],
  [/\b(overfit\w*|underfit\w*|generali[sz]\w*|training (vs|versus|and) test|test (set|data)|memori[sz]\w*|bias[- ]variance)\b/i, 'too-good-to-be-true'],
  [/\b(reinforcement|rewards?|RLHF|human feedback|explor(e|ation) (vs|versus|and) exploit|exploit|thumbs[- ]up)\b/i, 'learn-from-reward'],
  [/\b(sunsets?|sunrise|horizon|haze|dusk|dawn)\b|\b(matahari terbenam|senja)\b/i, 'watch-the-sky'],
  [/\b(trigonometr\w*|trigonometri|sines?|cosines?|tangents?|hypotenuse|hipotenus|SOH.?CAH.?TOA|sin, cos|sin cos|right[- ]angled? triangles?|segi tiga tegak)\b/i, 'name-the-sides'],
  [/\b(convolution\w*|CNNs?|filters? (slide|over)|edge detection|feature maps?|how (an? )?AI sees|computer vision|image recognition|pixels?|recognis\w* images|recogniz\w* images)\b/i, 'slide-the-filter'],
  [/\b(diffusion|denois\w*|image generat\w*|stable diffusion|midjourney|dall-?e)\b/i, 'out-of-the-noise'],
  [/\b(training loop|one (word|token) at a time|loop|epochs?|iterat\w+|agents?|agentic|tool (use|calls?|calling)|function calling|reason(s|ing)?,? (and )?act|ReAct)\b/i, 'go-round-the-loop'],
  [/\b(next[- ](word|token)s?|temperature|sampling|softmax|predict\w* the next)\b/i, 'odds-and-temperature'],
  [/\b(embeddings?|word vectors?|vector space|semantic search|similar meanings?)\b/i, 'map-of-meaning'],
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

// AHA is an AI tutor: an ambiguous term means its AI sense unless the learner says otherwise. The web search runs on
// the learner's words, so the AI sense is added to the query too (walk: "how does a transformer work" taught coils).
const AI_TERMS = /\b(transformers?|attention|agents?|neurons?|tokens?|embeddings?|diffusion|temperature|prompts?|models?|training|hallucinat\w*|weights?|layers?)\b/i;
const OTHER_SENSE = /\b(electric\w*|voltage|coil|power grid|substation|film|movie|toy|robot toy|brain cell|biology|crypto\w*|blockchain|fashion|3d model|clay|weather|cooking|gym|sports?|insurance)\b/i;
const AI_SAID = /\b(ai|a\.i\.|artificial intelligence|machine learning|ml|llms?|chatgpt|gpt|neural|deep learning|chatbots?)\b/i;
export function aiSense(prompt: string): string {
  return AI_TERMS.test(prompt) && !OTHER_SENSE.test(prompt) && !AI_SAID.test(prompt) ? `${prompt} (in AI and machine learning)` : prompt;
}

export async function makePlan(prompt: string, level: Level, routes = PLAN_ROUTES, web = true, langPref?: string): Promise<{ plan: Plan; sources: Source[]; meter: Meter }> {
  const m = meter();
  const t0 = Date.now();
  // What they typed in wins; English typing with Bahasa Melayu (or another language) picked in the app follows the pick.
  const typed = detectLanguage(prompt);
  const lang = typed === 'English' && langPref ? langPref : typed;
  const res = await hedge(routes, 12_000, async (route) => {
    try {
      const r = await chatJson(route, [{ role: 'system', content: PLAN_SYSTEM }, { role: 'system', content: planBrief(level, lang) }, { role: 'user', content: planUser(aiSense(prompt)) }], { web, timeoutMs: 30_000, temperature: 0.3 });
      m.costUsd += r.costUsd;
      const parsed = Plan.safeParse(r.data);
      if (!parsed.success) throw new AiError(`plan shape: ${parsed.error.issues[0]?.message}`);
      const plan = { ...parsed.data, lang };
      if (plan.status === 'ok' && plan.lessons.length < 2) throw new AiError('plan has fewer than 2 lessons');
      if (plan.status === 'clarify' && !plan.question) plan.question = 'What would you like to understand?';
      // Decided in code, not left to the prompt: the first lesson is never a boxes-and-arrows diagram (it is the
      // learner's first impression), at most one per course, and unknown patterns fall back to a drawn scene.
      let flows = 0;
      // Malaysian Malay in titles and goals too (panel, Nurul): Indonesian "kekebalan kelompok" becomes "imuniti kelompok".
      if (/^malay/i.test(plan.lang)) {
        const fix = (t: string) => t.replace(/kekebalan kelompok/gi, (m) => (m[0] === 'K' ? 'Imuniti Kelompok' : 'imuniti kelompok')).replace(/\bkekebalan\b/gi, (m) => (m[0] === 'K' ? 'Imuniti' : 'imuniti'));
        plan.topic = fix(plan.topic); plan.summary = fix(plan.summary);
        plan.lessons = plan.lessons.map((l) => ({ ...l, title: fix(l.title), goal: fix(l.goal), aha: fix(l.aha) }));
      }
      // A template is routed at most twice per course: every lesson looking the same was Logan's 2/10 complaint.
      const used: Record<string, number> = {};
      // AI ideas are not physical machines: no 3D toolboxes for tools or agents (walk 2026-10-29).
      const aiTopic = AI_SAID.test(`${prompt} ${plan.topic}`) || aiSense(prompt) !== prompt;
      let last = '';
      plan.lessons = plan.lessons.map((l, i) => {
        let pattern = PATTERN_IDS.includes(l.pattern) ? l.pattern : 'act-it-out';
        if (aiTopic && pattern === 'explode-the-machine') pattern = 'act-it-out';
        if (pattern === 'follow-the-flow' && (i === 0 || flows++ > 0)) pattern = 'act-it-out';
        // In an attention course, softmax, scaling and masking lessons belong on the attention grid, not next-word odds.
        const attentionCourse = /\b(attention|transformers?|queries|keys? and values?)\b/i.test(plan.topic);
        const trigCourse = /\b(trigonometr\w*|trigonometri|sin|cos|kos|tan|SOH)\b/i.test(plan.topic);
        const routed = trigCourse && !/\b(circle|bulatan|graph|graf|wave|gelombang)\b/i.test(l.title) && /\b(sides?|angles?|ratios?|sisi|sudut|nisbah|sin|cos|kos|tan|missing|hilang|hypotenuse|hipotenus)\b/i.test(`${l.title} ${l.goal}`) ? 'name-the-sides'
          : attentionCourse && /\b(softmax|scal\w*|d_k|√d|temperature|mask\w*|heads?)\b/i.test(`${l.title} ${l.goal}`) ? 'who-looks-at-whom' : templateFor(`${l.title} ${l.goal} ${l.aha}`, pattern, l.title);
        if (routed !== pattern && (used[routed] ?? 0) < 2 && routed !== last) pattern = routed;
        // Never the same template twice in a row, whoever chose it: two lessons in a row looked identical (walk 2026-10-29).
        if ((used[pattern] ?? 0) >= 2 || (pattern === last && TEMPLATE_IDS.has(pattern))) pattern = 'act-it-out';
        used[pattern] = (used[pattern] ?? 0) + 1;
        last = pattern;
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
