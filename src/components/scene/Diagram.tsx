'use client';
// System diagram: parts as cards, connections as curves, what flows between them as moving dots.
// Laid out automatically (dagre); on a tall phone screen the flow runs top to bottom so the text stays readable.
import dagre from '@dagrejs/dagre';
import { useMemo } from 'react';
import { evaluate, formatNumber, type Env } from '@/lib/expr';
import type { Scene } from '@/lib/recipe';
import { tone, useSize } from './runtime';

type D = Extract<Scene, { type: 'diagram' }>;

const NODE_W = 176;

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

type Layout = ReturnType<typeof layoutFor>;

function layoutFor(scene: D, dir: 'LR' | 'TB') {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: dir, nodesep: dir === 'TB' ? 26 : 34, ranksep: dir === 'TB' ? 46 : 70, marginx: 12, marginy: 12 });
  g.setDefaultEdgeLabel(() => ({}));
  // dagre keeps nodes in a plain object, so ids like "constructor" break it. It only ever sees n0..nN.
  const key = new Map(scene.nodes.map((n, i) => [n.id, `n${i}`]));
  const meta = new Map<string, { lines: string[]; h: number }>();
  for (const n of scene.nodes) {
    const lines = n.detail ? wrap(n.detail, 26) : [];
    const h = 44 + lines.length * 16 + (n.value !== undefined ? 20 : 0);
    meta.set(n.id, { lines, h });
    g.setNode(key.get(n.id)!, { width: NODE_W, height: h });
  }
  const edgesIn = scene.edges.filter((e) => key.has(e.from) && key.has(e.to));
  edgesIn.forEach((e, i) => g.setEdge(key.get(e.from)!, key.get(e.to)!, {}, `e${i}`));
  dagre.layout(g);
  const gw = g.graph().width ?? 1, gh = g.graph().height ?? 1;
  const nodes = scene.nodes.map((n) => ({ ...n, ...(g.node(key.get(n.id)!) as { x: number; y: number; width: number; height: number }), ...meta.get(n.id)! }));
  const edges = edgesIn.map((e, i) => {
    const pts = (g.edge({ v: key.get(e.from)!, w: key.get(e.to)!, name: `e${i}` }) as { points: { x: number; y: number }[] } | undefined)?.points ?? [];
    return { ...e, key: e.id ?? `${e.from}->${e.to}`, pts };
  });
  return { nodes, edges, gw, gh };
}

