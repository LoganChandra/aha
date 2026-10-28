'use client';
// 2D graph renderer: curves, points you can drag, shapes, shaded areas, angles and live labels, in SVG.
import { useMemo, useRef } from 'react';
import { evaluate, fillTemplate, type Env } from '@/lib/expr';
import type { G2Item, Scene } from '@/lib/recipe';
import { tone, useSize } from './runtime';

type G2 = Extract<Scene, { type: 'graph2d' }>;
type Num = number | string;
/** Internal only: line-chart series are drawn as polylines on the same axes. */
export type Polyline = { type: 'polyline'; id: string; points: [Num, Num][]; label?: string; tone?: string };
type Item = G2Item | Polyline;

type Props = {
  scene: Omit<G2, 'items'> & { items: Item[] };
  env: Env;
  focus: string[];
  params: { id: string; min: number; max: number }[];
  onDrag: (values: Record<string, number>) => void;
  callouts?: Record<string, string>;
  onTap?: (id: string) => void;
};

const PAD = { l: 34, r: 14, t: 14, b: 26 };

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

export default function Graph2D({ scene, env, focus, params, onDrag, callouts = {}, onTap }: Props) {
  const [box, size] = useSize<HTMLDivElement>();
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef<{ x?: string; y?: string; item: Extract<G2Item, { type: 'point' }> } | null>(null);

  const view = useMemo(() => {
    const w = Math.max(10, size.w), h = Math.max(10, size.h);
    const iw = w - PAD.l - PAD.r, ih = h - PAD.t - PAD.b;
    let [x0, x1] = scene.x, [y0, y1] = scene.y;
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
  }, [size, scene.x, scene.y, scene.equal]);

  const { X, Y, x0, x1, y0, y1 } = view;
  const ev = (v: Num | undefined, fb = 0, extra?: Env) => evaluate(v, extra ? { ...env, ...extra } : env, fb);
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.35 : 1);
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
  const showAxes = scene.axes !== false;
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
  const labels: Label[] = [];
  // Where each item sits on screen: callouts pin here and tap targets centre here.
  const anchors: Record<string, [number, number]> = {};

  function render(it: Item) {
    const color = tone(it.tone);
    const width = hot(it.id) ? 3.2 : 2.2;
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
        return <path key={it.id} d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={it.dashed ? '6 5' : undefined} strokeLinecap="round" strokeLinejoin="round" opacity={op} />;
      }
      case 'parametric': {
        const a = ev(it.s[0], 0), b = ev(it.s[1], 1);
        const d = curve((s) => [ev(it.x, NaN, { s }), ev(it.y, NaN, { s })], a, b, n);
        { const sm = (a + b) / 2; anchors[it.id] = [X(ev(it.x, 0, { s: sm })), Y(ev(it.y, 0, { s: sm }))]; }
        return <path key={it.id} d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={it.dashed ? '6 5' : undefined} strokeLinecap="round" strokeLinejoin="round" opacity={op} />;
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
        return <path key={it.id} d={d + 'Z'} fill={color} fillOpacity={hot(it.id) ? 0.3 : 0.18} stroke="none" opacity={op} />;
      }
      case 'segment': {
        const ax_ = X(ev(it.from[0])), ay_ = Y(ev(it.from[1])), bx = X(ev(it.to[0])), by = Y(ev(it.to[1]));
        anchors[it.id] = [(ax_ + bx) / 2, (ay_ + by) / 2];
        if (it.label) labels.push({ x: (ax_ + bx) / 2 + 6, y: (ay_ + by) / 2 - 6, text: fillTemplate(it.label, env), color, id: it.id, anchor: 'start' });
        return (
          <g key={it.id} opacity={op}>
            <line x1={ax_} y1={ay_} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeDasharray={it.dashed ? '6 5' : undefined} strokeLinecap="round" />
            {it.arrow && <Arrow x={bx} y={by} angle={Math.atan2(by - ay_, bx - ax_)} color={color} />}
          </g>
        );
      }
      case 'circle': {
        const cx = X(ev(it.center[0])), cy = Y(ev(it.center[1]));
        const r = Math.abs(X(ev(it.center[0]) + ev(it.r, 1)) - cx);
        const ry = Math.abs(Y(ev(it.center[1]) + ev(it.r, 1)) - cy);
        anchors[it.id] = [cx, cy - ry];
        if (it.label) labels.push({ x: cx, y: cy - ry - 8, text: fillTemplate(it.label, env), color, id: it.id, anchor: 'middle' });
        return <ellipse key={it.id} cx={cx} cy={cy} rx={r} ry={ry} fill={it.fill ? color : 'none'} fillOpacity={0.12} stroke={color} strokeWidth={width * 0.8} opacity={op} />;
      }
      case 'polygon': {
        const pts = it.points.map(([a, b]) => [X(ev(a)), Y(ev(b))]);
        anchors[it.id] = [pts.reduce((q, p) => q + p[0], 0) / pts.length, pts.reduce((q, p) => q + p[1], 0) / pts.length];
        if (it.label) {
          const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]);
          labels.push({ x: c[0], y: c[1] + 4, text: fillTemplate(it.label, env), color, id: it.id, anchor: 'middle' });
        }
        return <polygon key={it.id} points={pts.map((p) => p.join(',')).join(' ')} fill={color} fillOpacity={hot(it.id) ? 0.22 : 0.12} stroke={color} strokeWidth={width * 0.8} strokeLinejoin="round" opacity={op} />;
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
            {draggable && <circle cx={px} cy={py} r={13} fill={color} fillOpacity={0.14} />}
            <circle cx={px} cy={py} r={draggable ? 7 : 5} fill={draggable ? 'var(--surface)' : color} stroke={color} strokeWidth={draggable ? 3 : 0} />
            {draggable && (
              <circle
                cx={px} cy={py} r={24} fill="transparent" style={{ cursor: 'grab', touchAction: 'none' }}
                role="slider" aria-label={`Drag ${it.label ?? 'point'}`} tabIndex={0}
                onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); dragging.current = { x: it.dragX, y: it.dragY, item: it }; }}
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
        const px = evaluate(d.item.x, local, NaN), py = evaluate(d.item.y, local, NaN);
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
    <circle key={`hit-${id}`} cx={x} cy={y} r={22} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => onTap(id)} role="button" aria-label={`Tap ${scene.items.find((i) => i.id === id)?.label ?? id}`} />
  )) : null;
  const pins = Object.entries(callouts).filter(([id]) => anchors[id]).map(([id, text]) => ({ id, text, at: anchors[id] }));
  const textIds = new Set(scene.items.filter((i) => i.type === 'text').map((i) => i.id));
  // Axis titles are fixed; seed them as taken space so item labels move around them.
  const reserved: Box[] = [];
  if (showAxes && scene.xLabel) { const w = textWidth(scene.xLabel); reserved.push({ x0: PAD.l + view.iw - w, x1: PAD.l + view.iw, y0: Y(ay) - 20, y1: Y(ay) - 4 }); }
  if (showAxes && scene.yLabel) { const w = textWidth(scene.yLabel); reserved.push({ x0: X(ax) + 8, x1: X(ax) + 8 + w, y0: PAD.t, y1: PAD.t + 16 }); }
  const placed = placeLabels(labels, view.w, view.h, reserved);

  return (
    <div ref={box} className="absolute inset-0 select-none">
      {size.w > 0 && (
        <svg
          ref={svg} width={view.w} height={view.h} className="block"
          onPointerMove={onMove} onPointerUp={() => (dragging.current = null)} onPointerCancel={() => (dragging.current = null)}
          role="img" aria-label="Interactive graph"
        >
          <defs>
            <clipPath id="plot"><rect x={PAD.l} y={PAD.t} width={view.iw} height={view.ih} /></clipPath>
          </defs>
          {showAxes && xTicks.map((v) => <line key={`gx${v}`} x1={X(v)} x2={X(v)} y1={PAD.t} y2={PAD.t + view.ih} stroke="var(--grid)" />)}
          {showAxes && yTicks.map((v) => <line key={`gy${v}`} y1={Y(v)} y2={Y(v)} x1={PAD.l} x2={PAD.l + view.iw} stroke="var(--grid)" />)}
          {showAxes && (
            <g stroke="var(--axis)" strokeWidth={1.2}>
              <line x1={PAD.l} x2={PAD.l + view.iw} y1={Y(ay)} y2={Y(ay)} />
              <line y1={PAD.t} y2={PAD.t + view.ih} x1={X(ax)} x2={X(ax)} />
            </g>
          )}
          {showAxes && (
            <g fontSize={11.5} fill="var(--ink-2)" fontFamily="var(--font-sans)" fontWeight={500}>
              {xTicks.filter((v) => (Math.abs(v) > xs / 1000 || ax !== 0) && X(v) > PAD.l + 8 && X(v) < PAD.l + view.iw - 8).map((v) => <text key={`tx${v}`} x={X(v)} y={Math.min(view.h - 6, Y(ay) + 16)} textAnchor="middle">{tickLabel(v, xs, usePi)}</text>)}
              {yTicks.filter((v) => Math.abs(v) > ys / 1000 && Y(v) > PAD.t + 8 && Y(v) < PAD.t + view.ih - 8).map((v) => <text key={`ty${v}`} x={Math.max(PAD.l - 6, X(ax) - 6)} y={Y(v) + 4} textAnchor="end">{tickLabel(v, ys, false)}</text>)}
              {scene.xLabel && <text x={PAD.l + view.iw} y={Y(ay) - 8} textAnchor="end" fill="var(--ink-2)" fontWeight={500}>{scene.xLabel}</text>}
              {scene.yLabel && <text x={X(ax) + 8} y={PAD.t + 12} fill="var(--ink-2)" fontWeight={500}>{scene.yLabel}</text>}
            </g>
          )}
          <g clipPath="url(#plot)">{drawn}</g>
          {tapTargets}
          <g fontFamily="var(--font-sans)" fontSize={13} fontWeight={600}>
            {placed.map((l, i) => (
              <text
                key={`${l.id}${i}`} x={l.x} y={l.y} textAnchor={l.anchor ?? 'start'} fill={l.color} opacity={textIds.has(l.id) ? 1 : Math.max(0.55, dim(l.id))}
                stroke="var(--surface)" strokeWidth={4} paintOrder="stroke" strokeLinejoin="round"
              >
                {l.text}
              </text>
            ))}
          </g>
          {pins.length > 0 && <Pins pins={pins} w={view.w} h={view.h} />}
        </svg>
      )}
    </div>
  );
}

