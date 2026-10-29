// The text-versus-picture check (blind panel 2026-10-29, Kumar: "the text references things that aren't drawn";
// Lim: the readout ran backwards; Daniel: "diagonal cells light up" when nothing changed; Nurul: "pertahanan: 100%").
// `describeSteps` replays the lesson the way the learner meets it and writes down what the screen holds at each
// step: knob values, readouts, labels, positions, what is draggable and tappable. A cheap model then compares
// every sentence with that record and lists contradictions and wrong facts, and the writer gets one repair turn.
import { evaluate, fillTemplate, type Env } from './expr';
import type { Lesson } from './recipe';
import { fitData, mse, polyFit } from '../components/scene/AiTemplates';

type Num = number | string;
// The POC skin's colours, so "the orange dot" can be checked (writer prompt uses the same names).
const COLOUR: Record<string, string> = { primary: 'blue', accent: 'orange', warm: 'rust', cool: 'teal', green: 'green', red: 'red', neutral: 'grey' };
const r2 = (v: number) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : NaN);

function startEnv(l: Lesson): Env {
  const e: Env = { t: 0 };
  for (const p of l.params) e[p.id] = p.value;
  return e;
}

/** A value of the slide knob that satisfies the goal, nearest to where it starts (what "done" looks like). */
function solveSlide(l: Lesson, env: Env, param: string, goal: string): Env {
  const p = l.params.find((q) => q.id === param);
  if (!p) return env;
  let best: number | null = null;
  for (let i = 0; i <= 400; i++) {
    const v = p.min + ((p.max - p.min) * i) / 400;
    if (evaluate(goal, { ...env, [param]: v }, 0) && (best === null || Math.abs(v - env[param]) < Math.abs(best - env[param]))) best = v;
  }
  return best === null ? env : { ...env, [param]: best };
}