export default function Diagram({ scene, env, focus, t, playing }: { scene: D; env: Env; focus: string[]; t: number; playing: boolean }) {
  const [box, size] = useSize<HTMLDivElement>();
  const both = useMemo(() => ({ LR: layoutFor(scene, 'LR'), TB: layoutFor(scene, 'TB') }), [scene]);
  // Use whichever direction lets the text be biggest in this frame. Below a readable size, scroll instead of shrinking.
  const fit = (l: Layout) => (size.w ? Math.min(1.2, size.w / l.gw, size.h / l.gh) : 1);
  const pref = scene.direction ?? 'LR';
  const other = pref === 'LR' ? 'TB' : 'LR';
  const dir: 'LR' | 'TB' = fit(both[other]) > fit(both[pref]) * 1.15 ? other : pref;
  const layout = both[dir];
  const MIN = 0.72;
  const scale = Math.max(fit(layout), Math.min(MIN, size.w / layout.gw));
  const contentW = Math.max(size.w, layout.gw * scale), contentH = Math.max(size.h, layout.gh * scale);
  const ox = (contentW - layout.gw * scale) / 2, oy = (contentH - layout.gh * scale) / 2;
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.3 : 1);

  return (
    <div ref={box} className="no-scrollbar absolute inset-0 select-none overflow-auto overscroll-contain">
      {size.w > 0 && (
        <svg width={contentW} height={contentH} className="block" role="img" aria-label="Diagram">
          <g transform={`translate(${ox},${oy}) scale(${scale})`} fontFamily="var(--font-sans)">
            {layout.edges.map((e) => {
              if (e.pts.length < 2) return null;
              const d = smooth(e.pts);
              const flow = Math.max(0, Math.min(1, evaluate(e.flow, env, 0)));
              const op = Math.min(dim(e.key), Math.max(dim(e.from), dim(e.to)) > 0.5 && focus.length && !focus.includes(e.key) ? 0.5 : 1);
              const end = e.pts[e.pts.length - 1], pre = e.pts[e.pts.length - 2];
              const ang = Math.atan2(end.y - pre.y, end.x - pre.x);
              const mid = e.pts[Math.floor(e.pts.length / 2)];
              return (
                <g key={e.key} opacity={op}>
                  <path id={`p-${cssId(e.key)}`} d={d} fill="none" stroke="var(--line-2)" strokeWidth={2} />
                  <path d={`M${end.x},${end.y}l${-9 * Math.cos(ang - 0.42)},${-9 * Math.sin(ang - 0.42)}M${end.x},${end.y}l${-9 * Math.cos(ang + 0.42)},${-9 * Math.sin(ang + 0.42)}`} stroke="var(--ink-3)" strokeWidth={2} strokeLinecap="round" />
                  {flow > 0 && <FlowDots d={d} flow={flow} t={t} playing={playing} color={tone(scene.nodes.find((n) => n.id === e.from)?.tone)} />}
                  {e.label && (
                    <text x={mid.x + (dir === 'TB' ? 10 : 0)} y={mid.y - (dir === 'TB' ? 0 : 8)} textAnchor={dir === 'TB' ? 'start' : 'middle'} fontSize={12} fill="var(--ink-2)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}
            {layout.nodes.map((n) => {
              const color = tone(n.tone);
              const hot = focus.includes(n.id);
              const x = n.x - n.width / 2, y = n.y - n.height / 2;
              const v = n.value !== undefined ? evaluate(n.value, env, NaN) : NaN;
              return (
                <g key={n.id} opacity={dim(n.id)}>
                  <rect x={x} y={y} width={n.width} height={n.height} rx={12} fill="var(--surface)" stroke={hot ? color : 'var(--line-2)'} strokeWidth={hot ? 2.4 : 1.2} />
                  <rect x={x} y={y + 12} width={4} height={n.height - 24} rx={2} fill={color} />
                  <text x={x + 16} y={y + 26} fontSize={14.5} fontWeight={650} fill="var(--ink)">{n.label}</text>
                  {n.lines.map((l, i) => <text key={i} x={x + 16} y={y + 44 + i * 16} fontSize={12.5} fill="var(--ink-2)">{l}</text>)}
                  {Number.isFinite(v) && (
                    <text x={x + 16} y={y + n.height - 12} fontSize={13} fontWeight={650} fill={color}>
                      {formatNumber(v)}{n.unit ? ` ${n.unit}` : ''}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      )}
    </div>
  );
}

function cssId(s: string) { return s.replace(/[^A-Za-z0-9_-]/g, '_'); }

function smooth(p: { x: number; y: number }[]): string {
  if (p.length < 3) return `M${p[0].x},${p[0].y}L${p[p.length - 1].x},${p[p.length - 1].y}`;
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i].x + p[i + 1].x) / 2, my = (p[i].y + p[i + 1].y) / 2;
    d += `Q${p[i].x},${p[i].y} ${mx},${my}`;
  }
  const last = p[p.length - 1];
  return d + `L${last.x},${last.y}`;
}

/** Dots travelling along the connection; more flow means more, faster dots. Still under reduced motion. */
function FlowDots({ d, flow, t, playing, color }: { d: string; flow: number; t: number; playing: boolean; color: string }) {
  const path = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', d);
    return el;
  }, [d]);
  if (!path) return null;
  const len = path.getTotalLength();
  const count = 2 + Math.round(flow * 3);
  const speed = 40 + flow * 140; // px per second
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const s = ((playing ? t * speed : 0) + (i * len) / count) % len;
        const pt = path.getPointAtLength(s);
        return <circle key={i} cx={pt.x} cy={pt.y} r={3.6} fill={color} />;
      })}
    </g>
  );
}
