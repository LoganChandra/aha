'use client';
// Attention template: who looks at whom. The model only writes raw scores; softmax, the scale (1/√d_k or a
// temperature) and the causal mask are computed here, so every row sums to 100%, masked cells are exactly 0, and the
// numbers on screen are always right (blind panel 2026-10-29, Daniel: the free-drawn matrix never renormalised).
import { evaluate, type Env } from '@/lib/expr';
import type { Scene } from '@/lib/recipe';
import { Pins } from './Graph2D';
import { useSize } from './runtime';

type A = Extract<Scene, { type: 'attention' }>;

/** Row-wise softmax of scale * score, with future positions masked out when mask is on. Exported for tests. */
export function attentionWeights(scores: number[][], scale: number, mask: boolean): number[][] {
  return scores.map((row, i) => {
    const z = row.map((s, j) => (mask && j > i ? -Infinity : s * scale));
    const m = Math.max(...z.filter(Number.isFinite));
    const e = z.map((v) => (Number.isFinite(v) ? Math.exp(v - m) : 0));
    const sum = e.reduce((a, b) => a + b, 0) || 1;
    return e.map((v) => v / sum);
  });
}

export default function Attention({ scene, env, focus, callouts = {}, onTap }: { scene: A; env: Env; focus: string[]; callouts?: Record<string, string>; onTap?: (id: string) => void }) {
  const [box, size] = useSize<HTMLDivElement>();
  const { w, h } = size;
  const n = scene.tokens.length;
  const scores = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => evaluate(scene.scores[i]?.[j] ?? 0, env, 0)));
  const scale = scene.scale !== undefined ? evaluate(scene.scale, env, 1) : 1;
  const mask = scene.mask !== undefined ? evaluate(scene.mask, env, 0) >= 0.5 : false;
  const weights = attentionWeights(scores, scale, mask);
  const fr = scene.focusRow !== undefined ? Math.round(evaluate(scene.focusRow, env, -1)) : -1;
  // Room for the longest row label on the left and the "= 100%" on the right, so nothing is clipped on a phone.
  const longest = Math.max(...scene.tokens.map((t) => t.length));
  const left = Math.min(w * 0.3, 16 + longest * 8.6), right = scene.show === 'scores' ? 8 : 58;
  let cell = Math.max(24, Math.min(84, (w - left - right) / n, (h - 46) / n));
  // Column heads that would not fit side by side are tilted, like a spreadsheet's (panel: words ran together).
  const tilt = scene.tokens.some((t) => t.length * 7.6 > cell - 4);
  const top = tilt ? 18 + Math.min(longest, 12) * 6.2 : 34;
  cell = Math.max(22, Math.min(cell, (h - top - 8) / n));
  const gx = left + Math.max(0, (w - left - right - cell * n) / 2), gy = top;
  const head = (t: string) => (tilt ? 14 : Math.max(11, Math.min(15, (cell - 4) / (t.length * 0.58))));
  const maxS = Math.max(...scores.flat().map(Math.abs), 1e-9);
  const anchors: Record<string, [number, number]> = {};
  const dim = (id: string, i: number) => (focus.length && !focus.includes(id) && !focus.includes(`row${i}`) ? 0.45 : fr >= 0 && fr !== i ? 0.4 : 1);
  return (
    <div className="absolute inset-0 flex select-none flex-col">
      {/* The caption wraps as text instead of running off a narrow screen. */}
      {scene.caption && <p className="shrink-0 px-3 pt-1 text-center text-[15px] font-semibold leading-snug text-ink-2">{scene.caption}</p>}
      <div ref={box} className="relative min-h-0 flex-1">
      {w > 0 && (
        <svg width={w} height={h} className="block" role="img" aria-label={scene.caption ?? 'Attention weights'}>
          <g fontFamily="var(--font-sans)">
            {/* column heads: the words being looked at */}
            {scene.tokens.map((t, j) => <text key={`c${j}`} x={gx + cell * (j + 0.5)} y={gy - 10} textAnchor={tilt ? 'start' : 'middle'} transform={tilt ? `rotate(-40 ${gx + cell * (j + 0.5)} ${gy - 10})` : undefined} fontSize={head(t)} fontWeight={700} fill="var(--ink)">{t}</text>)}
            {scene.tokens.map((t, i) => {
              const rowId = `row${i}`;
              anchors[rowId] = [gx - 8, gy + cell * (i + 0.5)];
              return (
                <g key={`r${i}`} opacity={dim(rowId, i)}>
                  <text x={gx - 10} y={gy + cell * (i + 0.5) + 5} textAnchor="end" fontSize={Math.min(15, (left - 14) / (t.length * 0.56))} fontWeight={700} fill="var(--ink)">{t}</text>
                  {scene.tokens.map((_, j) => {
                    const id = `cell${i}_${j}`;
                    const masked = mask && j > i;
                    const wv = weights[i][j], sv = scores[i][j];
                    const fill = scene.show === 'scores' ? Math.abs(sv) / maxS : wv;
                    const x = gx + cell * j, y = gy + cell * i;
                    anchors[id] = [x + cell / 2, y + cell / 2];
                    const label = masked ? '–' : scene.show === 'scores' ? (Math.round(sv * 10) / 10).toString() : `${Math.round(wv * 100)}%`;
                    return (
                      <g key={id} onClick={onTap ? () => onTap(id) : undefined} style={onTap ? { cursor: 'pointer' } : undefined}>
                        <rect x={x + 2} y={y + 2} width={cell - 4} height={cell - 4} rx={8} fill={masked ? 'var(--sunk)' : 'var(--t-primary)'} fillOpacity={masked ? 1 : 0.08 + 0.85 * fill} stroke={focus.includes(id) ? 'var(--ink)' : 'var(--line)'} strokeWidth={focus.includes(id) ? 2.5 : 1} />
                        <text x={x + cell / 2} y={y + cell / 2 + 5} textAnchor="middle" fontSize={Math.min(16, cell * 0.3)} fontWeight={700} fill={!masked && fill > 0.55 ? 'var(--surface)' : 'var(--ink)'}>{label}</text>
                      </g>
                    );
                  })}
                  {/* each row's total: softmax always gives 100% */}
                  {scene.show !== 'scores' && <text x={gx + cell * n + 8} y={gy + cell * (i + 0.5) + 5} fontSize={13} fontWeight={600} fill="var(--ink-2)">= 100%</text>}
                  {onTap && <rect x={gx - left} y={gy + cell * i} width={left - 4} height={cell} fill="transparent" onClick={() => onTap(rowId)} />}
                </g>
              );
            })}
          </g>
          <Pins w={w} h={h} pins={Object.entries(callouts).filter(([id]) => anchors[id]).map(([id, text]) => ({ id, text, at: anchors[id] }))} />
        </svg>
      )}
      </div>
    </div>
  );
}
