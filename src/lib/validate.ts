// Checks a lesson recipe beyond its shape: every expression parses, uses only known names and draws something,
// ids line up, steps point at things that exist, every task can be done. Problems come back as plain sentences the model can fix in one
// retry; `repair` then removes anything still broken so the learner never sees a crash.
import { compile, evaluate, type Env } from './expr';
import { ICONS } from './icons';
import { Lesson, SIZE_ARITY, type G2Item, type Param, type Scene } from './recipe';

type Num = number | string;

export type Checked = { lesson: Lesson | null; errors: string[] };

const RESERVED = new Set(['x', 'y', 't', 's', 'k', 'e', 'pi', 'tau']);

function envOf(params: Param[]): Env {
  const env: Env = { t: 0 };
  for (const p of params) env[p.id] = p.value;
  return env;
}

function checkExpr(where: string, src: Num | undefined, allowed: Set<string>, errors: string[]) {
  if (src === undefined || typeof src === 'number') return;
  try {
    const { vars } = compile(src);
    const unknown = vars.filter((v) => !allowed.has(v));
    if (unknown.length) errors.push(`${where}: "${src}" uses unknown name(s) ${unknown.join(', ')}. Use only params (${[...allowed].join(', ')}) or write numbers.`);
  } catch (e) {
    errors.push(`${where}: "${src}" is not a valid expression (${(e as Error).message}). Use * for multiply, ^ for powers, sin()/cos()/sqrt()/abs().`);
  }
}

function sceneIds(scene: Scene): string[] {
  switch (scene.type) {
    case 'graph2d': return scene.items.map((i) => i.id);
    case 'diagram': return [...scene.nodes.map((n) => n.id), ...scene.edges.map((e) => e.id ?? `${e.from}->${e.to}`)];
    case 'model3d': return scene.parts.map((p) => p.id);
    case 'chart': return [...(scene.bars ?? []).map((b) => b.id), ...(scene.series ?? []).map((s) => s.id)];
    case 'timeline': return scene.events.map((e) => e.id);
    case 'pipeline': return [...scene.stages.map((x) => x.id), ...(scene.side ?? []).map((x) => x.id)];
    case 'iconArray': return scene.groups.map((g) => g.id);
    case 'balance': return [scene.left.id, scene.right.id];
  }
}


