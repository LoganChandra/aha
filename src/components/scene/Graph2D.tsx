'use client';
// 2D graph renderer: curves, points you can drag, shapes, shaded areas, angles and live labels, in SVG.
import { useId, useMemo, useRef, useState } from 'react';
import { evaluate, fillTemplate, type Env } from '@/lib/expr';
import { ICONS } from '@/lib/icons';
import type { G2Item, Scene } from '@/lib/recipe';
import { tone, useGlide, useSize } from './runtime';

type G2 = Extract<Scene, { type: 'graph2d' }>;
type Num = number | string;
/** Internal only: line-chart series are drawn as polylines on the same axes. */
export type Polyline = { type: 'polyline'; id: string; points: [Num, Num][]; label?: string; tone?: string };
type Item = G2Item | Polyline;

type Props = {
  scene: Omit<G2, 'items'> & { items: Item[] };
  env: Env;
  focus: string[];
  params: { id: string; min: number; max: number; value?: number }[];
  onDrag: (values: Record<string, number>) => void;
  callouts?: Record<string, string>;
  onTap?: (id: string) => void;
  /** The knob a slide task wants moved, and the value that completes it: the handle glows and an arrow points the way. */
  guide?: { param: string; target: number };
};


function niceStep(range: number, px: number, target = 64): number {
  if (!Number.isFinite(range) || range <= 0) return 1;
  const raw = range / Math.max(1, px / target);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * mag;
}

function tickLabel(v: number, step: number, pi: boolean): string {
  if (pi) {
    const k = Math.round((v / Math.PI) * 4);
    if (k === 0) return '0';
    const [num, den] = reduce(k, 4);
    const n = num === 1 ? '' : num === -1 ? '-' : String(num);
    return den === 1 ? `${n}π` : `${n}π/${den}`;
  }
  const d = Math.max(0, -Math.floor(Math.log10(step)));
  return (Math.round(v * 10 ** d) / 10 ** d).toString().replace('-', '−');
}
function reduce(a: number, b: number): [number, number] {
  const g = (x: number, y: number): number => (y ? g(y, x % y) : Math.abs(x));
  const k = g(a, b);
  return [a / k, b / k];
}

