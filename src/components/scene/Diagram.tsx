'use client';
// System diagram: parts as cards, connections as curves, what flows between them as moving dots.
// Laid out automatically (dagre); on a tall phone screen the flow runs top to bottom so the text stays readable.
import dagre from '@dagrejs/dagre';
import { useMemo } from 'react';
import { evaluate, formatNumber, type Env } from '@/lib/expr';
import type { Scene } from '@/lib/recipe';
import { Pins } from './Graph2D';
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
  const meta = new Map<string, { title: string[]; lines: string[]; h: number }>();
  for (const n of scene.nodes) {
    const title = wrap(n.label, 19).slice(0, 2);
    const lines = n.detail ? wrap(n.detail, 23) : [];
    const h = 26 + title.length * 18 + lines.length * 16 + (n.value !== undefined ? 20 : 0);
    meta.set(n.id, { title, lines, h });
    g.setNode(key.get(n.id)!, { width: NODE_W, height: h });
  }
  const edgesIn = scene.edges.filter((e) => key.has(e.from) && key.has(e.to));
  // Labelled links get room in the layout (dagre places the label), so text never sits on a card.
  const seenLabel = new Set<string>();
  edgesIn.forEach((e, i) => {
    const first = !!e.label && !seenLabel.has(e.label);
    if (e.label) seenLabel.add(e.label);
    g.setEdge(key.get(e.from)!, key.get(e.to)!, first ? { width: e.label!.length * 6.6 + 8, height: 16, labelpos: 'c' } : {}, `e${i}`);
  });
  dagre.layout(g);
  const gw = g.graph().width ?? 1, gh = g.graph().height ?? 1;
  const nodes = scene.nodes.map((n) => ({ ...n, ...(g.node(key.get(n.id)!) as { x: number; y: number; width: number; height: number }), ...meta.get(n.id)! }));
  const edges = edgesIn.map((e, i) => {
    const ge = g.edge({ v: key.get(e.from)!, w: key.get(e.to)!, name: `e${i}` }) as { points: { x: number; y: number }[]; x?: number; y?: number } | undefined;
    return { ...e, key: e.id ?? `${e.from}->${e.to}`, pts: ge?.points ?? [], lx: ge?.x, ly: ge?.y };
  });
  return { nodes, edges, gw, gh };
}

export default function Diagram({ scene, env, focus, t, playing, callouts = {}, onTap }: { scene: D; env: Env; focus: string[]; t: number; playing: boolean; callouts?: Record<string, string>; onTap?: (id: string) => void }) {
  const [box, size] = useSize<HTMLDivElement>();
  const both = useMemo(() => ({ LR: layoutFor(scene, 'LR'), TB: layoutFor(scene, 'TB') }), [scene]);
  // Text never shrinks below ~72%: past that the diagram scrolls. Pick the direction that fits without scrolling,
  // else one that only scrolls vertically (natural on a phone), else the one with the least to scroll.
  const MIN = 0.72;
  const fit = (l: Layout) => (size.w ? Math.min(1.2, size.w / l.gw, size.h / l.gh) : 1);
  const pref = scene.direction ?? 'LR';
  const other = pref === 'LR' ? 'TB' : 'LR';
  const score = (l: Layout) => {
    const f = fit(l);
    if (f >= MIN) return 3 + f;
    if (l.gw * MIN <= size.w) return 2 - (l.gh * MIN) / 1e5;
    return 1 - (l.gw * l.gh * MIN * MIN) / 1e8;
  };
  const dir: 'LR' | 'TB' = score(both[other]) > score(both[pref]) + 0.05 ? other : pref;
  const layout = both[dir];
  const scale = Math.max(fit(layout), MIN);
  const contentW = Math.max(size.w, layout.gw * scale), contentH = Math.max(size.h, layout.gh * scale);
  const ox = (contentW - layout.gw * scale) / 2, oy = (contentH - layout.gh * scale) / 2;
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.3 : 1);

  return (
    <div ref={box} className="no-scrollbar absolute inset-0 select-none overflow-auto overscroll-contain">
      {size.w > 0 && (
        <svg width={contentW} height={contentH} className="block" role="img" aria-label="Diagram">
          <g transform={`translate(${ox},${oy}) scale(${scale})`} fontFamily="var(--font-sans)">
            {layout.edges.map((e, ei) => {
              // The same label on many links ("risk loads here" twelve times) is noise: show it on the first only.
              const showLabel = !!e.label && layout.edges.findIndex((x) => x.label === e.label) === ei;
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
                  {showLabel && (
                    <text x={e.lx ?? mid.x} y={(e.ly ?? mid.y) + 4} textAnchor="middle" fontSize={12} fill="var(--ink-2)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
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
                <g key={n.id} opacity={dim(n.id)} onClick={onTap ? () => onTap(n.id) : undefined} style={onTap ? { cursor: 'pointer' } : undefined} role={onTap ? 'button' : undefined} aria-label={onTap ? `Tap ${n.label}` : undefined}>
                  <rect x={x} y={y} width={n.width} height={n.height} rx={12} fill="var(--surface)" stroke={hot ? color : 'var(--line-2)'} strokeWidth={hot ? 2.4 : 1.2} />
                  <rect x={x} y={y + 12} width={4} height={n.height - 24} rx={2} fill={color} />
                  {n.title.map((l, i) => <text key={`t${i}`} x={x + 16} y={y + 26 + i * 18} fontSize={14.5} fontWeight={650} fill="var(--ink)">{l}</text>)}
                  {n.lines.map((l, i) => <text key={i} x={x + 16} y={y + 26 + n.title.length * 18 + i * 16} fontSize={12.5} fill="var(--ink-2)">{l}</text>)}
                  {Number.isFinite(v) && (
                    <text x={x + 16} y={y + n.height - 12} fontSize={13} fontWeight={650} fill={color}>
                      {formatNumber(v)}{n.unit ? ` ${n.unit}` : ''}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
          <Pins
            w={contentW} h={contentH}
            pins={layout.nodes.filter((n) => callouts[n.id]).map((n) => ({ id: n.id, text: callouts[n.id], at: [ox + n.x * scale, oy + (n.y - n.height / 2) * scale] as [number, number] }))}
          />
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
  // Calm, readable motion: a few dots at walking pace, faster only as more flows.
  const count = 2 + Math.round(flow * 2);
  const speed = 16 + flow * 46; // px per second
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