function screen(l: Lesson, env: Env): string {
  const s = l.scene;
  const n = (v: Num | undefined, d = NaN) => r2(v === undefined ? d : evaluate(v, env, d));
  const knobs = l.params.map((p) => `${p.label} (${p.id}) = ${r2(env[p.id])}${p.unit ? ` ${p.unit}` : ''} [range ${p.min} to ${p.max}]`).join('; ');
  let body = '';
  switch (s.type) {
    case 'graph2d': {
      const lines: string[] = [`2D picture, x from ${s.x[0]} (left) to ${s.x[1]} (right), y from ${s.y[0]} (bottom) to ${s.y[1]} (top).`];
      for (const it of s.items) {
        if (it.show !== undefined && !(evaluate(it.show, env, 1) > 0)) { lines.push(`- ${it.id}: HIDDEN now`); continue; }
        const lab = it.label ? ` label "${fillTemplate(it.label, env)}"` : '';
        const tone = ` ${COLOUR[it.tone ?? 'primary']}`;
        switch (it.type) {
          case 'text': lines.push(`- ${it.id}: text "${fillTemplate(it.text, env)}" at (${n(it.at[0])}, ${n(it.at[1])})`); break;
          case 'point': lines.push(`- ${it.id}: dot${tone} at (${n(it.x)}, ${n(it.y)})${lab}${it.dragX || it.dragY ? ` DRAGGABLE (moves ${[it.dragX, it.dragY].filter(Boolean).join(', ')})` : ''}`); break;
          case 'icon': lines.push(`- ${it.id}: icon "${it.name}"${tone} at (${n(it.at[0])}, ${n(it.at[1])})${lab}${it.dragX || it.dragY ? ` DRAGGABLE (moves ${[it.dragX, it.dragY].filter(Boolean).join(', ')})` : ''}`); break;
          case 'segment': lines.push(`- ${it.id}: ${it.arrow ? 'arrow' : 'line'}${tone}${it.dashed ? ' dashed' : ''} from (${n(it.from[0])}, ${n(it.from[1])}) to (${n(it.to[0])}, ${n(it.to[1])})${lab}`); break;
          case 'circle': lines.push(`- ${it.id}: circle${tone} centre (${n(it.center[0])}, ${n(it.center[1])}) radius ${n(it.r)}${lab}`); break;
          case 'polygon': lines.push(`- ${it.id}: shape${tone} with corners ${it.points.map(([a, b]) => `(${n(a)}, ${n(b)})`).join(' ')}${lab}`); break;
          case 'angle': lines.push(`- ${it.id}: angle mark at (${n(it.at[0])}, ${n(it.at[1])}) from ${n(it.from)} to ${n(it.to)} rad${lab}`); break;
          case 'function': case 'area': {
            const xs = [0, 0.25, 0.5, 0.75, 1].map((f) => s.x[0] + (s.x[1] - s.x[0]) * f);
            lines.push(`- ${it.id}: ${it.type === 'area' ? 'shaded area under' : 'curve'}${tone} y = ${it.expr}; samples ${xs.map((x) => `x=${r2(x)}→${r2(evaluate(it.expr, { ...env, x }, NaN))}`).join(', ')}${lab}`);
            break;
          }
          case 'parametric': lines.push(`- ${it.id}: curve${tone} (x=${it.x}, y=${it.y})${lab}`); break;
        }
      }
      // What the eye actually meets: things drawn on top of each other, and things too small to see or act on.
      const W = s.x[1] - s.x[0], H = s.y[1] - s.y[0];
      const spots: { id: string; x: number; y: number; w: number; h: number }[] = [];
      for (const it of s.items) {
        if (it.show !== undefined && !(evaluate(it.show, env, 1) > 0)) continue;
        const box = (xs: number[], ys: number[]) => { const f = xs.filter(Number.isFinite), g = ys.filter(Number.isFinite); if (f.length && g.length) spots.push({ id: it.id, x: (Math.min(...f) + Math.max(...f)) / 2, y: (Math.min(...g) + Math.max(...g)) / 2, w: Math.max(...f) - Math.min(...f), h: Math.max(...g) - Math.min(...g) }); };
        if (it.type === 'point') box([n(it.x)], [n(it.y)]);
        else if (it.type === 'icon' || it.type === 'text') box([n(it.at[0])], [n(it.at[1])]);
        else if (it.type === 'segment') box([n(it.from[0]), n(it.to[0])], [n(it.from[1]), n(it.to[1])]);
        else if (it.type === 'polygon') box(it.points.map(([a]) => n(a)), it.points.map(([, b]) => n(b)));
        else if (it.type === 'circle') { const c = [n(it.center[0]), n(it.center[1])], r = Math.abs(n(it.r)); box([c[0] - r, c[0] + r], [c[1] - r, c[1] + r]); }
      }
      const notes: string[] = [];
      for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) {
        const a = spots[i], b = spots[j];
        if (Math.abs(a.x - b.x) < W * 0.05 && Math.abs(a.y - b.y) < H * 0.05) notes.push(`${a.id} and ${b.id} sit on top of each other`);
      }
      for (const sp of spots) {
        const it = s.items.find((x) => x.id === sp.id)!;
        if ((it.type === 'polygon' || it.type === 'segment') && Math.max(sp.w / W, sp.h / H) < 0.04) notes.push(`${sp.id} is tiny (under 4% of the picture), hard to see or tap`);
      }
      if (notes.length) lines.push(`ON SCREEN: ${notes.slice(0, 12).join('; ')}.`);
      body = lines.join('\n');
      break;
    }
    case 'diagram': body = `Boxes-and-arrows diagram. Boxes: ${s.nodes.map((x) => `${x.id} "${x.label}"${x.value !== undefined ? ` value ${n(x.value)}` : ''}`).join('; ')}. Arrows: ${s.edges.map((e) => `${e.from}→${e.to}${e.label ? ` "${e.label}"` : ''}${e.flow !== undefined ? ` flow ${n(e.flow)}` : ''}`).join('; ')}.`; break;
    case 'model3d': body = `3D model. Parts: ${s.parts.map((p) => `${p.id}${p.label ? ` "${p.label}"` : ''} (${p.shape})`).join('; ')}.${s.explodeParam ? ` Pulled apart by ${s.explodeParam} = ${r2(env[s.explodeParam])}.` : ''}`; break;
    case 'chart': body = `Chart. ${(s.bars ?? []).map((b) => `bar ${b.id} "${b.label}" = ${n(b.value)}`).join('; ')} ${(s.series ?? []).map((x) => `series ${x.id} "${x.label}"`).join('; ')}`; break;
    case 'timeline': body = `Timeline: ${s.events.map((e) => `${e.id} ${e.when} "${e.label}"`).join('; ')}`; break;
    case 'pipeline': body = `Process strip: ${s.stages.map((x) => `${x.id} "${x.label}"${x.value !== undefined ? ` = ${n(x.value)}` : ''}`).join(' → ')}${(s.side ?? []).length ? `; side: ${(s.side ?? []).map((x) => `${x.id} "${x.label}" ${x.dir} ${x.stage}`).join(', ')}` : ''}`; break;
    case 'iconArray': body = `Grid of ${s.total} "${s.icon}" icons: ${s.groups.map((g) => `${g.id} "${g.label}" = ${n(g.count)}`).join(', ')}`; break;
    case 'spectrum': {
      const v = n(s.marker);
      body = `Coloured scale. Left end: "${s.from.label}" ${s.from.value}${s.unit ?? ''}; right end: "${s.to.label}" ${s.to.value}${s.unit ?? ''}. Marker at ${v}${s.unit ?? ''}, ${Math.round(((v - s.from.value) / (s.to.value - s.from.value || 1)) * 100)}% of the way from left to right${s.markerLabel ? ` ("${s.markerLabel}")` : ''}.${(s.marks ?? []).length ? ` Marks: ${(s.marks ?? []).map((m) => `${m.id} "${m.label}" at ${m.at}`).join('; ')}.` : ''}${(s.readouts ?? []).length ? ` Readouts: ${(s.readouts ?? []).map((r) => `${r.label} ${n(r.value)}${r.unit ?? ''}`).join('; ')}.` : ''}`;
      break;
    }
    case 'network': body = `Network, left to right: ${s.layers.map((l) => l.map((x) => `${x.id} "${x.label}"${x.value !== undefined ? ` = ${n(x.value)}` : ''}`).join(', ')).join(' | ')}. Links (drawn blue when the weight is positive, red when negative, thicker as |weight| grows): ${s.links.map((l) => `${l.from}→${l.to} weight ${n(l.weight)} (${n(l.weight) < 0 ? 'red' : 'blue'})`).join('; ')}.`; break;
    case 'attention': {
      const nT = s.tokens.length;
      const sc = Array.from({ length: nT }, (_, i) => Array.from({ length: nT }, (_, j) => n(s.scores[i]?.[j] ?? 0, 0)));
      const scale = s.scale !== undefined ? n(s.scale, 1) : 1, mask = s.mask !== undefined ? n(s.mask, 0) >= 0.5 : false;
      const wts = sc.map((row, i) => { const z = row.map((v, j) => (mask && j > i ? -Infinity : v * scale)); const m = Math.max(...z.filter(Number.isFinite)); const e = z.map((v) => (Number.isFinite(v) ? Math.exp(v - m) : 0)); const t = e.reduce((a, b) => a + b, 0) || 1; return e.map((v) => Math.round((v / t) * 100)); });
      body = `Attention grid, rows look at columns, tokens ${s.tokens.join(', ')}. Scale ${r2(scale)}, causal mask ${mask ? 'ON' : 'off'}. Showing ${s.show}. Weights (%, each row sums to 100): ${wts.map((r, i) => `${s.tokens[i]}: ${r.join('/')}`).join('; ')}.`;
      break;
    }
    case 'nextWord': {
      const T = s.temperature !== undefined ? n(s.temperature, 1) : 1, sc = s.words.map((x) => n(x.score, 0)), m = Math.max(...sc);
      const e = sc.map((v) => Math.exp((v - m) / Math.max(0.05, T))), t = e.reduce((a, b) => a + b, 0);
      body = `Sentence "${s.context} ___". Next-word chances at temperature ${r2(T)} (computed): ${s.words.map((x, i) => `${x.label} ${Math.round((e[i] / t) * 100)}%`).join(', ')}.`;
      break;
    }
    case 'tokens': body = `Text cut into ${s.pieces.length} tokens: ${s.pieces.map((p) => `[${p.text}]`).join('')}. Ids shown: ${s.showIds !== undefined && n(s.showIds, 0) >= 0.5 ? 'yes' : 'no'}.`; break;
    case 'embedding': {
      const q = s.query ? { x: n(s.query.x, 0), y: n(s.query.y, 0) } : null;
      const near = q ? s.points.map((p) => ({ l: p.label, d: Math.hypot(p.x - q.x, p.y - q.y) })).sort((a, b) => a.d - b.d).slice(0, s.nearest ?? 2) : [];
      body = `Map of meaning: ${s.points.map((p) => `${p.id} "${p.label}" at (${p.x}, ${p.y})${p.group ? ` [${p.group}]` : ''}`).join('; ')}.${q ? ` Draggable "${s.query!.label}" at (${r2(q.x)}, ${r2(q.y)}); nearest (computed): ${near.map((x) => `${x.l} ${r2(x.d)}`).join(', ')}.` : ''}`;
      break;
    }
    case 'descent': {
      const L = (x: number) => evaluate(s.loss, { ...env, x, w: x }, NaN), wv = n(s.w, 0), lr = n(s.lr, 0.1);
      const st = Math.max(0, Math.min(12, Math.round(s.steps !== undefined ? n(s.steps, 1) : 1)));
      const path = [wv]; let ww = wv; for (let i = 0; i < st; i++) { const g = (L(ww + 1e-4) - L(ww - 1e-4)) / 2e-4; ww -= lr * g; path.push(ww); }
      const xs = Array.from({ length: 61 }, (_, i) => s.range[0] + ((s.range[1] - s.range[0]) * i) / 60), best = xs.reduce((a, b) => (L(b) < L(a) ? b : a));
      body = `Loss curve ${s.loss} over ${s.range[0]}..${s.range[1]} (lowest near ${r2(best)}). Ball at ${r2(wv)}, loss ${r2(L(wv))}. Learning rate ${r2(lr)}. Next steps drawn (computed): ${path.slice(1).map(r2).join(' → ') || 'none'}.`;
      break;
    }
    case 'reward': {
      const rw = s.options.map((x) => n(x.reward, 0.5)), rounds = Math.round(n(s.rounds, 0)), ex = s.explore !== undefined ? n(s.explore, 0.1) : 0.1;
      const k = 1 - Math.exp(-Math.max(0, rounds) / 6), est = rw.map((r) => 0.5 + (Math.max(0, Math.min(1, r)) - 0.5) * k);
      const e = est.map((v) => Math.exp(8 * v)), sm = e.reduce((a, b) => a + b, 0), pk = e.map((v) => (1 - ex) * (v / sm) + ex / rw.length);
      body = `Learning from reward after ${rounds} rounds (explore ${r2(ex)}). For each option: true reward, learned estimate, chance of picking it now (computed): ${s.options.map((x, i) => `${x.label}: ${r2(rw[i])} / ${r2(est[i])} / ${Math.round(pk[i] * 100)}%`).join('; ')}.`;
      break;
    }
    case 'fit': {
      const { train, test } = fitData((x) => evaluate(s.truth, { ...env, x }, 0), s.points ?? 10, s.noise ?? 0.25);
      const deg = Math.max(0, Math.min((s.points ?? 10) - 1, Math.round(n(s.degree, 1))));
      const c = polyFit(train, deg);
      body = `Curve fitting. ${train.length} training dots (blue) and ${test.length} new-data squares (orange) from the same true curve y = ${s.truth} plus noise. A curve of complexity (polynomial degree) ${deg} is fitted to the training dots only. Computed: training error ${r2(mse(c, train))}, error on new data ${r2(mse(c, test))}.`;
      break;
    }
    case 'sky': {
      const d = Math.max(0, Math.min(90, n(s.sun, 60))), du = s.dust !== undefined ? Math.max(0, Math.min(1, n(s.dust, 0))) : 0;
      const am = 1 / (Math.sin((d * Math.PI) / 180) + 0.50572 * Math.pow(d + 6.07995, -1.6364));
      const bl = Math.exp(-(0.24 + 0.1 * du) * am);
      body = `Sky over a person standing at the bottom centre. Sun ${Math.round(d)}° above the horizon. Readouts (computed): path through air ${r2(am)}× the overhead path; blue light left ${Math.round(bl * 100)}%. The sky colour is ${bl > 0.6 ? 'clear blue' : bl > 0.3 ? 'pale, turning warm near the horizon' : 'orange and red'}${du > 0.3 ? ', dusty' : ''}.`;
      break;
    }
    case 'convolve': {
      const kernels: Record<string, number[][]> = { 'vertical-edge': [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], 'horizontal-edge': [[-1, -1, -1], [0, 0, 0], [1, 1, 1]], blur: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((r) => r.map((v) => v / 9)), sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] };
      const k = Array.isArray(s.kernel) ? s.kernel : kernels[s.kernel];
      const img = s.image.map((r) => [...r].map((c) => (c === '#' ? 1 : /\d/.test(c) ? Number(c) / 9 : 0)));
      const at = s.at ? [Math.round(n(s.at[0], 0)), Math.round(n(s.at[1], 0))] : null;
      let v = 0; if (at && k) for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) v += (img[at[1] + j]?.[at[0] + i] ?? 0) * k[j][i];
      body = `Convolution. Image (# = dark): ${s.image.join(' / ')}. Filter: ${Array.isArray(s.kernel) ? JSON.stringify(s.kernel) : s.kernel}. ${at ? `Window at column ${at[0]}, row ${at[1]}; output there (computed): ${r2(v)}.` : ''} The output map is drawn beside the image (blue positive, red negative).`;
      break;
    }
    case 'rightTriangle': {
      const d = Math.max(5, Math.min(85, n(s.angle, 35))), H = s.hyp !== undefined ? n(s.hyp, 10) : 10, t2 = (d * Math.PI) / 180;
      const vis = (v: unknown) => (v === undefined ? true : n(v as Num, 1) >= 0.5);
      body = `Right triangle, angle ${Math.round(d)}° at the bottom-left corner, right angle at the bottom-right. Hypotenuse (slanted, blue) ${r2(H)}, opposite (vertical right side, red) ${r2(H * Math.sin(t2))}, adjacent (bottom, green) ${r2(H * Math.cos(t2))}. Side names "${s.names.opp}", "${s.names.adj}", "${s.names.hyp}" are ${vis(s.showNames) ? 'SHOWN' : 'HIDDEN'}; lengths ${s.showLengths !== undefined && vis(s.showLengths) ? 'shown' : 'hidden'}; sin/cos/tan readouts ${s.showRatios !== undefined && vis(s.showRatios) ? `shown (sin ${r2(Math.sin(t2))}, cos ${r2(Math.cos(t2))}, tan ${r2(Math.tan(t2))})` : 'hidden'}. The top corner is DRAGGABLE when the angle is a knob.`;
      break;
    }
    case 'cycle': body = `A loop drawn as a circle: ${s.stages.map((x) => `${x.id} "${x.label}"`).join(' → ')} → back to the first. A dot travels round while playing and a "round N" counter in the middle counts the laps.${s.center ? ` Centre text: "${s.center}".` : ''}`; break;
    case 'denoise': { const st = Math.max(0, Math.min(s.steps, Math.round(n(s.step, 0)))); body = `Diffusion picture of a "${s.icon}" icon${s.prompt ? ` for the prompt "${s.prompt}"` : ''}: step ${st} of ${s.steps}, ${Math.round((1 - st / s.steps) * 100)}% of the picture still covered by grey noise.`; break; }
    case 'balance': body = `Balance: left ${s.left.id} "${s.left.label}" weight ${n(s.left.weight)} vs right ${s.right.id} "${s.right.label}" weight ${n(s.right.weight)}`; break;
  }
  return `Knobs: ${knobs || 'none'}\n${body}`;
}