export function checkLesson(raw: unknown): Checked {
  const parsed = Lesson.safeParse(normalise(raw));
  if (!parsed.success) {
    const errors = parsed.error.issues.slice(0, 12).map((i) => `${i.path.join('.') || 'lesson'}: ${i.message}`);
    return { lesson: null, errors };
  }
  const lesson = parsed.data;
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const p of lesson.params) {
    if (RESERVED.has(p.id)) errors.push(`param "${p.id}": that name is reserved (x, y, t, s, k, e, pi). Rename it.`);
    if (ids.has(p.id)) errors.push(`param "${p.id}" appears twice.`);
    ids.add(p.id);
    if (!(p.max > p.min)) errors.push(`param "${p.id}": max must be greater than min.`);
  }
  const params = new Set(lesson.params.map((p) => p.id));
  const withT = new Set([...params, 't']);
  const scene = lesson.scene;
  const env = envOf(lesson.params);

  if (scene.type === 'graph2d') {
    if (!(scene.x[1] > scene.x[0]) || !(scene.y[1] > scene.y[0])) errors.push('graph2d: x and y ranges must be [min, max] with max > min.');
    for (const it of scene.items) errors.push(...g2Errors(it, scene, env, params));
    const texts = scene.items.filter((i) => i.type === 'text').length;
    if (texts > 3) errors.push(`graph2d: ${texts} text items is clutter; keep at most 3 short readouts and put names on items as labels.`);
    // Icons must have room: two visible icons closer than their sizes collide on screen.
    const icons = scene.items.filter((i) => i.type === 'icon' && !(i.show !== undefined && !(evaluate(i.show, env, 1) > 0))) as Extract<G2Item, { type: 'icon' }>[];
    const shown = icons.length;
    if (shown > 9) errors.push(`graph2d: ${shown} icons are visible at once; use at most 8 big ones (show counts as a number or a bar instead of many small icons).`);
    for (let i = 0; i < icons.length; i++) for (let j = i + 1; j < icons.length; j++) {
      const a = icons[i], b = icons[j];
      const sa = a.size !== undefined ? Math.abs(evaluate(a.size, env, 1)) : 1, sb = b.size !== undefined ? Math.abs(evaluate(b.size, env, 1)) : 1;
      const d = Math.hypot(evaluate(a.at[0], env, 0) - evaluate(b.at[0], env, 0), evaluate(a.at[1], env, 0) - evaluate(b.at[1], env, 0));
      if (d < (sa + sb) * 0.65) errors.push(`icons "${a.id}" and "${b.id}" overlap (centres ${d.toFixed(2)} apart, sizes ${sa} and ${sb}); place them at least ${((sa + sb) * 0.75).toFixed(1)} apart.`);
    }
  } else if (scene.type === 'diagram') {
    const nodes = new Set(scene.nodes.map((n) => n.id));
    for (const e of scene.edges) {
      if (!nodes.has(e.from) || !nodes.has(e.to)) errors.push(`edge ${e.from}->${e.to}: both ends must be node ids (${[...nodes].join(', ')}).`);
      checkExpr(`edge ${e.from}->${e.to} flow`, e.flow, withT, errors);
    }
    for (const n of scene.nodes) checkExpr(`node "${n.id}" value`, n.value, withT, errors);
  } else if (scene.type === 'model3d') {
    for (const p of scene.parts) {
      const need = SIZE_ARITY[p.shape];
      if (p.size.length < need) errors.push(`part "${p.id}": a ${p.shape} needs size with ${need} numbers.`);
      [...p.size, ...(p.position ?? []), ...(p.rotation ?? [])].forEach((v) => checkExpr(`part "${p.id}"`, v, withT, errors));
      if (p.spin) checkExpr(`part "${p.id}" spin`, p.spin.speed, withT, errors);
    }
    if (scene.explodeParam && !params.has(scene.explodeParam)) errors.push(`explodeParam "${scene.explodeParam}" is not in params.`);
  } else if (scene.type === 'pipeline') {
    for (const st of scene.stages) { if (!ICONS[st.icon]) errors.push(`stage "${st.id}": no icon "${st.icon}"; use a listed icon name.`); checkExpr(`stage "${st.id}" value`, st.value, withT, errors); }
    checkExpr('pipeline flow', scene.flow, withT, errors);
    const ids = new Set(scene.stages.map((x) => x.id));
    for (const sd of scene.side ?? []) { if (!ICONS[sd.icon]) errors.push(`side "${sd.id}": no icon "${sd.icon}".`); if (!ids.has(sd.stage)) errors.push(`side "${sd.id}": stage "${sd.stage}" is not a stage id.`); }
  } else if (scene.type === 'iconArray') {
    if (!ICONS[scene.icon]) errors.push(`iconArray: no icon "${scene.icon}".`);
    for (const g of scene.groups) checkExpr(`group "${g.id}" count`, g.count, withT, errors);
  } else if (scene.type === 'balance') {
    for (const side of [scene.left, scene.right]) { if (side.icon && !ICONS[side.icon]) errors.push(`balance "${side.id}": no icon "${side.icon}".`); checkExpr(`balance "${side.id}" weight`, side.weight, withT, errors); }
  } else if (scene.type === 'chart') {
    if (!scene.bars?.length && !scene.series?.length) errors.push('chart: give bars or series.');
    for (const b of scene.bars ?? []) checkExpr(`bar "${b.id}"`, b.value, withT, errors);
    for (const s of scene.series ?? []) s.points.flat().forEach((v) => checkExpr(`series "${s.id}"`, v, withT, errors));
  }

  const known = new Set(sceneIds(scene));
  // Walk the steps in order with the knob values they would have, so each task is checked from where it starts.
  const vals: Env = { ...env };
  let tasks = 0;
  lesson.steps.forEach((st, i) => {
    const w = `step ${i + 1}`;
    for (const [k, v] of Object.entries(st.set ?? {})) { if (!params.has(k)) errors.push(`${w}: set uses "${k}", which is not a param.`); else vals[k] = v; }
    checkTemplate(w, st.say, withT, errors);
    if (st.after) checkTemplate(`${w} after`, st.after, withT, errors);
    const missing = [...(st.focus ?? []), ...(st.callouts ?? []).map((c) => c.at)].filter((f) => !known.has(f));
    if (missing.length) errors.push(`${w}: ids ${missing.join(', ')} are not in the scene (ids: ${[...known].slice(0, 30).join(', ')}).`);
    const t = st.task;
    if (!t) return;
    tasks++;
    if (t.kind === 'slide') {
      const p = lesson.params.find((q) => q.id === t.param);
      if (!p) { errors.push(`${w}: slide task param "${t.param}" is not a param.`); return; }
      const before = errors.length;
      checkExpr(`${w} goal`, t.goal, withT, errors);
      if (errors.length > before) return;
      if (evaluate(t.goal, { ...vals, t: 0 }, 0)) errors.push(`${w}: the goal "${t.goal}" is already true when the step starts, so there is nothing to do. Set the knob elsewhere first or change the goal.`);
      // Reachable by moving this knob, or this knob and its partner on the same draggable point.
      const partner = scene.type === 'graph2d' ? scene.items.find((it) => (it.type === 'point' || it.type === 'icon') && (it.dragX === p.id || it.dragY === p.id)) : undefined;
      const other = partner && (partner.type === 'point' || partner.type === 'icon') ? lesson.params.find((q) => q.id === (partner.dragX === p.id ? partner.dragY : partner.dragX)) : undefined;
      let hit: Env | null = null;
      let bestD = Infinity;
      const G = other ? 60 : 400;
      for (let a = 0; a <= G; a++) for (let b = 0; b <= (other ? G : 0); b++) {
        const trial: Env = { ...vals, t: 0, [p.id]: p.min + ((p.max - p.min) * a) / G };
        if (other) trial[other.id] = other.min + ((other.max - other.min) * b) / G;
        if (!evaluate(t.goal, trial, 0)) continue;
        const d = Math.abs(trial[p.id] - vals[p.id]) + (other ? Math.abs(trial[other.id] - vals[other.id]) : 0);
        if (d < bestD) { bestD = d; hit = trial; }
      }
      // Feedback must not quote a number the learner may not have stopped at ("At 45° the ratio is 0.71" while they sit at 41°; panel: Aisyah, Daniel).
      if (st.after) {
        const N = '(-?\\d+(?:\\.\\d+)?)';
        const near = t.goal.match(new RegExp(`^\\s*abs\\(\\s*${p.id}\\s*-\\s*${N}\\s*\\)\\s*<=?\\s*${N}\\s*$`));
        const past = t.goal.match(new RegExp(`^\\s*${p.id}\\s*[<>]=?\\s*${N}\\s*$`));
        // Only when the learner can visibly stop away from it: a loose tolerance (over 2%) or a one-sided goal.
        const target = near && Number(near[2]) > 0.02 * Math.max(Math.abs(Number(near[1])), 1e-9) ? near[1] : past ? past[1] : null;
        const plain = st.after.replace(/\$[^$]*\$/g, '').replace(/\{[^{}]*\}/g, '');
        if (target && (plain.match(/-?\d+(?:\.\d+)?/g) ?? []).some((x) => Number(x) === Number(target))) errors.push(`${w} after: it quotes ${target}, but the learner can finish anywhere the goal "${t.goal}" allows. Show the value they actually reached with a live value like {${p.id}}, or drop the number.`);
      }
      if (!hit) errors.push(`${w}: no value of "${p.id}"${other ? ` and "${other.id}"` : ''} in range makes the goal "${t.goal}" true. Widen the goal (use a tolerance like abs(${p.id}-target)<0.1).`);
      // The learner finishes the task, so later steps start from a value where the goal holds.
      else { vals[p.id] = hit[p.id]; if (other) vals[other.id] = hit[other.id]; }
    } else if (t.kind === 'tap') {
      if (!known.has(t.target)) errors.push(`${w}: tap target "${t.target}" is not a scene id.`);
      // A callout on the thing to find gives the answer away before the learner looks (panel: Aisyah, Lim).
      if ((st.callouts ?? []).some((c) => c.at === t.target)) errors.push(`${w}: a callout sits on the tap target "${t.target}", which gives the answer away. Remove it; put the name in "after" instead.`);
    } else if (t.kind === 'predict') {
      if (t.answer >= t.choices.length) errors.push(`${w}: predict answer index is past the last choice.`);
      for (const [k, v] of Object.entries(t.reveal?.set ?? {})) { if (!params.has(k)) errors.push(`${w}: reveal sets "${k}", which is not a param.`); else vals[k] = v; }
    }
  });
  if (tasks < 2) errors.push(`only ${tasks} step(s) give the learner something to do. At least 3 steps need a task (slide, tap or predict).`);
  return { lesson, errors };
}