/** Callouts: short labels in a pill, pinned to their part with a leader line, kept apart and inside the frame. */
export function Pins({ pins, w, h }: { pins: { id: string; text: string; at: [number, number] }[]; w: number; h: number }) {
  const placed: Box[] = [];
  return (
    <g fontFamily="var(--font-sans)" style={{ pointerEvents: 'none' }}>
      {pins.map((p) => {
        const tw = textWidth(p.text) * 0.98 + 18, th = 26;
        // Try above, below, right, left of the anchor; take the first spot that is inside the frame and free.
        const tries: [number, number][] = [[p.at[0] - tw / 2, p.at[1] - 46], [p.at[0] - tw / 2, p.at[1] + 22], [p.at[0] + 18, p.at[1] - th / 2], [p.at[0] - tw - 18, p.at[1] - th / 2]];
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
            <line x1={p.at[0]} y1={p.at[1]} x2={lx} y2={ly} stroke="var(--ink)" strokeWidth={1.2} opacity={0.55} />
            <circle cx={p.at[0]} cy={p.at[1]} r={3.5} fill="var(--ink)" />
            <rect x={spot[0]} y={spot[1]} width={tw} height={th} rx={13} fill="var(--ink)" />
            <text x={spot[0] + tw / 2} y={spot[1] + 17.5} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--paper)">{p.text}</text>
          </g>
        );
      })}
    </g>
  );
}

