'use client';
// Sky template (blind panel 2026-10-29, Mrs Lim): the person stands at the bottom, the Sun moves over them, and the
// sky's colour, the light's path through the air and the share of blue left are computed from the Sun's height.
// Air mass uses Kasten and Young (1989); blue and red loss use Rayleigh optical depths of about 0.24 and 0.05 at
// sea level for ~450 nm and ~650 nm light. The colour is an illustration driven by those numbers, not a photograph.
import { evaluate, formatNumber, type Env } from '@/lib/expr';
import type { Scene } from '@/lib/recipe';
import { Pins } from './Graph2D';
import { useSize } from './runtime';

type SK = Extract<Scene, { type: 'sky' }>;

/** Relative air mass for a Sun this many degrees above the horizon (Kasten and Young 1989). Exported for tests. */
export function airMass(deg: number): number {
  const h = Math.max(0, Math.min(90, deg));
  return 1 / (Math.sin((h * Math.PI) / 180) + 0.50572 * Math.pow(h + 6.07995, -1.6364));
}
/** Share of blue and of red sunlight that reaches the ground straight from the Sun. */
export function lightLeft(deg: number, dust = 0): { blue: number; red: number } {
  const m = airMass(deg);
  return { blue: Math.exp(-(0.24 + 0.1 * dust) * m), red: Math.exp(-(0.05 + 0.08 * dust) * m) };
}

export default function Sky({ scene, env, focus, callouts = {}, onTap }: { scene: SK; env: Env; focus: string[]; callouts?: Record<string, string>; onTap?: (id: string) => void }) {
  const [box, size] = useSize<HTMLDivElement>();
  const { w, h } = size;
  const deg = Math.max(0, Math.min(90, evaluate(scene.sun, env, 60)));
  const dust = scene.dust !== undefined ? Math.max(0, Math.min(1, evaluate(scene.dust, env, 0))) : 0;
  const m = airMass(deg);
  const { blue, red } = lightLeft(deg, dust);
  // Sky colour: deep blue overhead when the Sun is high; warm and red near the horizon as blue is scattered away.
  const warm = Math.max(0, Math.min(1, 1 - blue / 0.8));
  const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const top = mix([62, 120, 214], [44, 52, 110], warm * 0.8);
  const low = mix([150, 196, 240], [238, 120, 52], Math.min(1, warm * 1.15));
  const ground = h * 0.82, cx = w / 2;
  const R = Math.min(w * 0.42, ground - 30);
  const sx = cx + R * Math.cos((deg * Math.PI) / 180), sy = ground - R * Math.sin((deg * Math.PI) / 180);
  const sunCol = `rgb(${mix([255, 245, 200], [255, 140, 60], warm).join(',')})`;
  const n = scene.names ?? { sun: 'Sun', eye: 'you', path: 'path through air', blueLeft: 'blue light left' };
  const anchors: Record<string, [number, number]> = { sun: [sx, sy], eye: [cx, ground - 20], path: [(sx + cx) / 2, (sy + ground) / 2] };
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.6 : 1);
  return (
    <div className="absolute inset-0 flex select-none flex-col">
      {scene.caption && <p className="shrink-0 px-3 pt-1 text-center text-[15px] font-semibold leading-snug text-ink-2">{scene.caption}</p>}
      <div className="flex shrink-0 flex-wrap justify-center gap-1.5 px-2 pt-1" aria-live="polite">
        <span className="rounded-full border border-line bg-surface px-3 py-1 text-[15px] font-semibold tabular-nums">{n.path}: {formatNumber(m)}×</span>
        <span className="rounded-full border border-line bg-surface px-3 py-1 text-[15px] font-semibold tabular-nums">{n.blueLeft}: {Math.round(blue * 100)}%</span>
        <span className="rounded-full border border-line bg-surface px-3 py-1 text-[15px] font-semibold tabular-nums">☀ {Math.round(deg)}°</span>
      </div>
      <div ref={box} className="relative min-h-0 flex-1">
        {w > 0 && (
          <svg width={w} height={h} className="block" role="img" aria-label={scene.caption ?? 'The sky'}>
            <defs>
              <linearGradient id="sky-grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={`rgb(${top.join(',')})`} />
                <stop offset="100%" stopColor={`rgb(${low.join(',')})`} />
              </linearGradient>
            </defs>
            <rect x={8} y={4} width={w - 16} height={ground - 4} rx={18} fill="url(#sky-grad)" />
            <rect x={8} y={ground} width={w - 16} height={h - ground - 4} rx={10} fill="#5c7a3d" opacity={0.85} />
            {/* the slanted path of sunlight to the eye: longer near the horizon */}
            <g onClick={onTap ? () => onTap('path') : undefined} style={onTap ? { cursor: 'pointer' } : undefined}>
              <line x1={sx} y1={sy} x2={cx} y2={ground - 30} stroke={sunCol} strokeWidth={4} strokeDasharray="8 6" opacity={dim('path')} />
              {onTap && <line x1={sx} y1={sy} x2={cx} y2={ground - 30} stroke="transparent" strokeWidth={44} />}
            </g>
            <g opacity={dim('sun')} onClick={onTap ? () => onTap('sun') : undefined} style={onTap ? { cursor: 'pointer' } : undefined}>
              <circle cx={sx} cy={sy} r={30} fill={sunCol} opacity={0.35} />
              <circle cx={sx} cy={sy} r={20} fill={sunCol} stroke="#fff" strokeWidth={2} />
              <text x={sx} y={sy - 30} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff" stroke="rgba(0,0,0,.35)" strokeWidth={3} paintOrder="stroke" fontFamily="var(--font-sans)">{n.sun}</text>
            </g>
            {/* the person looking up, standing at the bottom centre */}
            <g opacity={dim('eye')} onClick={onTap ? () => onTap('eye') : undefined} style={onTap ? { cursor: 'pointer' } : undefined} fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round">
              <circle cx={cx} cy={ground - 44} r={9} fill="#fff" />
              {onTap && <rect x={cx - 26} y={ground - 60} width={52} height={62} fill="transparent" stroke="none" />}
              <line x1={cx} y1={ground - 34} x2={cx} y2={ground - 10} />
              <line x1={cx - 10} y1={ground} x2={cx} y2={ground - 10} />
              <line x1={cx + 10} y1={ground} x2={cx} y2={ground - 10} />
            </g>
            <text x={cx} y={ground + 24} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff" fontFamily="var(--font-sans)">{n.eye}</text>
            <Pins w={w} h={h} pins={Object.entries(callouts).filter(([id]) => anchors[id]).map(([id, text]) => ({ id, text, at: anchors[id] }))} />
          </svg>
        )}
      </div>
      <span className="sr-only">{`red light left ${Math.round(red * 100)}%`}</span>
    </div>
  );
}