function g2Errors(it: G2Item, scene: Extract<Scene, { type: 'graph2d' }>, env: Env, params: Set<string>): string[] {
  const errors: string[] = [];
  const w = `item "${it.id}"`;
  const withT = new Set([...params, 't']);
  const withX = new Set([...withT, 'x']);
  checkExpr(`${w} show`, it.show, withT, errors);
  if (it.type === 'function') {
    checkExpr(w, it.expr, withX, errors);
    if (!errors.length) {
      let ok = 0;
      for (let i = 0; i <= 40; i++) {
        const x = scene.x[0] + ((scene.x[1] - scene.x[0]) * i) / 40;
        if (Number.isFinite(evaluate(it.expr, { ...env, x }, NaN))) ok++;
      }
      if (ok < 8) errors.push(`${w}: "${it.expr}" gives no real values on the visible x range.`);
    }
  } else if (it.type === 'parametric') {
    const a = new Set([...withT, 's']);
    checkExpr(w, it.x, a, errors); checkExpr(w, it.y, a, errors); checkExpr(w, it.s[0], withT, errors); checkExpr(w, it.s[1], withT, errors);
  } else if (it.type === 'point') {
    checkExpr(w, it.x, withT, errors); checkExpr(w, it.y, withT, errors);
    for (const d of [it.dragX, it.dragY]) if (d && !params.has(d)) errors.push(`${w}: drag param "${d}" is not in params.`);
  } else if (it.type === 'segment') {
    [...it.from, ...it.to].forEach((v) => checkExpr(w, v, withT, errors));
  } else if (it.type === 'circle') {
    [...it.center, it.r].forEach((v) => checkExpr(w, v, withT, errors));
  } else if (it.type === 'polygon') {
    it.points.flat().forEach((v) => checkExpr(w, v, withT, errors));
  } else if (it.type === 'area') {
    checkExpr(w, it.expr, withX, errors); checkExpr(w, it.base, withX, errors);
    checkExpr(w, it.from, withT, errors); checkExpr(w, it.to, withT, errors);
  } else if (it.type === 'angle') {
    [...it.at, it.from, it.to, it.r].forEach((v) => checkExpr(w, v, withT, errors));
  } else if (it.type === 'text') {
    it.at.forEach((v) => checkExpr(w, v, withT, errors));
    checkTemplate(w, it.text, withT, errors);
    // A readout whose live value cannot be worked out shows a blank ("path through air:" with nothing; panel: Lim, Daniel).
    if (!errors.length) for (const m of it.text.matchAll(/\{([^{}]+)\}/g)) {
      if (!Number.isFinite(evaluate(m[1], env, NaN))) errors.push(`${w}: the live value {${m[1]}} has no number at the start (it divides by zero, takes a log of 0, or uses a knob outside its range), so the readout shows a blank. Make it give a real number for every knob value.`);
    }
    // One readout, one value: "buy: 5 sell: 5" on one line reads as noise.
    if ((it.text.match(/\{[^}]+\}/g) ?? []).length >= 2 && (it.text.match(/:/g) ?? []).length >= 2) errors.push(`${w}: "${it.text}" packs several values into one line; make one text item per value (e.g. "buy: {qd}" and "sell: {qs}"), stacked.`);
  } else if (it.type === 'icon') {
    if (!ICONS[it.name]) errors.push(`${w}: there is no icon "${it.name}". Use one of the listed icon names.`);
    [...it.at, it.size].forEach((v) => checkExpr(w, v, withT, errors));
    for (const d of [it.dragX, it.dragY]) if (d && !params.has(d)) errors.push(`${w}: drag param "${d}" is not in params.`);
  }
  return errors;
}

