'use client';
// Network template: layers of nodes joined by weighted links (a neuron, a small neural network). Layout is ours:
// even columns, nodes never overlap, labels sit under their node. A link's width follows |weight| and its colour the
// sign, so "this input counts more" is seen before it is read. Node values light the node from pale to full.
import { evaluate, formatNumber, type Env } from '@/lib/expr';
import type { Scene } from '@/lib/recipe';
import { Pins } from './Graph2D';
import { Glyph } from './glyph';
import { tone, useSize } from './runtime';

type N = Extract<Scene, { type: 'network' }>;

export default function Network({ scene, env, focus, callouts = {}, onTap }: { scene: N; env: Env; focus: string[]; callouts?: Record<string, string>; onTap?: (id: string) => void }) {
  const [box, size] = useSize<HTMLDivElement>();
  const { w, h } = size;
  const top = scene.caption ? 44 : 16, bottom = 16;
  const cols = scene.layers.length;
  const most = Math.max(...scene.layers.map((l) => l.length));
  // Node size: as big as the tighter of the column gap and the row gap allows, within reason.
  const r = Math.max(16, Math.min(34, (w / cols) * 0.22, (h - top - bottom) / (most * 2 + 1.6) * 0.62));
  const pos: Record<string, [number, number]> = {};
  scene.layers.forEach((layer, ci) => {
    const x = w * ((ci + 0.5) / cols);
    const gap = (h - top - bottom) / layer.length;
    layer.forEach((n, ri) => { pos[n.id] = [x, top + gap * (ri + 0.5) - 8]; });
  });
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.4 : 1);
  const nodes = scene.layers.flat();
  return (
    <div ref={box} className="absolute inset-0 select-none">
      {w > 0 && (
        <svg width={w} height={h} className="block" role="img" aria-label={scene.caption ?? 'Network'}>
          {scene.caption && <text x={w / 2} y={26} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--ink-2)" fontFamily="var(--font-sans)">{scene.caption}</text>}
          {scene.links.map((l, i) => {
            const a = pos[l.from], b = pos[l.to];
            if (!a || !b) return null;
            const wt = evaluate(l.weight, env, 0);
            const width = 1.5 + 7 * Math.min(1, Math.abs(wt) / 2);
            const id = `${l.from}->${l.to}`;
            const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
            return (
              <g key={i} opacity={dim(id) * (Math.abs(wt) < 0.02 ? 0.35 : 1)} onClick={onTap ? () => onTap(id) : undefined} style={onTap ? { cursor: 'pointer' } : undefined}>
                <line x1={a[0] + r} y1={a[1]} x2={b[0] - r} y2={b[1]} stroke={wt < 0 ? 'var(--t-red)' : 'var(--t-primary)'} strokeWidth={width} strokeLinecap="round" opacity={0.85} />
                {onTap && <line x1={a[0] + r} y1={a[1]} x2={b[0] - r} y2={b[1]} stroke="transparent" strokeWidth={40} />}
                {(l.label || scene.links.length <= 8) && (
                  <text x={mx} y={my - 8} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--ink)" stroke="var(--paper)" strokeWidth={4} paintOrder="stroke" fontFamily="var(--font-sans)">
                    {l.label ? `${l.label} ` : ''}{formatNumber(wt)}
                  </text>
                )}
              </g>
            );
          })}
          {nodes.map((n) => {
            const [x, y] = pos[n.id];
            const val = n.value !== undefined ? evaluate(n.value, env, 0) : undefined;
            const lit = val === undefined ? 0.18 : 0.12 + 0.88 * Math.max(0, Math.min(1, val));
            const c = tone(n.tone);
            return (
              <g key={n.id} opacity={dim(n.id)} onClick={onTap ? () => onTap(n.id) : undefined} style={onTap ? { cursor: 'pointer' } : undefined}>
                <circle cx={x} cy={y} r={r} fill="var(--surface)" stroke={c} strokeWidth={2.5} />
                <circle cx={x} cy={y} r={r - 2} fill={c} fillOpacity={lit} />
                {n.icon ? <Glyph name={n.icon} cx={x} cy={y} size={r * 1.3} color={lit > 0.6 ? 'var(--surface)' : c} />
                  : val !== undefined && <text x={x} y={y + 6} textAnchor="middle" fontSize={Math.max(13, r * 0.55)} fontWeight={800} fill={lit > 0.55 ? 'var(--surface)' : 'var(--ink)'} fontFamily="var(--font-sans)">{formatNumber(val)}</text>}
                <text x={x} y={y + r + 20} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--ink)" fontFamily="var(--font-sans)">{n.label}</text>
                {n.icon && val !== undefined && <text x={x} y={y + r + 40} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--ink-2)" fontFamily="var(--font-sans)">{formatNumber(val)}</text>}
                {onTap && <circle className="pulse-ring" cx={x} cy={y} r={r + 6} fill="none" stroke="var(--t-primary)" strokeWidth={3} style={{ pointerEvents: 'none' }} />}
              </g>
            );
          })}
          <Pins w={w} h={h} pins={Object.entries(callouts).filter(([id]) => pos[id]).map(([id, text]) => ({ id, text, at: [pos[id][0], pos[id][1] - r] as [number, number] }))} />
        </svg>
      )}
    </div>
  );
}