export default function Graph2D({ scene, env, focus, params, onDrag, callouts = {}, onTap, guide }: Props) {
  const uid = useId().replace(/:/g, '');
  const fx = (name: string) => `url(#${name}-${uid})`;
  const [box, size] = useSize<HTMLDivElement>();
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef<{ x?: string; y?: string; at: [Num, Num] } | null>(null);

  const showAxes = scene.axes !== false;
  // The left margin fits the widest y label ("10000" needs more room than "1"), so tick numbers are never cut off.
  const PAD = useMemo(() => {
    if (!showAxes) return { l: 12, r: 12, t: 12, b: 12 };
    const [a, b] = scene.y;
    const step = niceStep(b - a, Math.max(80, size.h - 40), 52);
    const longest = Math.max(...[a, b, (a + b) / 2].map((v) => tickLabel(Math.round(v / step) * step, step, false).length));
    // Axis titles get their own room outside the plot, so curves never run through them.
    return { l: Math.max(30, 12 + longest * 7), r: 14, t: scene.yLabel ? 26 : 14, b: scene.xLabel ? 42 : 26 };
  }, [showAxes, scene.y, size.h, scene.xLabel, scene.yLabel]);

  // Illustrations (no axes) are framed around what is actually drawn, wherever the knobs go, so a model's loose
  // range never leaves the subject small and off-centre. Plots keep their ranges: the numbers mean something.
  // The frame follows the drawing like a camera: it holds still under a dragging finger, then eases (spring) to
  // fit the new state, so a stretched shape never runs off screen and nothing jumps.
  const [dragActive, setDragActive] = useState(false);
  const stateKey = params.map((p) => Math.round(((env[p.id] ?? p.value ?? 0) - p.min) / ((p.max - p.min) || 1) * 40)).join(',');
  const targetRef = useRef<[number, number, number, number] | null>(null);
  const target = useMemo(() => {
    if (showAxes) return null;
    if (dragActive && targetRef.current) return targetRef.current;
    const b = contentBounds(scene.items, params.map((p) => ({ ...p, value: env[p.id] ?? p.value })), scene.x, scene.y);
    targetRef.current = b;
    return b;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAxes, scene.items, scene.x, scene.y, stateKey, dragActive]);
  const frameTarget = useMemo(() => (target ? { a: target[0], b: target[1], c: target[2], d: target[3] } : { a: 0, b: 0, c: 0, d: 0 }), [target]);
  const frame = useGlide(frameTarget, false);
  const framed: [number, number, number, number] | null = target ? [frame.a, frame.b, frame.c, frame.d] : null;

  const view = useMemo(() => {
    const w = Math.max(10, size.w), h = Math.max(10, size.h);
    const iw = w - PAD.l - PAD.r, ih = h - PAD.t - PAD.b;
    let [x0, x1] = framed ? [framed[0], framed[1]] : scene.x, [y0, y1] = framed ? [framed[2], framed[3]] : scene.y;
    if (scene.equal) {
      // Same scale on both axes, centred: widen whichever range has room to spare.
      const sx = iw / (x1 - x0), sy = ih / (y1 - y0);
      if (sx > sy) { const cx = (x0 + x1) / 2, half = iw / sy / 2; x0 = cx - half; x1 = cx + half; }
      else { const cy = (y0 + y1) / 2, half = ih / sx / 2; y0 = cy - half; y1 = cy + half; }
    }
    const X = (x: number) => PAD.l + ((x - x0) / (x1 - x0)) * iw;
    const Y = (y: number) => PAD.t + (1 - (y - y0) / (y1 - y0)) * ih;
    const invX = (px: number) => x0 + ((px - PAD.l) / iw) * (x1 - x0);
    const invY = (py: number) => y0 + (1 - (py - PAD.t) / ih) * (y1 - y0);
    return { w, h, iw, ih, x0, x1, y0, y1, X, Y, invX, invY };
  }, [size, scene.x, scene.y, scene.equal, PAD, framed]);

  const { X, Y, x0, x1, y0, y1 } = view;
  const ev = (v: Num | undefined, fb = 0, extra?: Env) => evaluate(v, extra ? { ...env, ...extra } : env, fb);
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.6 : 1);
  const hot = (id: string) => focus.includes(id);

  // ---- grid and axes
  // Ticks in multiples of pi only while that stays a sensible count; any range always ends up with at most ~40 ticks.
  const piStep = x1 - x0 > 4 * Math.PI ? Math.PI : x1 - x0 > 1.6 * Math.PI ? Math.PI / 2 : Math.PI / 4;
  const usePi = !!scene.piTicks && (x1 - x0) / piStep <= 40;
  const xs = usePi ? piStep : niceStep(x1 - x0, view.iw);
  const ys = niceStep(y1 - y0, view.ih, 52);
  const xTicks: number[] = [], yTicks: number[] = [];
  for (let i = 0, v0 = Math.ceil(x0 / xs) * xs; i < 60; i++) { const v = v0 + i * xs; if (v > x1 + 1e-9) break; xTicks.push(v); }
  for (let i = 0, v0 = Math.ceil(y0 / ys) * ys; i < 60; i++) { const v = v0 + i * ys; if (v > y1 + 1e-9) break; yTicks.push(v); }
  const ax = Math.min(Math.max(0, x0), x1), ay = Math.min(Math.max(0, y0), y1);

  function curve(fx: (s: number) => [number, number], a: number, b: number, n: number): string {
    let d = '';
    let pen = false;
    let prev: [number, number] | null = null;
    for (let i = 0; i <= n; i++) {
      const s = a + ((b - a) * i) / n;
      const [x, y] = fx(s);
      if (!Number.isFinite(x) || !Number.isFinite(y)) { pen = false; prev = null; continue; }
      const px = X(x), py = Y(y);
      // Break at asymptotes (tan, 1/x): a jump of more than two screen heights is not a line.
      if (prev && Math.abs(py - prev[1]) > view.h * 2) pen = false;
      const cy = Math.max(-view.h * 3, Math.min(view.h * 4, py));
      d += `${pen ? 'L' : 'M'}${px.toFixed(1)},${cy.toFixed(1)}`;
      pen = true;
      prev = [px, py];
    }
    return d;
  }

  const n = Math.min(600, Math.max(120, Math.round(view.iw / 1.5)));
  const fns = scene.items.filter((i) => i.type === 'function' && !i.dashed);
  const heroFn = fns.length >= 1 && fns.length <= 2 && !scene.items.some((i) => i.type === 'area') ? (fns.find((f) => f.tone === undefined || f.tone === 'primary') ?? fns[0]).id : '';

  // Icons never overlap: if any two would touch (with room for a label), every icon shrinks together until they clear.
  const iconItems = scene.items.filter((i): i is Extract<G2Item, { type: 'icon' }> => i.type === 'icon' && !(i.show !== undefined && !(ev(i.show, 1) > 0)));
  const iconRaw = (it: Extract<G2Item, { type: 'icon' }>) => {
    const unit = it.size !== undefined ? Math.abs(X(ev(it.size, 1)) - X(0)) : Math.min(view.iw, view.ih) * 0.18;
    return Math.max(40, Math.min(170, unit));
  };
  let iconScale = 1;
  for (let i = 0; i < iconItems.length; i++) for (let j = i + 1; j < iconItems.length; j++) {
    const a = iconItems[i], b = iconItems[j];
    const d = Math.hypot(X(ev(a.at[0])) - X(ev(b.at[0])), Y(ev(a.at[1])) - Y(ev(b.at[1])));
    const need = (iconRaw(a) + iconRaw(b)) * 0.56 + 6;
    if (d > 1 && d < need) iconScale = Math.min(iconScale, d / need);
  }
  iconScale = Math.max(0.55, iconScale);
  const iconDiscs: Box[] = [];
  const labels: Label[] = [];
  // Where each item sits on screen: callouts pin here and tap targets centre here.
  const anchors: Record<string, [number, number]> = {};

  function render(it: Item) {
    if ('show' in it && it.show !== undefined && !(ev(it.show, 1) > 0)) return null;
    const color = tone(it.tone);
    const width = hot(it.id) ? 4.6 : 3.4;
    // The hero curve (primary tone or in focus) gets a soft glow underneath, like light on paper.
    const glow = (d: string) => (it.tone === undefined || it.tone === 'primary' || hot(it.id)) && !('dashed' in it && it.dashed)
      ? <path d={d} fill="none" stroke={color} strokeWidth={width + 7} strokeLinecap="round" strokeLinejoin="round" opacity={0.13} />
      : null;
    const op = dim(it.id);
    switch (it.type) {
      case 'function': {
        const da = it.domain ? ev(it.domain[0], x0) : x0, db = it.domain ? ev(it.domain[1], x1) : x1;
        const d = curve((x) => [x, ev(it.expr, NaN, { x })], Math.max(x0, da), Math.min(x1, db), n);
        { const ax0 = Math.max(x0, da) + (Math.min(x1, db) - Math.max(x0, da)) * 0.62, ay0 = ev(it.expr, NaN, { x: ax0 }); if (Number.isFinite(ay0)) anchors[it.id] = [X(ax0), Y(Math.max(y0, Math.min(y1, ay0)))]; }
        if (it.label) {
          const lx = Math.min(x1, db) - (x1 - x0) * 0.02, ly = ev(it.expr, NaN, { x: lx });
          if (Number.isFinite(ly) && ly > y0 && ly < y1) labels.push({ x: X(lx) - 4, y: Y(ly) - 8, text: it.label, color, id: it.id, anchor: 'end' });
        }
        // The hero curve stands on a soft wash of its own colour down to the axis: depth instead of a lone line.
        const hero = showAxes && !it.dashed && it.id === heroFn;
        let fillD = '';
        if (hero) {
          const a0 = Math.max(x0, da), b0 = Math.min(x1, db), base = Y(Math.min(Math.max(0, y0), y1));
          const pts: string[] = [];
          for (let i = 0; i <= 120; i++) { const x = a0 + ((b0 - a0) * i) / 120; const y = ev(it.expr, NaN, { x }); if (Number.isFinite(y)) pts.push(`${X(x).toFixed(1)},${Y(Math.max(y0, Math.min(y1, y))).toFixed(1)}`); }
          if (pts.length > 2) fillD = `M${pts[0].split(',')[0]},${base}L${pts.join('L')}L${pts[pts.length - 1].split(',')[0]},${base}Z`;
        }
        return (
          <g key={it.id} opacity={op}>
            {fillD && <path d={fillD} fill={fx(`grad-${it.tone ?? 'primary'}`)} opacity={0.55} />}
            {glow(d)}
            <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={it.dashed ? '6 5' : undefined} strokeLinecap="round" strokeLinejoin="round" className={it.dashed ? undefined : 'draw-in'} pathLength={it.dashed ? undefined : 1} />
          </g>
        );
      }
      case 'parametric': {
        const a = ev(it.s[0], 0), b = ev(it.s[1], 1);
        const d = curve((s) => [ev(it.x, NaN, { s }), ev(it.y, NaN, { s })], a, b, n);
        { const sm = (a + b) / 2; anchors[it.id] = [X(ev(it.x, 0, { s: sm })), Y(ev(it.y, 0, { s: sm }))]; }
        return (
          <g key={it.id} opacity={op}>
            {glow(d)}
            <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={it.dashed ? '6 5' : undefined} strokeLinecap="round" strokeLinejoin="round" className={it.dashed ? undefined : 'draw-in'} pathLength={it.dashed ? undefined : 1} />
          </g>
        );
      }
      case 'polyline': {
        const pts = it.points.map(([a, b]) => `${X(ev(a)).toFixed(1)},${Y(ev(b)).toFixed(1)}`).join(' ');
        { const m = it.points[Math.floor(it.points.length / 2)]; if (m) anchors[it.id] = [X(ev(m[0])), Y(ev(m[1]))]; }
        const last = it.points[it.points.length - 1];
        if (it.label && last) labels.push({ x: X(ev(last[0])) - 4, y: Y(ev(last[1])) - 10, text: it.label, color, id: it.id, anchor: 'end' });
        return (
          <g key={it.id} opacity={op}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" />
            {it.points.map(([a, b], i) => <circle key={i} cx={X(ev(a))} cy={Y(ev(b))} r={3} fill={color} />)}
          </g>
        );
      }
      case 'area': {
        const a = Math.max(x0, ev(it.from, x0)), b = Math.min(x1, ev(it.to, x1));
        if (!(b > a)) return null;
        anchors[it.id] = [X((a + b) / 2), Y(clampY(ev(it.expr, 0, { x: (a + b) / 2 }) / 2))];
        let d = '';
        const m = 160;
        for (let i = 0; i <= m; i++) { const x = a + ((b - a) * i) / m; d += `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(clampY(ev(it.expr, 0, { x }))).toFixed(1)}`; }
        for (let i = m; i >= 0; i--) { const x = a + ((b - a) * i) / m; d += `L${X(x).toFixed(1)},${Y(clampY(ev(it.base ?? 0, 0, { x }))).toFixed(1)}`; }
        if (it.label) labels.push({ x: X((a + b) / 2), y: Y(clampY(ev(it.expr, 0, { x: (a + b) / 2 }) / 2)), text: fillTemplate(it.label, env), color, id: it.id, anchor: 'middle' });
        return <path key={it.id} d={d + 'Z'} fill={fx(`grad-${it.tone ?? 'primary'}`)} fillOpacity={hot(it.id) ? 1 : 0.85} stroke="none" opacity={op} />;
      }
      case 'segment': {
        const ax_ = X(ev(it.from[0])), ay_ = Y(ev(it.from[1])), bx = X(ev(it.to[0])), by = Y(ev(it.to[1]));
        anchors[it.id] = [(ax_ + bx) / 2, (ay_ + by) / 2];
        if (it.label) labels.push({ x: (ax_ + bx) / 2 + 6, y: (ay_ + by) / 2 - 6, text: fillTemplate(it.label, env), color, id: it.id, anchor: 'start' });
        return (
          <g key={it.id} opacity={op}>
            <line x1={ax_} y1={ay_} x2={it.arrow ? bx - 7 * Math.cos(Math.atan2(by - ay_, bx - ax_)) : bx} y2={it.arrow ? by - 7 * Math.sin(Math.atan2(by - ay_, bx - ax_)) : by} stroke={color} strokeWidth={it.arrow ? width + 0.6 : width} strokeDasharray={it.dashed ? '6 5' : undefined} strokeLinecap="round" />
            {it.arrow && <Arrow x={bx} y={by} angle={Math.atan2(by - ay_, bx - ax_)} color={color} size={11} />}
          </g>
        );
      }
      case 'circle': {
        const cx = X(ev(it.center[0])), cy = Y(ev(it.center[1]));
        const r = Math.abs(X(ev(it.center[0]) + ev(it.r, 1)) - cx);
        const ry = Math.abs(Y(ev(it.center[1]) + ev(it.r, 1)) - cy);
        anchors[it.id] = [cx, cy - ry];
        if (it.label) labels.push({ x: cx, y: cy - ry - 8, text: fillTemplate(it.label, env), color, id: it.id, anchor: 'middle' });
        return <ellipse key={it.id} cx={cx} cy={cy} rx={r} ry={ry} fill={it.fill ? fx(`ball-${it.tone ?? 'primary'}`) : 'none'} stroke={color} strokeWidth={width * 0.75} opacity={op} filter={it.fill ? fx('shadow') : undefined} />;
      }
      case 'polygon': {
        const pts = it.points.map(([a, b]) => [X(ev(a)), Y(ev(b))]);
        anchors[it.id] = [pts.reduce((q, p) => q + p[0], 0) / pts.length, pts.reduce((q, p) => q + p[1], 0) / pts.length];
        if (it.label) {
          const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]);
          labels.push({ x: c[0], y: c[1] + 4, text: fillTemplate(it.label, env), color, id: it.id, anchor: 'middle' });
        }
        return <polygon key={it.id} points={pts.map((p) => p.join(',')).join(' ')} fill={fx(`grad-${it.tone ?? 'primary'}`)} fillOpacity={hot(it.id) ? 1 : 0.8} stroke={color} strokeWidth={width * 0.75} strokeLinejoin="round" opacity={op} filter={fx('shadow')} />;
      }
      case 'angle': {
        const cx = ev(it.at[0]), cy = ev(it.at[1]);
        const a = ev(it.from), b = ev(it.to);
        const r = it.r !== undefined ? ev(it.r, 0.3) : Math.min(x1 - x0, y1 - y0) * 0.09;
        const steps = 40;
        let d = `M${X(cx)},${Y(cy)}`;
        for (let i = 0; i <= steps; i++) { const th = a + ((b - a) * i) / steps; d += `L${X(cx + r * Math.cos(th)).toFixed(1)},${Y(cy + r * Math.sin(th)).toFixed(1)}`; }
        const mid = (a + b) / 2;
        anchors[it.id] = [X(cx + r * Math.cos(mid)), Y(cy + r * Math.sin(mid))];
        if (it.label) labels.push({ x: X(cx + r * 1.6 * Math.cos(mid)), y: Y(cy + r * 1.6 * Math.sin(mid)) + 4, text: fillTemplate(it.label, env), color, id: it.id, anchor: 'middle' });
        return <path key={it.id} d={d + 'Z'} fill={color} fillOpacity={0.16} stroke={color} strokeWidth={1.6} opacity={op} />;
      }
      case 'point': {
        const px = X(ev(it.x)), py = Y(ev(it.y));
        anchors[it.id] = [px, py];
        const draggable = !!(it.dragX || it.dragY);
        if (it.label) labels.push({ x: px + 10, y: py - 10, text: fillTemplate(it.label, env), color, id: it.id, anchor: 'start' });
        return (
          <g key={it.id} opacity={op}>
            {draggable && <circle cx={px} cy={py} r={22} fill={color} fillOpacity={0.16} />}
            <circle cx={px} cy={py} r={draggable ? 13 : 8} fill={draggable ? color : fx(`ball-${it.tone ?? 'primary'}`)} stroke="var(--surface)" strokeWidth={draggable ? 4 : 2.5} filter={fx('shadow')} />
            {draggable && (
              <circle
                cx={px} cy={py} r={30} fill="transparent" style={{ cursor: 'grab', touchAction: 'none' }}
                role="slider" aria-label={`Drag ${it.label ?? 'point'}`} tabIndex={0}
                onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); dragging.current = { x: it.dragX, y: it.dragY, at: [it.x, it.y] }; setDragActive(true); }}
              />
            )}
          </g>
        );
      }
      case 'icon': {
        const node = ICONS[it.name];
        if (!node) return null;
        const cx = X(ev(it.at[0])), cy = Y(ev(it.at[1]));
        const px = iconRaw(it) * iconScale;
        iconDiscs.push({ x0: cx - px * 0.56, x1: cx + px * 0.56, y0: cy - px * 0.56, y1: cy + px * 0.56 });
        const draggable = !!(it.dragX || it.dragY);
        anchors[it.id] = [cx, cy];
        if (it.label) labels.push({ x: cx, y: cy + px * 0.62 + 18, text: fillTemplate(it.label, env), color: 'var(--ink)', id: it.id, anchor: 'middle' });
        const k = (px * 0.62) / 24;
        return (
          <g key={it.id} opacity={op} className="pop-in">
            <circle cx={cx} cy={cy} r={px * 0.56} fill="var(--surface)" stroke="none" filter={fx('shadow')} />
            <circle cx={cx} cy={cy} r={px * 0.56} fill={color} fillOpacity={hot(it.id) ? 0.22 : 0.12} stroke={hot(it.id) ? color : 'none'} strokeWidth={1.5} />
            <g transform={`translate(${cx - 12 * k},${cy - 12 * k}) scale(${k})`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {node.map(([tag, attrs], i) => {
                const El = tag as 'path';
                return <El key={i} {...(attrs as Record<string, string>)} vectorEffect="non-scaling-stroke" style={{ strokeWidth: Math.max(1.6, Math.min(2.6, px / 26)) }} />;
              })}
            </g>
            {draggable && (
              <circle
                cx={cx} cy={cy} r={Math.max(24, px * 0.6)} fill="transparent" style={{ cursor: 'grab', touchAction: 'none' }}
                role="slider" aria-label={`Drag ${it.label ?? it.name}`} tabIndex={0}
                onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); dragging.current = { x: it.dragX, y: it.dragY, at: it.at }; setDragActive(true); }}
              />
            )}
          </g>
        );
      }
      case 'text': {
        anchors[it.id] = [X(ev(it.at[0])), Y(ev(it.at[1]))];
        labels.push({ x: X(ev(it.at[0])), y: Y(ev(it.at[1])), text: fillTemplate(it.text, env), color: it.tone ? color : 'var(--ink)', id: it.id, anchor: 'start' });
        return null;
      }
    }
  }
  function clampY(v: number) { return Math.max(y0 - (y1 - y0), Math.min(y1 + (y1 - y0), v)); }

  // Dragging a point: find the knob value whose point lands nearest the finger. Works for any expression
  // (cos(th), a*t, ...), not just points that sit directly on a knob.
  function onMove(e: React.PointerEvent) {
    const d = dragging.current;
    if (!d || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const wx = view.invX(e.clientX - r.left), wy = view.invY(e.clientY - r.top);
    const next: Record<string, number> = {};
    const local: Env = { ...env };
    for (const id of [d.x, d.y].filter(Boolean) as string[]) {
      const p = params.find((q) => q.id === id);
      if (!p) continue;
      const cost = (v: number) => {
        local[id] = v;
        const px = evaluate(d.at[0], local, NaN), py = evaluate(d.at[1], local, NaN);
        return (px - wx) ** 2 / (x1 - x0) ** 2 + (py - wy) ** 2 / (y1 - y0) ** 2;
      };
      let best = local[id], bestC = Infinity;
      for (let i = 0; i <= 240; i++) { const v = p.min + ((p.max - p.min) * i) / 240; const c = cost(v); if (c < bestC) { bestC = c; best = v; } }
      let span = (p.max - p.min) / 240;
      for (let k = 0; k < 20; k++) {
        for (const v of [best - span, best + span]) { if (v < p.min || v > p.max) continue; const c = cost(v); if (c < bestC) { bestC = c; best = v; } }
        span /= 2;
      }
      local[id] = best;
      next[id] = best;
    }
    if (Object.keys(next).length) onDrag(next);
  }

  const drawn = scene.items.map((it) => {
    const el = render(it);
    if (!onTap || !el) return el;
    return <g key={`tap-${it.id}`} onClick={() => onTap(it.id)} style={{ cursor: 'pointer' }}>{el}</g>;
  });
  // A generous invisible target at each item, so thin lines are easy to tap with a thumb.
  const tapTargets = onTap ? Object.entries(anchors).map(([id, [x, y]]) => (
    <circle key={`hit-${id}`} cx={x} cy={y} r={28} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => onTap(id)} role="button" aria-label={`Tap ${scene.items.find((i) => i.id === id)?.label ?? id}`} />
  )) : null;
  // Slide task on a draggable handle: a breathing ring, an arrow toward the goal, and a "drag" tag.
  const handles = guide ? scene.items.filter((it) => (it.type === 'point' || it.type === 'icon') && (it.dragX === guide.param || it.dragY === guide.param)) as Extract<G2Item, { type: 'point' | 'icon' }>[] : [];
  const guides = handles.map((it) => {
    const at = it.type === 'point' ? [it.x, it.y] as [Num, Num] : it.at;
    const p = params.find((q) => q.id === guide!.param);
    const now = env[guide!.param] ?? 0;
    const step = p ? (p.max - p.min) * 0.06 * Math.sign(guide!.target - now || 1) : 0;
    const x0 = X(ev(at[0])), y0 = Y(ev(at[1]));
    const x1 = X(evaluate(at[0], { ...env, [guide!.param]: now + step }, 0)), y1 = Y(evaluate(at[1], { ...env, [guide!.param]: now + step }, 0));
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    return { id: it.id, x: x0, y: y0, dx: (x1 - x0) / len, dy: (y1 - y0) / len };
  });
  const autoCallouts = { ...callouts };
  for (const g of guides) if (!Object.values(callouts).length) autoCallouts[g.id] = 'drag';
  const pins = Object.entries(autoCallouts).filter(([id]) => anchors[id]).map(([id, text]) => ({ id, text, at: anchors[id] }));
  const textIds = new Set(scene.items.filter((i) => i.type === 'text').map((i) => i.id));
  // Axis titles are fixed; seed them as taken space so item labels move around them.
  const reserved: Box[] = [];
  if (showAxes && scene.xLabel) { const w = textWidth(scene.xLabel) + 20; reserved.push({ x0: PAD.l + view.iw - w, x1: PAD.l + view.iw, y0: view.h - 22, y1: view.h }); }
  if (showAxes && scene.yLabel) { const w = textWidth(scene.yLabel) + 20; reserved.push({ x0: PAD.l, x1: PAD.l + w, y0: 0, y1: 20 }); }
  // A part with a callout this step shows the callout, not its everyday label as well.
  const placed = placeLabels(labels.filter((l) => !callouts[l.id] || scene.items.find((i) => i.id === l.id)?.type === 'text'), view.w, view.h, [...reserved, ...iconDiscs]);

  return (
    <div ref={box} className="absolute inset-0 select-none">
      {size.w > 0 && (
        <svg
          ref={svg} width={view.w} height={view.h} className="block"
          onPointerMove={onMove} onPointerUp={() => { dragging.current = null; setDragActive(false); }} onPointerCancel={() => { dragging.current = null; setDragActive(false); }}
          role="img" aria-label="Interactive graph"
        >
          <defs>
            <clipPath id={`plot-${uid}`}><rect x={PAD.l} y={PAD.t} width={view.iw} height={view.ih} /></clipPath>
            <filter id={`shadow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2.2" floodColor="#000" floodOpacity="0.16" />
            </filter>
            {(['primary', 'accent', 'warm', 'cool', 'green', 'red', 'neutral'] as const).map((t) => (
              <g key={t}>
                <linearGradient id={`grad-${t}-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tone(t)} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={tone(t)} stopOpacity={0.06} />
                </linearGradient>
                <radialGradient id={`ball-${t}-${uid}`} cx="35%" cy="30%" r="75%">
                  <stop offset="0%" stopColor="#fff" stopOpacity={0.55} />
                  <stop offset="35%" stopColor={tone(t)} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={tone(t)} stopOpacity={1} />
                </radialGradient>
              </g>
            ))}
          </defs>
          {/* A quiet dot grid: enough to read values, never louder than the content. */}
          {showAxes && xTicks.flatMap((vx) => yTicks.map((vy) => <circle key={`d${vx}-${vy}`} cx={X(vx)} cy={Y(vy)} r={1.3} fill="var(--axis)" opacity={0.55} />))}
          {showAxes && (
            <g stroke="var(--axis)" strokeWidth={1.4} strokeLinecap="round">
              <line x1={PAD.l} x2={PAD.l + view.iw} y1={Y(ay)} y2={Y(ay)} />
              <line y1={PAD.t} y2={PAD.t + view.ih} x1={X(ax)} x2={X(ax)} />
            </g>
          )}
          {showAxes && (
            <g fontSize={13} fill="var(--ink-2)" fontFamily="var(--font-sans)" fontWeight={500}>
              {xTicks.filter((v) => (Math.abs(v) > xs / 1000 || ax !== 0) && X(v) > PAD.l + 8 && X(v) < PAD.l + view.iw - 8).map((v) => <text key={`tx${v}`} x={X(v)} y={Math.min(view.h - 6, Y(ay) + 16)} textAnchor="middle">{tickLabel(v, xs, usePi)}</text>)}
              {yTicks.filter((v) => Math.abs(v) > ys / 1000 && Y(v) > PAD.t + 8 && Y(v) < PAD.t + view.ih - 8).map((v) => <text key={`ty${v}`} x={Math.max(PAD.l - 6, X(ax) - 6)} y={Y(v) + 4} textAnchor="end">{tickLabel(v, ys, false)}</text>)}
              {scene.xLabel && <text x={PAD.l + view.iw} y={view.h - 8} textAnchor="end" fill="var(--ink-2)" fontWeight={600}>{scene.xLabel} →</text>}
              {scene.yLabel && <text x={PAD.l} y={15} fill="var(--ink-2)" fontWeight={600}>↑ {scene.yLabel}</text>}
            </g>
          )}
          <g clipPath={`url(#plot-${uid})`}>{drawn}</g>
          {guides.map((g) => (
            <g key={`guide-${g.id}`} style={{ pointerEvents: 'none' }}>
              <circle className="pulse-ring" cx={g.x} cy={g.y} r={22} fill="none" stroke="var(--t-primary)" strokeWidth={3.5} />
              <g className="nudge" style={{ ['--nx' as string]: `${g.dx * 7}px`, ['--ny' as string]: `${g.dy * 7}px` }}>
                <path
                  d={`M${g.x + g.dx * 30},${g.y + g.dy * 30} L${g.x + g.dx * 60},${g.y + g.dy * 60}`}
                  stroke="var(--t-primary)" strokeWidth={4} strokeLinecap="round"
                />
                <Arrow x={g.x + g.dx * 66} y={g.y + g.dy * 66} angle={Math.atan2(g.dy, g.dx)} color="var(--t-primary)" size={14} />
              </g>
            </g>
          ))}
          {/* Rings mark the things you would tap (icons, points, shapes), not every line and arrow. */}
          {onTap && Object.entries(anchors).filter(([id]) => ['icon', 'point', 'polygon', 'circle'].includes(scene.items.find((i) => i.id === id)?.type ?? '')).map(([id, [x, y]]) => (
            <circle key={`tp-${id}`} className="pulse-ring" cx={x} cy={y} r={20} fill="none" stroke="var(--t-primary)" strokeWidth={3} style={{ pointerEvents: 'none' }} />
          ))}
          {tapTargets}
          <g fontFamily="var(--font-sans)" fontSize={LABEL_PX} fontWeight={650}>
            {placed.map((l, i) => (
              <text
                key={`${l.id}${i}`} x={l.x} y={l.y} textAnchor={l.anchor ?? 'start'} fill={l.color} opacity={textIds.has(l.id) ? 1 : Math.max(0.55, dim(l.id))}
                stroke="var(--surface)" strokeWidth={5} paintOrder="stroke" strokeLinejoin="round"
              >
                {l.text}
              </text>
            ))}
          </g>
          {pins.length > 0 && <Pins pins={pins} w={view.w} h={view.h} avoid={[...iconDiscs, ...placed.map((l) => ({ x0: l.x, x1: l.x + textWidth(l.text), y0: l.y - 16, y1: l.y + 5 }))]} />}
        </svg>
      )}
    </div>
  );
}