/** What the learner reads and what the screen shows, step by step, at the start of the step and once its task is done. */
export function describeSteps(l: Lesson): string {
  let env = startEnv(l);
  const out: string[] = [];
  l.steps.forEach((st, i) => {
    if (st.set) env = { ...env, ...st.set };
    const t = st.task;
    const task = !t ? 'no task'
      : t.kind === 'slide' ? `SLIDE knob ${t.param} until ${t.goal}. Hint: "${t.hint}"`
      : t.kind === 'tap' ? `TAP ${t.target}. Hint: "${t.hint}"`
      : `PREDICT "${t.question}" choices ${t.choices.map((c, k) => `${k === t.answer ? '[correct] ' : ''}"${c}"`).join(', ')}`;
    out.push(`STEP ${i + 1}\nLearner reads: "${fillTemplate(st.say, env)}"${st.callouts?.length ? `\nCallout tags drawn on the picture (visible): ${st.callouts.map((c) => `on ${c.at}: "${c.text}"`).join('; ')}` : ''}\nTask: ${task}\nSCREEN AT START:\n${screen(l, env)}`);
    if (t?.kind === 'slide') env = solveSlide(l, env, t.param, t.goal);
    if (t?.kind === 'predict' && t.reveal?.set) env = { ...env, ...t.reveal.set };
    if (st.after) out.push(`After the task the learner reads: "${fillTemplate(st.after, env)}"\nSCREEN THEN:\n${t?.kind === 'slide' || t?.kind === 'predict' ? screen(l, env) : '(same as start)'}`);
  });
  return out.join('\n\n');
}