function checkTemplate(where: string, text: string, allowed: Set<string>, errors: string[]) {
  if (/'[^']*'|"[^"]*"/.test(text.match(/\{[^}]*\}/g)?.join('') ?? '')) errors.push(`${where}: live values {…} are numbers only; text like 'violet' cannot go inside braces. Use several text items with show: expressions instead.`);
  for (const m of text.matchAll(/\{([^{}]+)\}/g)) {
    // A brace pair inside $...$ is LaTeX (\frac{a}{b}), not a live value.
    const before = text.slice(0, m.index);
    if ((before.match(/\$/g) ?? []).length % 2 === 1) continue;
    checkExpr(`${where} live value`, m[1], allowed, errors);
  }
}

/** Last resort after the retry: drop whatever is still broken so the scene renders with what is left. */
export function repair(lesson: Lesson): Lesson {
  const params = lesson.params
    .filter((p, i, a) => !RESERVED.has(p.id) && p.max > p.min && a.findIndex((q) => q.id === p.id) === i)
    .map((p) => ({ ...p, value: Math.min(p.max, Math.max(p.min, p.value)) }));
  const names = new Set([...params.map((p) => p.id), 't', 'x', 's']);
  const ok = (v: Num | undefined) => {
    if (v === undefined || typeof v === 'number') return true;
    try { return compile(v).vars.every((n) => names.has(n)); } catch { return false; }
  };
  let scene = lesson.scene;
  if (scene.type === 'graph2d') {
    const g = scene;
    const env = envOf(params);
    const ps = new Set(params.map((p) => p.id));
    scene = { ...g, items: g.items.filter((it) => g2Errors(it, g, env, ps).length === 0) };
  } else if (scene.type === 'diagram') {
    const nodes = new Set(scene.nodes.map((n) => n.id));
    scene = { ...scene, edges: scene.edges.filter((e) => nodes.has(e.from) && nodes.has(e.to) && ok(e.flow)) };
  } else if (scene.type === 'model3d') {
    const m = scene;
    const explodeOk = m.explodeParam && params.some((p) => p.id === m.explodeParam);
    scene = {
      ...m,
      explodeParam: explodeOk ? m.explodeParam : undefined,
      parts: m.parts.filter((p) => p.size.length >= SIZE_ARITY[p.shape] && [...p.size, ...(p.position ?? []), ...(p.rotation ?? [])].every(ok)),
    };
  }
  const known = new Set(sceneIds(scene));
  const ids = new Set(params.map((p) => p.id));
  const keepSet = (set?: Record<string, number>) => (set ? Object.fromEntries(Object.entries(set).filter(([k]) => ids.has(k))) : undefined);
  const steps = lesson.steps.map((st) => {
    let task = st.task;
    if (task?.kind === 'slide') {
      const sl = task;
      let ok = params.some((q) => q.id === sl.param);
      try { ok = ok && compile(sl.goal).vars.every((v) => ids.has(v) || v === 't'); } catch { ok = false; }
      if (!ok) task = undefined;
    } else if (task?.kind === 'tap' && !known.has(task.target)) task = undefined;
    else if (task?.kind === 'predict') task = task.answer < task.choices.length ? { ...task, reveal: task.reveal ? { ...task.reveal, set: keepSet(task.reveal.set) } : undefined } : undefined;
    return {
      ...st,
      set: keepSet(st.set),
      focus: st.focus?.filter((f) => known.has(f)),
      callouts: st.callouts?.filter((c) => known.has(c.at)),
      task,
    };
  });
  return { ...lesson, params, scene, steps };
}

