// The recipe format: what the planner and the lesson writer return, and what the renderer draws.
// Models write data, never code. Every number may instead be an expression string over the lesson's params and t
// (seconds since the scene started), checked by expr.ts.
import { z } from 'zod';

export const LEVELS = ['novice', 'beginner', 'intermediate', 'expert', 'professional'] as const;
export type Level = (typeof LEVELS)[number];
export const LEVEL_LABEL: Record<Level, string> = {
  novice: 'Novice',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
  professional: 'Professional',
};
/** What each level means to the writer. Built on the expertise-reversal effect: full guidance for novices,
 * less scaffolding and more doing as expertise grows (Kalyuga; Salden et al. 2010). */
// Higher levels go DEEPER per step, never DENSER: every level keeps one idea per step and short sentences
// (Logan, 2026-10-28: higher levels became "way too complicated for anybody").
export const LEVEL_BRIEF: Record<Level, string> = {
  novice: 'Never met this. No jargon: every term gets an everyday picture first. Concrete before abstract. Lots of guidance; tasks are easy wins that build confidence.',
  beginner: 'Knows the everyday basics. Introduce one real term per lesson, defined by the picture. Guided tasks with a small stretch.',
  intermediate: 'Studied it before. Standard terms and simple notation are fine. Focus on why it works and how the parts connect. Let them try before telling (predict first).',
  expert: 'Uses it regularly. Skip the basics and go to mechanisms, edge cases and trade-offs, but still ONE idea per step in plain sentences. Harder predictions, fewer hints. Depth, not density.',
  professional: 'Works in this field. Precise vocabulary, real numbers, limits and failure modes, what practitioners argue about. Still ONE idea per step and short sentences: a professional wants clarity, not clutter.',
};

export const TONES = ['primary', 'accent', 'warm', 'cool', 'green', 'red', 'neutral'] as const;
const Tone = z.enum(TONES).catch('primary');

const Num = z.union([z.number(), z.string().min(1).max(400)]);
const Vec2 = z.tuple([Num, Num]);
const Vec3 = z.tuple([Num, Num, Num]);
const Id = z.string().min(1).max(40);
/** An array that keeps its first `max` entries instead of failing when a model writes too many. */
const Many = <T extends z.ZodTypeAny>(item: T, min: number, max: number) => z.array(item).min(min).transform((a) => a.slice(0, max));
// Over-long text is trimmed, not rejected: a cheap model writing one sentence too many should not cost a retry.
// Trimming stops at the last sentence end that fits, so the learner never sees half a sentence.
const Short = (n: number) => z.string().transform((s) => clip(s.trim(), n));
export function clip(s: string, n: number): string {
  if (s.length <= n) return s;
  // Never cut a live value or a formula in half: drop the unfinished {…} or $…$ instead.
  const cutAt = (t: string) => { let r = t; const ob = r.lastIndexOf('{'); if (ob > r.lastIndexOf('}')) r = r.slice(0, ob); if ((r.match(/\$/g) ?? []).length % 2) r = r.slice(0, r.lastIndexOf('$')); return r.trimEnd(); };
  if (/[{$]/.test(s)) return cutAt(s.slice(0, n));
  const cut = s.slice(0, n);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '), cut.lastIndexOf('。'));
  return end > n * 0.5 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…';
}

export const Param = z.object({
  id: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/).max(24),
  label: Short(40),
  min: z.number(),
  max: z.number(),
  step: z.number().positive().optional(),
  value: z.number(),
  unit: Short(12).optional(),
  toggle: z.boolean().optional(),
  // Named states instead of numbers ("Real germ", "Vaccine"): the knob steps through min..max in whole steps and
  // shows these words as buttons. Panel 2026-10-29 (Nurul): a 0/1 slider means nothing to a parent.
  choices: z.array(Short(28)).min(2).max(5).optional(),
});
export type Param = z.infer<typeof Param>;

