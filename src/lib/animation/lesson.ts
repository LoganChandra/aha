// Animation (Stage): writes one lesson's recipe, checks it, has the inspector compare words with picture, and repairs.
// Takes a `Plan` and a `Fact[]` in; hands a `Lesson` (the renderer-neutral recipe) out.
import { AiError, chatJson, type Msg, type Route } from '../ai';
import { PRIMARY, hedge, meter, type Meter } from '../models';
import { Plan, type Lesson, type Level, type Source } from '../recipe';
import { factAnchors, factsUsed, research, type Fact } from '../research';
import { CHECK_SYSTEM, LESSON_SYSTEM, checkUser, lessonUser, repairUser } from './prompts';
import { describeSteps } from './inspect';
import { PLAYBOOK } from './playbook';
import { checkLesson, repair } from './validate';
import { FIRST_LESSON_ROUTES, LESSON_ROUTES } from './routes';

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
    // A copy is an error on every draft, so a repeat copy is never accepted as clean.
    if (checked.lesson && copiesPlaybook(checked.lesson)) checked.errors.push(COPY_ERROR);
    // A lesson routed to a template must use it: free drawings of loops and grids came out messy (walk: the agent loop).
    const pat = PLAYBOOK.find((p) => p.id === ctx.plan.lessons[ctx.index]?.pattern);
    if (checked.lesson && pat && /Use the [A-Z ]+ template/.test(pat.use) && checked.lesson.scene.type !== pat.example.scene.type)
      checked.errors.push(`This lesson must use the "${pat.example.scene.type}" template (see its example in the playbook), not "${checked.lesson.scene.type}". Rewrite the scene with type "${pat.example.scene.type}".`);
    m.calls.push({ model: route.model, ok: checked.errors.length === 0 && !!checked.lesson, costUsd: r.costUsd, ms: r.ms, note: checked.errors.slice(0, 3).join(' | ') || undefined });
    if (checked.lesson && checked.errors.length === 0) {
      // Clean by the rules: once per lesson, check the words against the picture before accepting it.
      if (inspected || attempt === 2) return { lesson: checked.lesson, errors: [] };
      inspected = true;
      // The code checks below are instant and always run; only the model inspector is skipped when lesson 1 is slow.
      const slow = Date.now() - started > inspectWithin;
      // A copy of a playbook example is not a lesson about this topic (walk: "Unbelievable cats love boxes" again).
      const copied: string[] = [];
      // A lesson that ignores its fact sheet is generic; the inspector's repair turn also asks for the facts.
      const anchors = ctx.anchors ?? [];
      // Health topics never promise certainty (panel, Nurul: "pertahanan: 100%", "Anda tidak sakit").
      const health = /\b(vaccin\w*|vaksin|medicin\w*|ubat|disease|penyakit|immun\w*|imun\w*|virus|infection|jangkitan|cancer|kanser|diabetes|drug|dose|dos)\b/i.test(`${ctx.plan.topic} ${ctx.plan.lessons[ctx.index]?.title ?? ''}`);
      const absolute = health ? [...new Set(JSON.stringify([checked.lesson.steps, checked.lesson.scene]).match(/\b(100 ?%|never get sick|completely safe|totally safe|guaranteed|cannot get sick|won'?t get sick|tidak akan sakit|tidak sakit|pasti selamat|selamat sepenuhnya)\b/gi) ?? [])] : [];
      const healthGap = absolute.length ? [`Health claims must be honest and hedged: replace ${absolute.slice(0, 3).map((x) => `"${x}"`).join(', ')} with "usually", "much less likely", "milder", or a real figure from the FACT SHEET.`] : [];
      // Malay wording a native-speaking nurse flagged (panel, Nurul): fixed in code, not left to the prompt.
      const MALAY_FIX: [RegExp, string][] = [[/\bslaid\b/i, '"peluncur"'], [/\bpenjenayah\b/i, '"kuman" or "musuh"'], [/\bkebal\b/i, '"imun" or "berimuniti"'], [/\bhafal\b/i, '"ingat" or "mengenali"'], [/kekebalan kelompok/i, '"imuniti kelompok"'], [/\bTekan\b/, '"Ketik"']];
      const malayGap = /^malay/i.test(ctx.plan.lang ?? '') ? MALAY_FIX.filter(([re]) => re.test(JSON.stringify([checked.lesson!.steps, checked.lesson!.scene, checked.lesson!.params]))).map(([re, use]) => `Malay wording: replace ${re.source.replace(/\\b/g, '')} with ${use}.`) : [];
      // Money and big-number claims must come from the fact sheet or the knobs, never from thin air (C04).
      const sheet = (ctx.anchors ?? []).join(' ');
      const unsourced = anchors.length >= 3 ? [...new Set(checked.lesson.steps.flatMap((st) => `${st.say} ${st.after ?? ''}`.replace(/\{[^}]*\}/g, '').match(/\$?\d[\d,.]*\s?(?:bn|billion|trillion|tn|million|m\b)/gi) ?? []))]
        .filter((x) => { const n = x.replace(/[^\d.]/g, ''); return n && !sheet.includes(n) && !JSON.stringify(checked.lesson!.scene).includes(n); }) : [];
      const factGap = [...(unsourced.length ? [`These figures are not in the FACT SHEET: ${unsourced.slice(0, 4).join(', ')}. Use the sheet's numbers or remove them.`] : []), ...(anchors.length >= 3 && factsUsed(checked.lesson, anchors) < 2 ? ['The lesson uses none of the FACT SHEET: rebuild it around at least 2 of those facts (their numbers, names or dates) and show them in the picture.'] : [])];
      const issues = [...copied, ...malayGap, ...healthGap, ...factGap, ...(slow ? [] : await inspect(checked.lesson, ctx, m, Math.min(ctx.index === 0 ? 10_000 : 25_000, deadline - Date.now() - 20_000)))];
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

/** True when a draft copies a playbook example instead of teaching this topic (walk: verbatim "The cat sat on the"). */
export function copiesPlaybook(l: Lesson): boolean {
  const near = (a: string, b: string) => { const wa = new Set(a.toLowerCase().match(/\w+/g) ?? []), wb = b.toLowerCase().match(/\w+/g) ?? []; return wb.length > 4 && wb.filter((x) => wa.has(x)).length / wb.length >= 0.8; };
  return PLAYBOOK.some((p) => p.example.steps.filter((es) => l.steps.some((st) => near(st.say, es.say))).length >= 2 || JSON.stringify(p.example.scene) === JSON.stringify(l.scene) || sameWords(p.example.scene, l.scene)
    || (p.example.scene.type === 'nextWord' && l.scene.type === 'nextWord' && p.example.scene.context === l.scene.context)
    || (p.example.scene.type === 'tokens' && l.scene.type === 'tokens' && JSON.stringify(p.example.scene.pieces.map((x) => x.text)) === JSON.stringify(l.scene.pieces.slice(0, p.example.scene.pieces.length).map((x) => x.text))));
}
const COPY_ERROR = 'The lesson copies the playbook example (its sentence, words or steps). Write your own content from this lesson\'s topic and fact sheet.';

/** True when a scene reuses most of a playbook example's words (labels and texts), i.e. it was copied, not written. */
function sameWords(a: unknown, b: unknown): boolean {
  const words = (v: unknown): string[] => (typeof v === 'string' ? [] : Array.isArray(v) ? v.flatMap(words) : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => (['label', 'text', 'context', 'caption'].includes(k) && typeof x === 'string' ? [x.toLowerCase().trim()] : k === 'image' && Array.isArray(x) ? x.map((r, i) => `${i}:${r}`) : words(x))) : []);
  const wa = new Set(words(a)), wb = words(b);
  if (wa.size < 3 || !wb.length) return false;
  return wb.filter((w) => wa.has(w)).length / Math.min(wa.size, wb.length) >= 0.6;
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
    // Last resort for a templated lesson: one focused try with the template's example scene shown, so the learner gets
    // the designed picture rather than a repaired free drawing (walk: agents course, lesson 1).
    const pat = PLAYBOOK.find((p) => p.id === plan.lessons[index]?.pattern);
    if (pat && /Use the [A-Z ]+ template/.test(pat.use) && (!best || best.lesson.scene.type !== pat.example.scene.type) && deadline - Date.now() > 25_000) {
      const focused = `${user}\n\nIMPORTANT: the scene MUST be {"type":"${pat.example.scene.type}", ...} like this example scene (write your own content for this lesson, do not copy it):\n${JSON.stringify(pat.example.scene)}`;
      try {
        const again = await writeWith(routes[0], focused, m, deadline, { plan, index, level, anchors: factAnchors(facts) });
        m.ms = Date.now() - t0;
        return { lesson: again.lesson, meter: m, repaired: true, errors: [], facts };
      } catch (e2) {
        const b2 = (e2 as { best?: Written }).best;
        if (b2 && b2.lesson.scene.type === pat.example.scene.type) return { lesson: repair(b2.lesson), meter: m, repaired: true, errors: b2.errors, facts };
      }
    }
    if (best) return { lesson: repair(best.lesson), meter: m, repaired: true, errors: best.errors, facts };
    throw e instanceof Error ? e : new AiError('no model produced a usable lesson');
  }
}
