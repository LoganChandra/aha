// Checks a lesson recipe beyond its shape: every expression parses, uses only known names and draws something,
// ids line up, beats point at things that exist. Problems come back as plain sentences the model can fix in one
// retry; `repair` then removes anything still broken so the learner never sees a crash.
import { compile, evaluate, type Env } from './expr';
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
  } else if (scene.type === 'chart') {
    if (!scene.bars?.length && !scene.series?.length) errors.push('chart: give bars or series.');
    for (const b of scene.bars ?? []) checkExpr(`bar "${b.id}"`, b.value, withT, errors);
    for (const s of scene.series ?? []) s.points.flat().forEach((v) => checkExpr(`series "${s.id}"`, v, withT, errors));
  }

  const known = new Set(sceneIds(scene));
  lesson.beats.forEach((b, i) => {
    for (const k of Object.keys(b.set ?? {})) if (!params.has(k)) errors.push(`beat ${i + 1}: set uses "${k}", which is not a param.`);
    checkTemplate(`beat ${i + 1}`, b.text, withT, errors);
    const missing = (b.focus ?? []).filter((f) => !known.has(f));
    if (missing.length) errors.push(`beat ${i + 1}: focus ids ${missing.join(', ')} are not in the scene (ids: ${[...known].slice(0, 30).join(', ')}).`);
  });
  if (lesson.check && lesson.check.answer >= lesson.check.choices.length) errors.push('check: answer index is past the last choice.');
  return { lesson, errors };
}

function g2Errors(it: G2Item, scene: Extract<Scene, { type: 'graph2d' }>, env: Env, params: Set<string>): string[] {
  const errors: string[] = [];
  const w = `item "${it.id}"`;
  const withT = new Set([...params, 't']);
  const withX = new Set([...withT, 'x']);
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
  }
  return errors;
}

function checkTemplate(where: string, text: string, allowed: Set<string>, errors: string[]) {
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
  const beats = lesson.beats.map((b) => ({
    ...b,
    set: b.set ? Object.fromEntries(Object.entries(b.set).filter(([k]) => params.some((p) => p.id === k))) : undefined,
    focus: b.focus?.filter((f) => known.has(f)),
  }));
  const check = lesson.check && lesson.check.answer < lesson.check.choices.length ? lesson.check : undefined;
  return { ...lesson, params, scene, beats, check };
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
  if (Array.isArray(out.beats)) {
    out.beats = (out.beats as unknown[]).map((b) => (typeof b === 'string' ? { text: b } : b)).map((b) => {
      const q = { ...(b as Record<string, unknown>) };
      if (q.set && typeof q.set === 'object') {
        q.set = Object.fromEntries(Object.entries(q.set as Record<string, unknown>).map(([k, v]) => [rename.get(k) ?? k, typeof v === 'string' && !isNaN(Number(v)) ? Number(v) : v]).filter(([, v]) => typeof v === 'number'));
      }
      if (typeof q.focus === 'string') q.focus = [q.focus];
      if (typeof q.text === 'string') q.text = renameInTemplates(q.text, rename);
      return q;
    });
  }
  const s = out.scene as Record<string, unknown> | undefined;
  if (s && typeof s === 'object') {
    if (s.type === 'graph' || s.type === 'plot' || s.type === 'geometry') s.type = 'graph2d';
    if (s.type === 'graph2d') {
      if (!s.x && Array.isArray(s.xRange)) s.x = s.xRange;
      if (!s.y && Array.isArray(s.yRange)) s.y = s.yRange;
      if (Array.isArray(s.items)) s.items = (s.items as Record<string, unknown>[]).map((it, i) => ({ id: `i${i}`, ...it }));
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
const WORDS = new Set(['id', 'type', 'label', 'text', 'tone', 'detail', 'when', 'unit', 'shape', 'axis', 'xLabel', 'yLabel', 'direction', 'kind', 'from', 'to', 'dragX', 'dragY', 'explodeParam']);

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