/** Callouts: short labels in a pill, pinned to their part with a leader line, kept apart and inside the frame. */
type Box = { x0: number; x1: number; y0: number; y1: number };

export function Pins({ pins, w, h, avoid = [] }: { pins: { id: string; text: string; at: [number, number] }[]; w: number; h: number; avoid?: Box[] }) {
  const placed: Box[] = [...avoid];
  return (
    <g fontFamily="var(--font-sans)" style={{ pointerEvents: 'none' }}>
      {pins.map((p) => {
        const tw = textWidth(p.text, 15) + 24, th = 32;
        // Try above, below, right, left of the anchor; take the first spot that is inside the frame and free.
        const tries: [number, number][] = [
          [p.at[0] - tw / 2, p.at[1] - 56], [p.at[0] - tw / 2, p.at[1] + 26], [p.at[0] + 22, p.at[1] - th / 2], [p.at[0] - tw - 22, p.at[1] - th / 2],
          [p.at[0] + 16, p.at[1] - 58], [p.at[0] - tw - 16, p.at[1] - 58], [p.at[0] + 16, p.at[1] + 28], [p.at[0] - tw - 16, p.at[1] + 28],
        ];
        let spot: [number, number] = tries[0];
        for (const [x, y] of tries) {
          const cx = Math.max(6, Math.min(w - tw - 6, x)), cy = Math.max(6, Math.min(h - th - 6, y));
          spot = [cx, cy];
          if (!placed.some((b) => cx < b.x1 && cx + tw > b.x0 && cy < b.y1 && cy + th > b.y0)) break;
        }
        placed.push({ x0: spot[0], x1: spot[0] + tw, y0: spot[1], y1: spot[1] + th });
        const lx = Math.max(spot[0] + 10, Math.min(spot[0] + tw - 10, p.at[0])), ly = spot[1] > p.at[1] ? spot[1] : spot[1] + th;
        return (
          <g key={p.id} className="pin">
            <line x1={p.at[0]} y1={p.at[1]} x2={lx} y2={ly} stroke="var(--ink)" strokeWidth={1.5} />
            <circle cx={p.at[0]} cy={p.at[1]} r={4} fill="var(--ink)" />
            <rect x={spot[0]} y={spot[1]} width={tw} height={th} rx={16} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.5} />
            <text x={spot[0] + tw / 2} y={spot[1] + 21} textAnchor="middle" fontSize={15} fontWeight={650} fill="var(--ink)">{p.text}</text>
          </g>
        );
      })}
    </g>
  );
}

