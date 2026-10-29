'use client';
// Icon array template: "out of 100 people". Each group's share is coloured in, the rest stay pale, the counts move
// smoothly as knobs change. The clearest known way to show odds and proportions to anyone.
import { evaluate, formatNumber, type Env } from '@/lib/expr';
import { ICONS } from '@/lib/icons';
import type { Scene } from '@/lib/recipe';
import { tone, useSize } from './runtime';

type A = Extract<Scene, { type: 'iconArray' }>;

export default function IconArray({ scene, env, focus, callouts = {}, onTap }: { scene: A; env: Env; focus: string[]; callouts?: Record<string, string>; onTap?: (id: string) => void }) {
  const [box, size] = useSize<HTMLDivElement>();
  const { w, h } = size;
  const total = scene.total;
  const counts = scene.groups.map((g) => Math.max(0, Math.round(evaluate(g.count, env, 0))));
  // Each icon belongs to the first group whose running total covers it.
  const owner: number[] = [];
  let k = 0;
  counts.forEach((c, gi) => { for (let j = 0; j < c && k < total; j++, k++) owner.push(gi); });
  while (owner.length < total) owner.push(-1);
  // Long group names wrap to two lines on a phone; leave room so the last group is not hidden.
  const legendH = scene.groups.reduce((a, g) => a + (g.label.length > 24 && w < 520 ? 62 : 40), 0) + (scene.caption ? (scene.caption.length > 40 && w < 520 ? 52 : 30) : 0) + 16;
  const gridH = Math.max(80, h - legendH - 16), gridW = w - 32;
  // Columns that make the cells as large as possible in the space.
  let best = { cols: 10, cell: 0 };
  for (let cols = 2; cols <= Math.min(total, 20); cols++) {
    const rows = Math.ceil(total / cols);
    const cell = Math.min(gridW / cols, gridH / rows);
    if (cell > best.cell) best = { cols, cell };
  }
  const { cols, cell } = best;
  const rows = Math.ceil(total / cols);
  const ox = (w - cols * cell) / 2, oy = 12 + (gridH - rows * cell) / 2;
  const node = ICONS[scene.icon] ?? ICONS['user'];
  const kk = (cell * 0.72) / 24;
  const dimG = (id: string) => (focus.length && !focus.includes(id) ? 0.4 : 1);
  return (
    <div ref={box} className="absolute inset-0 flex select-none flex-col">
      {w > 0 && (
        <>
          <svg width={w} height={gridH + 12} className="block shrink-0" role="img" aria-label={scene.caption ?? 'Icon array'}>
            {owner.map((g, i) => {
              const r = Math.floor(i / cols), c = i % cols;
              const x = ox + c * cell + cell * 0.14, y = oy + r * cell + cell * 0.14;
              const group = g >= 0 ? scene.groups[g] : null;
              const color = group ? tone(group.tone) : 'var(--line-2)';
              return (
                <g key={i} transform={`translate(${x},${y}) scale(${kk})`} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" opacity={group ? dimG(group.id) : 0.9} style={{ transition: 'stroke 300ms ease' }}>
                  {node.map(([tag, attrs], j) => {
                    const El = tag as 'path';
                    return <El key={j} {...(attrs as Record<string, string>)} vectorEffect="non-scaling-stroke" style={{ strokeWidth: Math.max(1.6, Math.min(2.6, cell / 14)) }} />;
                  })}
                </g>
              );
            })}
          </svg>
          <div className="mx-auto w-full max-w-[520px] px-4 pb-2">
            {scene.caption && <p className="mb-2 text-center text-[15px] font-medium text-ink-2">{scene.caption}</p>}
            {scene.groups.map((g, gi) => (
              <button
                key={g.id} type="button" disabled={!onTap} onClick={onTap ? () => onTap(g.id) : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left ${onTap ? 'cursor-pointer ring-2 ring-[var(--t-primary)]/30 hover:bg-sunk' : ''}`}
                style={{ opacity: dimG(g.id) }}
              >
                <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: tone(g.tone) }} />
                <span className="flex-1 text-[17px] font-semibold text-ink">{g.label}</span>
                <span className="text-[20px] font-bold tabular-nums" style={{ color: tone(g.tone) }}>{formatNumber(counts[gi])}</span>
                <span className="text-[15px] font-medium text-ink-3">of {total}</span>
                {callouts[g.id] && <span className="rounded-full border-[1.5px] border-ink px-2.5 py-0.5 text-[13px] font-semibold text-ink">{callouts[g.id]}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
