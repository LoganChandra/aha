'use client';
// Balance template: two pans on a beam that tips toward the heavier side. The tilt follows the weights (which glide
// with the knobs), so equal sides settle level and a difference is felt before it is read.
import { evaluate, formatNumber, type Env } from '@/lib/expr';
import type { Scene } from '@/lib/recipe';
import { Pins } from './Graph2D';
import { Glyph } from './glyph';
import { tone, useSize } from './runtime';

type B = Extract<Scene, { type: 'balance' }>;

export default function Balance({ scene, env, focus, callouts = {}, onTap }: { scene: B; env: Env; focus: string[]; callouts?: Record<string, string>; onTap?: (id: string) => void }) {
  const [box, size] = useSize<HTMLDivElement>();
  const { w, h } = size;
  const L = Math.max(0, evaluate(scene.left.weight, env, 0)), R = Math.max(0, evaluate(scene.right.weight, env, 0));
  const tilt = Math.max(-0.38, Math.min(0.38, ((R - L) / Math.max(1e-6, L + R)) * 0.6)); // radians, right side down when heavier
  const cx = w / 2, pivotY = h * 0.38;
  const half = Math.min(w * 0.36, 230);
  const ends = [-1, 1].map((sgn) => [cx + sgn * half * Math.cos(tilt), pivotY + sgn * half * Math.sin(tilt)]);
  const pan = Math.min(120, w * 0.26);
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.45 : 1);
  const anchors: Record<string, [number, number]> = {};
  const sides = [{ s: scene.left, v: L, e: ends[0] }, { s: scene.right, v: R, e: ends[1] }];
  return (
    <div ref={box} className="absolute inset-0 select-none">
      {w > 0 && (
        <svg width={w} height={h} className="block" role="img" aria-label="Balance">
          {/* stand */}
          <path d={`M${cx},${pivotY} L${cx - 34},${h * 0.86} L${cx + 34},${h * 0.86} Z`} fill="var(--line-2)" />
          <rect x={cx - 70} y={h * 0.86} width={140} height={10} rx={5} fill="var(--line-2)" />
          {/* beam */}
          <line x1={ends[0][0]} y1={ends[0][1]} x2={ends[1][0]} y2={ends[1][1]} stroke="var(--ink-2)" strokeWidth={8} strokeLinecap="round" />
          <circle cx={cx} cy={pivotY} r={9} fill="var(--ink)" />
          {sides.map(({ s, v, e }) => {
            const py = e[1] + 70;
            anchors[s.id] = [e[0], py - 30];
            return (
              <g key={s.id} opacity={dim(s.id)} onClick={onTap ? () => onTap(s.id) : undefined} style={onTap ? { cursor: 'pointer' } : undefined}>
                <line x1={e[0] - pan / 2 + 10} y1={py} x2={e[0]} y2={e[1]} stroke="var(--ink-3)" strokeWidth={2} />
                <line x1={e[0] + pan / 2 - 10} y1={py} x2={e[0]} y2={e[1]} stroke="var(--ink-3)" strokeWidth={2} />
                <path d={`M${e[0] - pan / 2},${py} Q${e[0]},${py + 34} ${e[0] + pan / 2},${py} Z`} fill={tone(s.tone)} fillOpacity={0.22} stroke={tone(s.tone)} strokeWidth={2.5} />
                {s.icon && <Glyph name={s.icon} cx={e[0]} cy={py - 30} size={Math.min(64, pan * 0.55)} color={tone(s.tone)} />}
                {onTap && <circle className="pulse-ring" cx={e[0]} cy={py - 10} r={pan / 2} fill="none" stroke="var(--t-primary)" strokeWidth={3} />}
                <g fontFamily="var(--font-sans)" textAnchor="middle">
                  <text x={e[0]} y={py + 44} fontSize={17} fontWeight={700} fill="var(--ink)">{s.label}</text>
                  <text x={e[0]} y={py + 68} fontSize={20} fontWeight={800} fill={tone(s.tone)}>{formatNumber(v)}{s.unit ? ` ${s.unit}` : ''}</text>
                </g>
              </g>
            );
          })}
          {scene.caption && <text x={cx} y={30} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--ink-2)" fontFamily="var(--font-sans)">{scene.caption}</text>}
          <Pins w={w} h={h} pins={Object.entries(callouts).filter(([id]) => anchors[id]).map(([id, text]) => ({ id, text, at: anchors[id] }))} />
        </svg>
      )}
    </div>
  );
}