/** Bounding box of everything drawn, sampled at each knob's default, min and max (t = 0), with a margin. */
function contentBounds(items: Item[], params: { id: string; min: number; max: number; value?: number }[], xr: [number, number], yr: [number, number]): [number, number, number, number] | null {
  const base: Env = { t: 0 };
  for (const p of params) base[p.id] = p.value ?? (p.min + p.max) / 2;
  // Frame the starting picture plus a moderate reach around it (a quarter of each knob's range either way), not every
  // extreme: framing for the largest possible shape left the starting one tiny with its labels piled on it.
  const reach = (p: { min: number; max: number }, v: number, d: number) => Math.min(p.max, Math.max(p.min, v + d * (p.max - p.min) * 0.25));
  const envs: Env[] = [base, ...params.flatMap((p) => [{ ...base, [p.id]: reach(p, base[p.id], -1) }, { ...base, [p.id]: reach(p, base[p.id], 1) }])];
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  // Only what sits inside (or near) the scene's own range counts: things parked far away are meant to be hidden.
  const sx = (xr[1] - xr[0]) * 0.15, sy = (yr[1] - yr[0]) * 0.15;
  const add = (x: number, y: number, r = 0) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < xr[0] - sx || x > xr[1] + sx || y < yr[0] - sy || y > yr[1] + sy) return;
    x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r);
  };
  for (const e of envs) {
    const v = (n: Num | undefined, fb = 0, extra?: Env) => evaluate(n, extra ? { ...e, ...extra } : e, fb);
    for (const it of items) {
      if ('show' in it && it.show !== undefined && !(v(it.show, 1) > 0)) continue;
      switch (it.type) {
        case 'point': add(v(it.x, NaN), v(it.y, NaN)); break;
        case 'text': add(v(it.at[0], NaN), v(it.at[1], NaN)); break;
        case 'icon': add(v(it.at[0], NaN), v(it.at[1], NaN), it.size !== undefined ? v(it.size, 0.5) * 0.6 : 0); break;
        case 'segment': add(v(it.from[0], NaN), v(it.from[1], NaN)); add(v(it.to[0], NaN), v(it.to[1], NaN)); break;
        case 'polygon': case 'polyline': it.points.forEach(([a, b]) => add(v(a, NaN), v(b, NaN))); break;
        case 'circle': add(v(it.center[0], NaN), v(it.center[1], NaN), Math.abs(v(it.r, 0))); break;
        case 'angle': add(v(it.at[0], NaN), v(it.at[1], NaN), it.r !== undefined ? Math.abs(v(it.r, 0)) : 0); break;
        case 'parametric': { const a = v(it.s[0], 0), b = v(it.s[1], 1); for (let i = 0; i <= 24; i++) { const sv = a + ((b - a) * i) / 24; add(v(it.x, NaN, { s: sv }), v(it.y, NaN, { s: sv })); } break; }
        case 'function': case 'area': for (let i = 0; i <= 24; i++) { const xv = xr[0] + ((xr[1] - xr[0]) * i) / 24; const yv = v(it.expr, NaN, { x: xv }); if (yv >= yr[0] && yv <= yr[1]) add(xv, yv); } break;
      }
    }
  }
  if (!(x1 > x0) && !(y1 > y0)) return null;
  // Never zoom in past a fifth of the model's own range; keep a margin for labels.
  const minW = (xr[1] - xr[0]) * 0.2, minH = (yr[1] - yr[0]) * 0.2;
  if (x1 - x0 < minW) { const c = (x0 + x1) / 2; x0 = c - minW / 2; x1 = c + minW / 2; }
  if (y1 - y0 < minH) { const c = (y0 + y1) / 2; y0 = c - minH / 2; y1 = c + minH / 2; }
  const mx = (x1 - x0) * 0.09, my = (y1 - y0) * 0.12;
  return [x0 - mx, x1 + mx, y0 - my, y1 + my];
}