/** Forgive the small shape mistakes cheap models make before the strict parse. */
function normalise(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const l = raw as Record<string, unknown>;
  if (l.lesson && typeof l.lesson === 'object') return normalise(l.lesson);
  const out: Record<string, unknown> = { ...l };
  if (!Array.isArray(out.params)) out.params = [];
  // A param named like a built-in (t, x, s...) gets a new name everywhere it is used.
  const rename = new Map<string, string>();
  out.params = (out.params as Record<string, unknown>[]).filter((p) => p && typeof p === 'object').map((p) => {
    const q = { ...p };
    for (const k of ['min', 'max', 'value', 'step']) if (typeof q[k] === 'string' && q[k] !== '' && !isNaN(Number(q[k]))) q[k] = Number(q[k]);
    if (q.value === undefined && typeof q.default === 'number') q.value = q.default;
    if (q.value === undefined && typeof q.min === 'number') q.value = q.min;
    if (!q.label && typeof q.id === 'string') q.label = q.id;
    if (q.step === 0 || q.step === null) delete q.step;
    if (typeof q.id === 'string' && RESERVED.has(q.id)) { const n = `${q.id}Val`; rename.set(q.id, n); q.id = n; }
    return q;
  });
  // Older recipes said "beats" with "text"; current ones say "steps" with "say".
  if (!Array.isArray(out.steps) && Array.isArray(out.beats)) out.steps = out.beats;
  delete out.beats;
  const fixSet = (set: unknown) => set && typeof set === 'object'
    ? Object.fromEntries(Object.entries(set as Record<string, unknown>).map(([k, v]) => [rename.get(k) ?? k, typeof v === 'string' && !isNaN(Number(v)) ? Number(v) : v]).filter(([, v]) => typeof v === 'number'))
    : undefined;
  if (Array.isArray(out.steps)) {
    out.steps = (out.steps as unknown[]).map((b) => (typeof b === 'string' ? { say: b } : b)).filter((b) => b && typeof b === 'object').map((b) => {
      const q = { ...(b as Record<string, unknown>) };
      if (q.say === undefined && typeof q.text === 'string') q.say = q.text;
      delete q.text;
      if (q.set) q.set = fixSet(q.set);
      if (typeof q.focus === 'string') q.focus = [q.focus];
      if (typeof q.say === 'string') q.say = renameInTemplates(q.say, rename);
      if (typeof q.after === 'string') q.after = renameInTemplates(q.after, rename);
      if (q.task === null || q.task === '') delete q.task;
      const t = q.task as Record<string, unknown> | undefined;
      if (t && typeof t === 'object') {
        const tk = { ...t };
        if (typeof tk.param === 'string') tk.param = rename.get(tk.param) ?? tk.param;
        if (typeof tk.goal === 'string') tk.goal = renameIds(tk.goal.replace(/[{}]/g, ''), rename);
        if (typeof tk.goal === 'number' || typeof tk.goal === 'boolean') delete tk.goal;
        if (tk.kind === 'predict' && typeof tk.answer === 'string' && Array.isArray(tk.choices)) { const i = (tk.choices as string[]).indexOf(tk.answer); if (i >= 0) tk.answer = i; }
        if (tk.reveal && typeof tk.reveal === 'object') { const r = { ...(tk.reveal as Record<string, unknown>) }; if (r.set) r.set = fixSet(r.set); tk.reveal = r; }
        if (!tk.hint && tk.kind !== 'predict') tk.hint = tk.kind === 'tap' ? 'Tap it in the picture.' : 'Move the knob.';
        q.task = tk;
      }
      if (Array.isArray(q.callouts)) q.callouts = (q.callouts as Record<string, unknown>[]).filter((c) => c && typeof c.at === 'string' && typeof c.text === 'string');
      return q;
    });
  }
  const s = out.scene as Record<string, unknown> | undefined;
  if (s && typeof s === 'object') {
    if (s.type === 'graph' || s.type === 'plot' || s.type === 'geometry') s.type = 'graph2d';
    if (s.type === 'graph2d') {
      if (!s.x && Array.isArray(s.xRange)) s.x = s.xRange;
      if (!s.y && Array.isArray(s.yRange)) s.y = s.yRange;
      if (Array.isArray(s.items)) s.items = (s.items as Record<string, unknown>[]).map((it, i) => {
        const q: Record<string, unknown> = { id: `i${i}`, ...it };
        // Icon names arrive as "Piggy Bank", "piggyBank" or "lucide:piggy-bank"; the set uses kebab-case.
        if (q.type === 'icon' && typeof q.name === 'string') q.name = q.name.replace(/^lucide[:-]/i, '').replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase();
        return q;
      });
    }
    if (s.type === 'diagram' && Array.isArray(s.edges)) {
      s.edges = (s.edges as Record<string, unknown>[]).map((e) => ({ id: `${e.from}->${e.to}`, ...e }));
    }
    out.scene = cleanScene(s, rename);
    // A model with explode offsets but no explode knob named: use the knob that obviously means it.
    const sc = out.scene as Record<string, unknown>;
    const ps = out.params as Record<string, unknown>[];
    if (sc.type === 'model3d' && !sc.explodeParam && Array.isArray(sc.parts) && (sc.parts as Record<string, unknown>[]).some((p) => p.explode)) {
      const knob = ps.find((p) => /^(ex|explode|reveal|open|apart|separate|split)/i.test(String(p.id)) || /explode|apart|reveal|open|separate/i.test(String(p.label)))
        ?? ps.find((p) => p.min === 0 && p.max === 1);
      if (knob) sc.explodeParam = knob.id;
    }
  }
  return out;
}