type Label = { x: number; y: number; text: string; color: string; id: string; anchor?: 'start' | 'end' | 'middle' };

/** Rough text width at 13px: wide for CJK, narrow for Latin. Good enough to keep labels apart. */
function textWidth(t: string): number {
  let w = 0;
  for (const ch of t) w += /[\u2E80-\uFFEF]/.test(ch) ? 13 : /[A-Z0-9]/.test(ch) ? 8.2 : 7;
  return w;
}

/** Keep every label inside the frame and off the others: clamp to the edges, then nudge down (or up) past collisions. */
type Box = { x0: number; x1: number; y0: number; y1: number };

function placeLabels(labels: Label[], w: number, h: number, reserved: Box[] = []): Label[] {
  const boxes: Box[] = [...reserved];
  const out: Label[] = [];
  for (const l of labels) {
    const tw = textWidth(l.text);
    let x0 = l.anchor === 'end' ? l.x - tw : l.anchor === 'middle' ? l.x - tw / 2 : l.x;
    x0 = Math.max(4, Math.min(w - tw - 4, x0));
    let y = Math.max(14, Math.min(h - 6, l.y));
    const hit = (yy: number) => boxes.some((b) => x0 < b.x1 && x0 + tw > b.x0 && yy - 12 < b.y1 && yy + 3 > b.y0);
    for (let k = 0; k < 8 && hit(y); k++) {
      const down = y + 16 * (k + 1), up = y - 16 * (k + 1);
      if (!hit(down) && down < h - 6) { y = down; break; }
      if (!hit(up) && up > 14) { y = up; break; }
    }
    boxes.push({ x0, x1: x0 + tw, y0: y - 12, y1: y + 3 });
    out.push({ ...l, x: x0, y, anchor: 'start' });
  }
  return out;
}

function Arrow({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  const s = 9;
  const a = angle + Math.PI - 0.45, b = angle + Math.PI + 0.45;
  return <path d={`M${x},${y}L${x + s * Math.cos(a)},${y + s * Math.sin(a)}L${x + s * Math.cos(b)},${y + s * Math.sin(b)}Z`} fill={color} />;
}
