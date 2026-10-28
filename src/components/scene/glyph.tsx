'use client';
// One icon on a lit disc: the shared building block of the template scenes.
import { ICONS } from '@/lib/icons';

export function Glyph({ name, cx, cy, size, color, ring, dim = 1, soft = false }: { name: string; cx: number; cy: number; size: number; color: string; ring?: boolean; dim?: number; soft?: boolean }) {
  const node = ICONS[name] ?? ICONS['circle-check'];
  const r = size / 2;
  const k = (size * 0.56) / 24;
  return (
    <g opacity={dim}>
      <circle cx={cx} cy={cy} r={r} fill="var(--surface)" style={{ filter: 'drop-shadow(0 2px 4px rgb(0 0 0 / 0.14))' }} />
      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={soft ? 0.08 : 0.15} stroke={ring ? color : 'none'} strokeWidth={2.5} />
      <g transform={`translate(${cx - 12 * k},${cy - 12 * k}) scale(${k})`} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
        {node.map(([tag, attrs], i) => {
          const El = tag as 'path';
          return <El key={i} {...(attrs as Record<string, string>)} vectorEffect="non-scaling-stroke" style={{ strokeWidth: Math.max(1.8, Math.min(3, size / 26)) }} />;
        })}
      </g>
    </g>
  );
}