type Label = { x: number; y: number; text: string; color: string; id: string; anchor?: 'start' | 'end' | 'middle' };

/** Rough text width at 13px: wide for CJK, narrow for Latin. Good enough to keep labels apart. */
const LABEL_PX = 15.5;
function textWidth(t: string, px = LABEL_PX): number {
  let w = 0;
  for (const ch of t) w += /[\u2E80-\uFFEF]/.test(ch) ? 13 : /[A-Z0-9]/.test(ch) ? 8.2 : 7;
  return (w * px) / 13;
}

/** Keep every label inside the frame and off the others: clamp to the edges, then nudge down (or up) past collisions. */


function placeLabels(labels: Label[], w: number, h: number, reserved: Box[] = []): Label[] {
  const boxes: Box[] = [...reserved];
  const out: Label[] = [];
  for (const l of labels) {
    const tw = textWidth(l.text);
    let x0 = l.anchor === 'end' ? l.x - tw : l.anchor === 'middle' ? l.x - tw / 2 : l.x;
    x0 = Math.max(4, Math.min(w - tw - 4, x0));
    let y = Math.max(14, Math.min(h - 6, l.y));
    const hit = (yy: number) => boxes.some((b) => x0 < b.x1 && x0 + tw > b.x0 && yy - 15 < b.y1 && yy + 4 > b.y0);
    for (let k = 0; k < 8 && hit(y); k++) {
      const down = y + 20 * (k + 1), up = y - 20 * (k + 1);
      if (!hit(down) && down < h - 6) { y = down; break; }
      if (!hit(up) && up > 17) { y = up; break; }
    }
    boxes.push({ x0, x1: x0 + tw, y0: y - 15, y1: y + 4 });
    out.push({ ...l, x: x0, y, anchor: 'start' });
  }
  return out;
}

function Arrow({ x, y, angle, color, size = 9 }: { x: number; y: number; angle: number; color: string; size?: number }) {
  const s = size;
  const a = angle + Math.PI - 0.45, b = angle + Math.PI + 0.45;
  return <path d={`M${x},${y}L${x + s * Math.cos(a)},${y + s * Math.sin(a)}L${x + s * Math.cos(b)},${y + s * Math.sin(b)}Z`} fill={color} />;
}