// ---- 2D graph: functions, curves, points, shapes. Covers maths, physics, signals, geometry.
// show: an expression; the item is drawn only while it is above 0 (e.g. "germs>=2").
const G2Base = { id: Id, label: Short(60).optional(), tone: Tone.optional(), show: Num.optional() };
export const G2Item = z.discriminatedUnion('type', [
  z.object({ type: z.literal('function'), ...G2Base, expr: Num, dashed: z.boolean().optional(), domain: Vec2.optional() }),
  z.object({ type: z.literal('parametric'), ...G2Base, x: Num, y: Num, s: Vec2, dashed: z.boolean().optional() }),
  z.object({ type: z.literal('point'), ...G2Base, x: Num, y: Num, dragX: z.string().optional(), dragY: z.string().optional() }),
  z.object({ type: z.literal('segment'), ...G2Base, from: Vec2, to: Vec2, dashed: z.boolean().optional(), arrow: z.boolean().optional() }),
  z.object({ type: z.literal('circle'), ...G2Base, center: Vec2, r: Num, fill: z.boolean().optional() }),
  z.object({ type: z.literal('polygon'), ...G2Base, points: z.array(Vec2).min(3).max(24) }),
  z.object({ type: z.literal('area'), ...G2Base, expr: Num, from: Num, to: Num, base: Num.optional() }),
  z.object({ type: z.literal('angle'), ...G2Base, at: Vec2, from: Num, to: Num, r: Num.optional() }),
  z.object({ type: z.literal('text'), ...G2Base, at: Vec2, text: Short(80) }),
  // A drawn icon (person, sun, coin, car...) from the curated set in icons.ts; size is its width in x units.
  z.object({ type: z.literal('icon'), ...G2Base, name: z.string().max(40), at: Vec2, size: Num.optional(), dragX: z.string().optional(), dragY: z.string().optional() }),
]);
export type G2Item = z.infer<typeof G2Item>;

export const Graph2D = z.object({
  type: z.literal('graph2d'),
  x: z.tuple([z.number(), z.number()]),
  y: z.tuple([z.number(), z.number()]),
  xLabel: Short(30).optional(),
  yLabel: Short(30).optional(),
  equal: z.boolean().optional(),
  axes: z.boolean().optional(),
  piTicks: z.boolean().optional(),
  items: Many(G2Item, 1, 30),
});

// ---- Diagram: parts of a system and what flows between them.
export const Diagram = z.object({
  type: z.literal('diagram'),
  direction: z.enum(['LR', 'TB']).catch('LR').optional(),
  nodes: Many(z.object({
    id: Id,
    label: Short(40),
    detail: Short(90).optional(),
    tone: Tone.optional(),
    value: Num.optional(),
    unit: Short(12).optional(),
  }), 2, 14),
  edges: Many(z.object({
    id: Id.optional(),
    from: Id,
    to: Id,
    label: Short(40).optional(),
    flow: Num.optional(),
  }), 0, 14),
});

// ---- 3D model: a machine or structure built from solids and ready-made parts, with an exploded view.
/** How many size numbers each shape needs (extra ones are optional, e.g. a gear's tooth count). */
export const SIZE_ARITY = {
  box: 3, cylinder: 2, sphere: 1, cone: 2, torus: 2, capsule: 2, tube: 3,
  gear: 2, wheel: 2, spring: 2, coil: 2, arrow: 1, fan: 1, magnet: 2, cell: 2, lens: 2, chip: 2, piston: 2, valve: 2, sparkplug: 1,
} as const;
export const SHAPES = Object.keys(SIZE_ARITY) as [keyof typeof SIZE_ARITY, ...(keyof typeof SIZE_ARITY)[]];
export const Part = z.object({
  id: Id,
  label: Short(40).optional(),
  shape: z.enum(SHAPES),
  size: Many(Num, 1, 3),
  position: Vec3.optional(),
  rotation: Vec3.optional(),
  tone: Tone.optional(),
  opacity: z.number().min(0.1).max(1).optional(),
  explode: Vec3.optional(),
  spin: z.object({ axis: z.enum(['x', 'y', 'z']), speed: Num }).optional(),
});
export const Model3D = z.object({
  type: z.literal('model3d'),
  parts: Many(Part, 1, 48),
  explodeParam: z.string().optional(),
  camera: z.tuple([z.number(), z.number(), z.number()]).optional(),
});

// ---- Chart: compare quantities.
export const Chart = z.object({
  type: z.literal('chart'),
  kind: z.enum(['bar', 'line']).catch('bar'),
  xLabel: Short(30).optional(),
  yLabel: Short(30).optional(),
  unit: Short(12).optional(),
  bars: Many(z.object({ id: Id, label: Short(30), value: Num, tone: Tone.optional() }), 0, 16).optional(),
  series: z.array(z.object({
    id: Id, label: Short(30), tone: Tone.optional(),
    points: Many(Vec2, 2, 60),
  })).max(5).optional(),
});

// ---- Timeline: what happened in what order.
export const Timeline = z.object({
  type: z.literal('timeline'),
  events: Many(z.object({ id: Id, when: Short(24), label: Short(50), detail: Short(140).optional(), tone: Tone.optional() }), 2, 14),
});