// Keys whose strings are words for people, not expressions.
const WORDS = new Set(['id', 'type', 'name', 'label', 'text', 'tone', 'detail', 'when', 'unit', 'shape', 'axis', 'xLabel', 'yLabel', 'direction', 'kind', 'from', 'to', 'dragX', 'dragY', 'explodeParam']);

/** Drop empty and null fields, unwrap "{w}" written where an expression belongs, apply param renames. */
function cleanScene(v: unknown, rename: Map<string, string>, key = '', parentType = ''): unknown {
  if (Array.isArray(v)) return v.map((x) => cleanScene(x, rename, key, parentType));
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const type = typeof o.type === 'string' ? o.type : parentType;
    const res: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(o)) {
      if (x === null || x === '') continue;
      res[k] = cleanScene(x, rename, k, type);
    }
    return res;
  }
  if (typeof v === 'string') {
    // from/to name nodes only on diagram edges; elsewhere (segments, areas, angles) they hold expressions.
    const isWords = WORDS.has(key) && !((key === 'from' || key === 'to') && parentType !== 'diagram');
    if (key === 'dragX' || key === 'dragY' || key === 'explodeParam') return rename.get(v) ?? v;
    if (isWords) return key === 'text' || key === 'label' ? renameInTemplates(v, rename) : v;
    const bare = v.trim().replace(/^\{([^{}]*)\}$/, '$1').replace(/\{([^{}]*)\}/g, '($1)');
    return renameIds(bare, rename);
  }
  return v;
}

function renameIds(expr: string, rename: Map<string, string>): string {
  if (!rename.size) return expr;
  return expr.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (m) => rename.get(m) ?? m);
}
function renameInTemplates(text: string, rename: Map<string, string>): string {
  if (!rename.size) return text;
  return text.replace(/\{([^{}]+)\}/g, (_, inner: string) => `{${renameIds(inner, rename)}}`);
}
