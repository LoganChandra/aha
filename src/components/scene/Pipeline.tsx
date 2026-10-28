'use client';
// Pipeline template: stages in order as big icons, things flowing between them, side inputs and outputs.
// Runs top to bottom on a phone and left to right on a wide screen. Layout and motion are designed, not generated.
import { evaluate, formatNumber, type Env } from '@/lib/expr';
import type { Scene } from '@/lib/recipe';
import { Pins } from './Graph2D';
import { Glyph } from './glyph';
import { tone, useSize } from './runtime';

type P = Extract<Scene, { type: 'pipeline' }>;

export default function Pipeline({ scene, env, focus, t, playing, callouts = {}, onTap }: { scene: P; env: Env; focus: string[]; t: number; playing: boolean; callouts?: Record<string, string>; onTap?: (id: string) => void }) {
  const [box, size] = useSize<HTMLDivElement>();
  const { w, h } = size;
  const n = scene.stages.length;
  const vertical = h > w * 0.9;
  const sides = scene.side ?? [];
  const hasSide = sides.length > 0;
  // Disc size: as big as the space allows, never tiny, never huge.
  const along = vertical ? h : w, across = vertical ? w : h;
  const D = Math.max(56, Math.min(96, along / (n * 1.75), across * (hasSide ? 0.24 : 0.42)));
  const step = (along - D) / Math.max(1, n - 1 + 0.0001);
  const mainX = vertical ? (hasSide ? w * 0.42 : w / 2) : 0;
  const mainY = vertical ? 0 : h * 0.47;
  const pos = scene.stages.map((_, i) => {
    const a = n === 1 ? along / 2 : D / 2 + 8 + i * ((along - D - 16) / (n - 1));
    return vertical ? [mainX, a] : [a, mainY];
  });
  void step;
  const flow = Math.max(0, Math.min(1, evaluate(scene.flow ?? 0.6, env, 0.6)));
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.45 : 1);
  const anchors: Record<string, [number, number]> = {};
  scene.stages.forEach((s, i) => { anchors[s.id] = [pos[i][0], pos[i][1]]; });

  const sideNodes = sides.map((sd, k) => {
    const si = scene.stages.findIndex((x) => x.id === sd.stage);
    const [sx, sy] = pos[Math.max(0, si)];
    const d2 = D * 0.62;
    const sameStage = sides.filter((x) => x.stage === sd.stage);
    const idx = sameStage.indexOf(sd);
    // Room for the icon and its label underneath, so side items never cover each other.
    const spread = (idx - (sameStage.length - 1) / 2) * (vertical ? d2 + 40 : Math.max(d2 + 30, sd.label.length * 8.5 + 16));
    const off = D * 0.5 + d2 * 0.5 + Math.min(70, across * 0.18);
    // Keep side items fully inside the frame, label included.
    const x = Math.max(d2 / 2 + 8, Math.min(w - d2 / 2 - 8, vertical ? sx + off : sx + spread));
    const y = Math.max(d2 / 2 + 8, Math.min(h - d2 / 2 - 30, vertical ? sy + spread : sy + (sd.dir === 'in' ? -off : off)));
    anchors[sd.id] = [x, y];
    void k;
    return { ...sd, x, y, d2, sx, sy };
  });

  const dots = (x1: number, y1: number, x2: number, y2: number, color: string, key: string, count = 3) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const speed = 22 + flow * 70;
    if (flow <= 0.01) return null;
    return Array.from({ length: count + Math.round(flow * 2) }, (_, i) => {
      const s = (((playing ? t * speed : 0) + (i * len) / (count + Math.round(flow * 2))) % len) / len;
      return <circle key={`${key}${i}`} cx={x1 + (x2 - x1) * s} cy={y1 + (y2 - y1) * s} r={4.5} fill={color} opacity={0.9} />;
    });
  };

  return (
    <div ref={box} className="absolute inset-0 select-none">
      {w > 0 && (
        <svg width={w} height={h} className="block" role="img" aria-label="Process">
          {/* main links */}
          {scene.stages.slice(0, -1).map((s, i) => {
            const [x1, y1] = pos[i], [x2, y2] = pos[i + 1];
            const ux = Math.sign(x2 - x1), uy = Math.sign(y2 - y1);
            const a = [x1 + ux * (D / 2 + 6), y1 + uy * (D / 2 + 6)], b = [x2 - ux * (D / 2 + 6), y2 - uy * (D / 2 + 6)];
            const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
            const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
            return (
              <g key={`l${i}`} opacity={Math.min(dim(s.id), dim(scene.stages[i + 1].id)) > 0.5 ? 1 : 0.5}>
                <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="var(--line-2)" strokeWidth={6} strokeLinecap="round" />
                <path d={`M${mx + 9 * Math.cos(ang)},${my + 9 * Math.sin(ang)} l${-13 * Math.cos(ang - 0.5)},${-13 * Math.sin(ang - 0.5)} M${mx + 9 * Math.cos(ang)},${my + 9 * Math.sin(ang)} l${-13 * Math.cos(ang + 0.5)},${-13 * Math.sin(ang + 0.5)}`} stroke="var(--ink-3)" strokeWidth={3} strokeLinecap="round" fill="none" />
                {dots(a[0], a[1], b[0], b[1], tone(s.tone), `d${i}`)}
              </g>
            );
          })}
          {/* side inputs and outputs */}
          {sideNodes.map((sd) => {
            const from = sd.dir === 'in' ? [sd.x, sd.y] : [sd.sx, sd.sy], to = sd.dir === 'in' ? [sd.sx, sd.sy] : [sd.x, sd.y];
            const L = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
            const ux = (to[0] - from[0]) / L, uy = (to[1] - from[1]) / L;
            const r1 = sd.dir === 'in' ? sd.d2 / 2 + 5 : D / 2 + 5, r2 = sd.dir === 'in' ? D / 2 + 5 : sd.d2 / 2 + 5;
            const a = [from[0] + ux * r1, from[1] + uy * r1], b = [to[0] - ux * r2, to[1] - uy * r2];
            return (
              <g key={sd.id} opacity={dim(sd.id)}>
                <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="var(--line-2)" strokeWidth={4} strokeDasharray="2 7" strokeLinecap="round" />
                {dots(a[0], a[1], b[0], b[1], tone(sd.tone), `s${sd.id}`, 2)}
                <g onClick={onTap ? () => onTap(sd.id) : undefined} style={onTap ? { cursor: 'pointer' } : undefined}>
                  {onTap && <circle className="pulse-ring" cx={sd.x} cy={sd.y} r={sd.d2 / 2 + 4} fill="none" stroke="var(--t-primary)" strokeWidth={3} />}
                  <Glyph name={sd.icon} cx={sd.x} cy={sd.y} size={sd.d2} color={tone(sd.tone)} soft />
                  <text x={sd.x} y={sd.y + sd.d2 / 2 + 18} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--ink-2)" fontFamily="var(--font-sans)">{sd.label}</text>
                </g>
              </g>
            );
          })}
          {/* stages */}
          {scene.stages.map((s, i) => {
            const [x, y] = pos[i];
            const v = s.value !== undefined ? evaluate(s.value, env, NaN) : NaN;
            const hot = focus.includes(s.id);
            const textX = vertical ? x - D / 2 - 14 : x, anchor = vertical ? 'end' : 'middle';
            const textY = vertical ? y - 6 : y + D / 2 + 24;
            return (
              <g key={s.id} opacity={dim(s.id)} onClick={onTap ? () => onTap(s.id) : undefined} style={onTap ? { cursor: 'pointer' } : undefined} role={onTap ? 'button' : undefined} aria-label={onTap ? `Tap ${s.label}` : undefined} className="pop-in">
                {onTap && <circle className="pulse-ring" cx={x} cy={y} r={D / 2 + 5} fill="none" stroke="var(--t-primary)" strokeWidth={3} />}
                <Glyph name={s.icon} cx={x} cy={y} size={D} color={tone(s.tone)} ring={hot} />
                <g fontFamily="var(--font-sans)" textAnchor={anchor}>
                  <text x={textX} y={textY} fontSize={17} fontWeight={700} fill="var(--ink)">{s.label}</text>
                  {Number.isFinite(v) && <text x={textX} y={textY + 22} fontSize={18} fontWeight={700} fill={tone(s.tone)}>{formatNumber(v)}{s.unit ? ` ${s.unit}` : ''}</text>}
                  {s.detail && !Number.isFinite(v) && <text x={textX} y={textY + 20} fontSize={13.5} fill="var(--ink-2)">{s.detail}</text>}
                </g>
              </g>
            );
          })}
          {scene.flowLabel && <text x={w - 12} y={h - 10} textAnchor="end" fontSize={14} fontWeight={600} fill="var(--ink-3)" fontFamily="var(--font-sans)">{scene.flowLabel}</text>}
          <Pins w={w} h={h} pins={Object.entries(callouts).filter(([id]) => anchors[id]).map(([id, text]) => ({ id, text, at: anchors[id] }))} />
        </svg>
      )}
    </div>
  );
}