// ---- Templates: designed scenes the model only fills in. Layout, spacing, motion are ours, so they always look right.
const IconName = z.string().max(40);
/** Stages in order, each a big icon; things flow between them. Processes: photosynthesis, the internet, digestion. */
export const Pipeline = z.object({
  type: z.literal('pipeline'),
  stages: Many(z.object({ id: Id, label: Short(28), icon: IconName, tone: Tone.optional(), value: Num.optional(), unit: Short(12).optional(), detail: Short(60).optional() }), 2, 6),
  flow: Num.optional(),
  flowLabel: Short(30).optional(),
  side: Many(z.object({ id: Id, label: Short(24), icon: IconName, tone: Tone.optional(), stage: Id, dir: z.enum(['in', 'out']).catch('in') }), 0, 4).optional(),
});
/** A grid of people (or things), some coloured: "out of 100". Probability, risk, statistics, populations. */
export const IconArray = z.object({
  type: z.literal('iconArray'),
  total: z.number().int().min(4).max(100),
  icon: IconName,
  caption: Short(60).optional(),
  groups: Many(z.object({ id: Id, label: Short(30), tone: Tone.optional(), count: Num }), 1, 4),
});
/** A balance that tips toward the heavier side. Equations, trade-offs, supply versus demand. */
export const Balance = z.object({
  type: z.literal('balance'),
  left: z.object({ id: Id, label: Short(28), icon: IconName.optional(), weight: Num, tone: Tone.optional(), unit: Short(12).optional() }),
  right: z.object({ id: Id, label: Short(28), icon: IconName.optional(), weight: Num, tone: Tone.optional(), unit: Short(12).optional() }),
  caption: Short(60).optional(),
});

export const Scene = z.discriminatedUnion('type', [Graph2D, Diagram, Model3D, Chart, Timeline, Pipeline, IconArray, Balance]);
export type Scene = z.infer<typeof Scene>;
export type SceneType = Scene['type'];

// A step is one screen of the lesson: a short line in the scene, labels pinned to the parts it talks about, and
// usually something to DO (learn by doing: drag to a goal, tap a part, or predict before the reveal).
export const Task = z.discriminatedUnion('kind', [
  // Move a knob (or drag the point tied to it) until `goal` (an expression over the params) is true.
  z.object({ kind: z.literal('slide'), param: z.string(), goal: z.string().min(1).max(200), hint: Short(120) }),
  // Tap the right thing in the scene.
  z.object({ kind: z.literal('tap'), target: z.string(), hint: Short(120) }),
  // Pick an answer before seeing it; then the scene plays the reveal.
  z.object({
    kind: z.literal('predict'),
    question: Short(220),
    choices: Many(Short(80), 2, 4),
    answer: z.number().int().min(0),
    reveal: z.object({ set: z.record(z.string(), z.number()).optional(), play: z.boolean().optional() }).optional(),
  }),
]);
export type Task = z.infer<typeof Task>;

export const Step = z.object({
  say: Short(200),
  callouts: Many(z.object({ at: z.string(), text: Short(48) }), 0, 3).optional(),
  set: z.record(z.string(), z.number()).optional(),
  focus: Many(z.string(), 0, 8).optional(),
  play: z.boolean().optional(),
  task: Task.optional(),
  after: Short(200).optional(),
});
export type Step = z.infer<typeof Step>;

export const Lesson = z.object({
  title: Short(70),
  scene: Scene,
  params: Many(Param, 0, 4).default([]),
  steps: Many(Step, 2, 8),
});
export type Lesson = z.infer<typeof Lesson>;

export const PlanLesson = z.object({
  title: Short(70),
  pattern: z.string().max(40).default('drag-to-discover'),
  goal: Short(300),
  aha: Short(300),
  visual: Short(600),
  facts: z.array(Short(300)).default([]).transform((f) => f.slice(0, 8)),
});
export const Plan = z.object({
  status: z.enum(['ok', 'clarify', 'refuse']).catch('ok'),
  topic: Short(80).default(''),
  summary: Short(240).default(''),
  question: Short(200).optional(),
  options: z.array(Short(60)).optional().transform((o) => o?.slice(0, 4)),
  reason: Short(420).optional(),
  lessons: z.array(PlanLesson).default([]).transform((l) => l.slice(0, 6)),
  lang: z.string().max(40).default('English'),
});
export type Plan = z.infer<typeof Plan>;

export type Source = { title: string; url: string };
