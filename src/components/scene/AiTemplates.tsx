'use client';
// AI templates (Logan, 2026-10-29: "rmb we're focusing on AI topics"). The model writes words and raw numbers; every
// probability, nearest neighbour and gradient step is computed here, so the picture can never contradict the maths.
import { useRef } from 'react';
import { evaluate, formatNumber, type Env } from '@/lib/expr';
import type { Param, Scene } from '@/lib/recipe';
import { Pins } from './Graph2D';
import { Glyph } from './glyph';
import { tone, useSize } from './runtime';

type NW = Extract<Scene, { type: 'nextWord' }>;
type TK = Extract<Scene, { type: 'tokens' }>;
type EM = Extract<Scene, { type: 'embedding' }>;
type DS = Extract<Scene, { type: 'descent' }>;
export type TemplateWords = { nTokens: (n: number) => string; slope: string; offChart: string; chancePick: string; learned: string; round?: (n: number) => string; noiseLeft?: (p: number) => string; stepOf2?: (n: number, t: number) => string };
const EN: TemplateWords = { nTokens: (n) => `${n} tokens`, slope: 'slope', offChart: 'off the chart', chancePick: 'chance it picks this', learned: 'what it has learned (| = truth)' };
type Common = { env: Env; focus: string[]; callouts?: Record<string, string>; onTap?: (id: string) => void; words?: TemplateWords };

/** softmax(score / T); exported for tests. */
export function nextWordProbs(scores: number[], temperature: number): number[] {
  const T = Math.max(0.05, temperature);
  const m = Math.max(...scores);
  const e = scores.map((s) => Math.exp((s - m) / T));
  const sum = e.reduce((a, b) => a + b, 0) || 1;
  return e.map((v) => v / sum);
}

const Caption = ({ text }: { text?: string }) => (text ? <p className="shrink-0 px-3 pt-1 text-center text-[15px] font-semibold leading-snug text-ink-2">{text}</p> : null);

export function NextWord({ scene, env, focus, callouts = {}, onTap }: { scene: NW } & Common) {
  const T = scene.temperature !== undefined ? evaluate(scene.temperature, env, 1) : 1;
  const probs = nextWordProbs(scene.words.map((w) => evaluate(w.score, env, 0)), T);
  const pick = scene.pick !== undefined ? Math.round(evaluate(scene.pick, env, -1)) : -1;
  const top = probs.indexOf(Math.max(...probs));
  // Phrases (not single words) get their own line above the bar instead of being cut to "using Mi...".
  const long = scene.words.some((w) => w.label.length > 10);
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.6 : 1);
  return (
    <div className="absolute inset-0 flex select-none flex-col overflow-y-auto px-3 pb-2">
      <Caption text={scene.caption} />
      {/* the sentence so far, with the blank the model must fill */}
      <p className="mt-2 text-center font-serif text-[22px] leading-snug text-ink">
        {scene.context} <span className="inline-block min-w-[70px] rounded-lg border-2 border-dashed border-[var(--t-primary)] px-2 text-[var(--t-primary)]">{pick >= 0 && scene.words[pick] ? scene.words[pick].label : '?'}</span>
      </p>
      <ul className={`mx-auto w-full max-w-[520px] ${long ? 'mt-3 space-y-1' : 'mt-4 space-y-2'}`}>
        {scene.words.map((w, i) => (
          <li key={w.id} style={{ opacity: dim(w.id) }}>
            <button
              type="button" disabled={!onTap} onClick={onTap ? () => onTap(w.id) : undefined}
              className={`grid w-full ${long ? 'grid-cols-[1fr_56px]' : 'grid-cols-[minmax(64px,28%)_1fr_56px]'} items-center gap-x-2 rounded-xl px-2 py-1 text-left ${onTap ? 'cursor-pointer ring-2 ring-[var(--t-primary)]/30' : ''} ${focus.includes(w.id) || i === pick ? 'bg-sunk' : ''}`}
            >
              <span className={`${long ? 'col-span-2 text-[15.5px] leading-tight' : 'truncate text-[17px]'} font-semibold text-ink`}>{w.label}{callouts[w.id] ? <span className="ml-1.5 text-[13px] font-medium text-ink-2">· {callouts[w.id]}</span> : null}</span>
              <span className={`${long ? 'h-4' : 'h-6'} overflow-hidden rounded-full bg-sunk`}>
                <span className="block h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.max(1.5, probs[i] * 100)}%`, background: i === top ? 'var(--t-primary)' : 'color-mix(in oklab, var(--t-primary) 45%, var(--surface))' }} />
              </span>
              <span className="text-right text-[16px] font-bold tabular-nums text-ink">{Math.round(probs[i] * 100)}%</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center text-[14px] font-medium tabular-nums text-ink-2">T = {formatNumber(T)}</p>
    </div>
  );
}

const CHIP_TONES = ['primary', 'accent', 'green', 'cool', 'warm', 'red'];
export function Tokens({ scene, env, focus, callouts = {}, onTap, words = EN }: { scene: TK } & Common) {
  const ids = scene.showIds !== undefined ? evaluate(scene.showIds, env, 0) >= 0.5 : false;
  return (
    <div className="absolute inset-0 flex select-none flex-col overflow-y-auto px-3 pb-2">
      <Caption text={scene.caption} />
      <div className="mx-auto mt-3 flex max-w-[560px] flex-wrap justify-center gap-x-1 gap-y-3">
        {scene.pieces.map((p, i) => {
          const id = `t${i}`, c = tone(CHIP_TONES[i % CHIP_TONES.length]);
          return (
            <button
              key={id} type="button" disabled={!onTap} onClick={onTap ? () => onTap(id) : undefined}
              className={`flex flex-col items-center rounded-lg px-1.5 py-1 ${onTap ? 'cursor-pointer' : ''}`}
              style={{ background: `color-mix(in oklab, ${c} 16%, var(--surface))`, boxShadow: focus.includes(id) ? `0 0 0 2.5px ${c}` : undefined, opacity: focus.length && !focus.includes(id) ? 0.55 : 1 }}
            >
              <span className="whitespace-pre font-mono text-[19px] font-semibold text-ink">{p.text.replace(/ /g, '·')}</span>
              {ids && <span className="text-[12px] font-semibold tabular-nums" style={{ color: c }}>{p.id ?? i}</span>}
              {callouts[id] && <span className="text-[12px] font-medium text-ink-2">{callouts[id]}</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-center text-[17px] font-bold tabular-nums text-ink">{words.nTokens(scene.pieces.length)}</p>
    </div>
  );
}

export function Embedding({ scene, env, params, onDrag, focus, callouts = {}, onTap }: { scene: EM; params: Param[]; onDrag: (v: Record<string, number>) => void } & Common) {
  const [box, size] = useSize<HTMLDivElement>();
  const { w, h } = size;
  const svg = useRef<SVGSVGElement>(null);
  const q = scene.query ? { x: evaluate(scene.query.x, env, 0), y: evaluate(scene.query.y, env, 0) } : null;
  const all = [...scene.points.map((p) => [p.x, p.y]), ...(q ? [[q.x, q.y]] : [])];
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const pad = 46, x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const span = Math.max(x1 - x0, y1 - y0, 1e-6);
  const k = Math.min((w - 2 * pad) / Math.max(x1 - x0, span * 0.5), (h - 2 * pad) / Math.max(y1 - y0, span * 0.5));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const X = (x: number) => w / 2 + (x - cx) * k, Y = (y: number) => h / 2 - (y - cy) * k;
  const groups = [...new Set(scene.points.map((p) => p.group ?? ''))];
  const colour = (g?: string) => tone(['primary', 'accent', 'green', 'cool', 'warm', 'red'][Math.max(0, groups.indexOf(g ?? '')) % 6]);
  // Nearest neighbours of the query, by true distance (computed here, not claimed by the model).
  const near = q ? scene.points.map((p) => ({ p, d: Math.hypot(p.x - q.x, p.y - q.y) })).sort((a, b) => a.d - b.d).slice(0, scene.nearest ?? 2) : [];
  const qx = scene.query && typeof scene.query.x === 'string' ? params.find((p) => p.id === String(scene.query!.x).trim()) : undefined;
  const qy = scene.query && typeof scene.query.y === 'string' ? params.find((p) => p.id === String(scene.query!.y).trim()) : undefined;
  const dragging = useRef(false);
  const move = (e: React.PointerEvent) => {
    if (!dragging.current || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const vx = cx + (e.clientX - r.left - w / 2) / k, vy = cy - (e.clientY - r.top - h / 2) / k;
    const out: Record<string, number> = {};
    if (qx) out[qx.id] = Math.max(qx.min, Math.min(qx.max, vx));
    if (qy) out[qy.id] = Math.max(qy.min, Math.min(qy.max, vy));
    if (Object.keys(out).length) onDrag(out);
  };
  const anchors: Record<string, [number, number]> = {};
  scene.points.forEach((p) => { anchors[p.id] = [X(p.x), Y(p.y)]; });
  // Each label goes right, left, above or below its dot, whichever covers no other dot or label (walk: "soup" hid under "pizza").
  const taken: { x0: number; x1: number; y0: number; y1: number }[] = scene.points.map((p) => ({ x0: X(p.x) - 11, x1: X(p.x) + 11, y0: Y(p.y) - 11, y1: Y(p.y) + 11 }));
  if (q) taken.push({ x0: X(q.x) - 14, x1: X(q.x) + 14, y0: Y(q.y) - 14, y1: Y(q.y) + 14 });
  const labelAt: Record<string, [number, number, 'start' | 'end' | 'middle']> = {};
  for (const p of [...scene.points].sort((a, b) => b.y - a.y)) {
    const tw = p.label.length * 8.8 + 4, px = X(p.x), py = Y(p.y);
    const tries: [number, number, 'start' | 'end' | 'middle', number][] = [[px + 13, py + 5, 'start', 0], [px - 13, py + 5, 'end', -tw], [px, py - 14, 'middle', -tw / 2], [px, py + 25, 'middle', -tw / 2]];
    let best = tries[0], bestA = Infinity;
    for (const t of tries) {
      const b = { x0: t[0] + t[3], x1: t[0] + t[3] + tw, y0: t[1] - 15, y1: t[1] + 4 };
      const a = taken.reduce((s2, o) => s2 + Math.max(0, Math.min(b.x1, o.x1) - Math.max(b.x0, o.x0)) * Math.max(0, Math.min(b.y1, o.y1) - Math.max(b.y0, o.y0)), 0) + (b.x0 < 2 || b.x1 > w - 2 ? 5000 : 0);
      if (a < bestA) { bestA = a; best = t; }
      if (a === 0) break;
    }
    labelAt[p.id] = [best[0], best[1], best[2]];
    taken.push({ x0: best[0] + best[3], x1: best[0] + best[3] + tw, y0: best[1] - 15, y1: best[1] + 4 });
  }
  if (q) anchors.query = [X(q.x), Y(q.y)];
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.6 : 1);
  return (
    <div className="absolute inset-0 flex select-none flex-col">
      <Caption text={scene.caption} />
      <div ref={box} className="relative min-h-0 flex-1">
        {w > 0 && (
          <svg ref={svg} width={w} height={h} className="block" role="img" aria-label={scene.caption ?? 'Map of meaning'} onPointerMove={move} onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}>
            <defs><marker id="emb-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--t-accent)" /></marker></defs>
            {(scene.arrows ?? []).map(([a, b], i) => {
              const A = scene.points.find((p) => p.id === a), B = scene.points.find((p) => p.id === b);
              return A && B ? <line key={i} x1={X(A.x)} y1={Y(A.y)} x2={X(B.x)} y2={Y(B.y)} stroke="var(--t-accent)" strokeWidth={3} markerEnd="url(#emb-arrow)" opacity={0.85} /> : null;
            })}
            {q && near.map(({ p, d }) => (
              <g key={`n-${p.id}`}>
                <line x1={X(q.x)} y1={Y(q.y)} x2={X(p.x)} y2={Y(p.y)} stroke="var(--ink-3)" strokeWidth={1.5} strokeDasharray="4 4" />
                <text x={(X(q.x) + X(p.x)) / 2} y={(Y(q.y) + Y(p.y)) / 2 - 6} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink-2)" stroke="var(--paper)" strokeWidth={4} paintOrder="stroke" fontFamily="var(--font-sans)">{formatNumber(d)}</text>
              </g>
            ))}
            {scene.points.map((p) => (
              <g key={p.id} opacity={dim(p.id)} onClick={onTap ? () => onTap(p.id) : undefined} style={onTap ? { cursor: 'pointer' } : undefined}>
                <circle cx={X(p.x)} cy={Y(p.y)} r={9} fill={colour(p.group)} stroke="var(--surface)" strokeWidth={2.5} />
                {onTap && <circle cx={X(p.x)} cy={Y(p.y)} r={24} fill="transparent" />}
                <text x={labelAt[p.id][0]} y={labelAt[p.id][1]} textAnchor={labelAt[p.id][2]} fontSize={16} fontWeight={700} fill={colour(p.group)} stroke="var(--paper)" strokeWidth={4} paintOrder="stroke" fontFamily="var(--font-sans)">{p.label}</text>
              </g>
            ))}
            {q && scene.query && (
              <g opacity={dim('query')}>
                <circle cx={X(q.x)} cy={Y(q.y)} r={22} fill="var(--t-red)" fillOpacity={0.15} />
                <circle cx={X(q.x)} cy={Y(q.y)} r={12} fill="var(--t-red)" stroke="var(--surface)" strokeWidth={3} />
                <text x={Math.max(40, Math.min(w - 40, X(q.x)))} y={Math.min(h - 6, Y(q.y) + 40)} textAnchor="middle" fontSize={17} fontWeight={800} fill="var(--t-red)" stroke="var(--paper)" strokeWidth={4} paintOrder="stroke" fontFamily="var(--font-sans)">{scene.query.label}</text>
                {(qx || qy) && <circle cx={X(q.x)} cy={Y(q.y)} r={30} fill="transparent" style={{ cursor: 'grab', touchAction: 'none' }} role="slider" aria-label={`Drag ${scene.query.label}`} onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); dragging.current = true; }} />}
              </g>
            )}
            <Pins w={w} h={h} avoid={taken} pins={Object.entries(callouts).filter(([id]) => anchors[id]).map(([id, text]) => ({ id, text, at: anchors[id] }))} />
          </svg>
        )}
      </div>
      {q && near.length > 0 && <p className="shrink-0 pb-1 text-center text-[15px] font-semibold text-ink">{near.map(({ p }) => p.label).join(', ')}</p>}
    </div>
  );
}

/** The next gradient-descent positions from w, with the slope measured numerically; exported for tests. */
export function descentPath(loss: (w: number) => number, w: number, lr: number, steps: number): number[] {
  const path = [w];
  for (let i = 0; i < steps; i++) {
    const h = 1e-4, g = (loss(w + h) - loss(w - h)) / (2 * h);
    w = w - lr * g;
    if (!Number.isFinite(w)) break;
    path.push(w);
  }
  return path;
}

export function Descent({ scene, env, params, onDrag, focus, callouts = {}, onTap, words = EN }: { scene: DS; params: Param[]; onDrag: (v: Record<string, number>) => void } & Common) {
  const [box, size] = useSize<HTMLDivElement>();
  const { w, h } = size;
  const svg = useRef<SVGSVGElement>(null);
  const L = (x: number) => evaluate(scene.loss, { ...env, x, w: x }, NaN);
  const [a, b] = scene.range;
  const wv = evaluate(scene.w, env, (a + b) / 2), lr = evaluate(scene.lr, env, 0.1);
  const steps = Math.max(0, Math.min(12, Math.round(scene.steps !== undefined ? evaluate(scene.steps, env, 1) : 1)));
  const path = descentPath(L, wv, lr, steps);
  const samples = Array.from({ length: 121 }, (_, i) => a + ((b - a) * i) / 120);
  const ys = samples.map(L).filter(Number.isFinite);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const padL = 40, padR = 16, padT = 30, padB = 34;
  const X = (x: number) => padL + ((x - a) / (b - a)) * (w - padL - padR);
  const Y = (y: number) => padT + (1 - (y - yMin) / (yMax - yMin || 1)) * (h - padT - padB);
  const d = samples.map((x, i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(Math.min(yMax, L(x))).toFixed(1)}`).join('');
  const knob = params.find((p) => p.id === String(scene.w).trim());
  const dragging = useRef(false);
  const move = (e: React.PointerEvent) => {
    if (!dragging.current || !knob || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const v = a + ((e.clientX - r.left - padL) / (w - padL - padR)) * (b - a);
    onDrag({ [knob.id]: Math.max(knob.min, Math.min(knob.max, v)) });
  };
  const slope = (L(wv + 1e-4) - L(wv - 1e-4)) / 2e-4;
  const anchors: Record<string, [number, number]> = { ball: [X(wv), Y(L(wv))] };
  path.slice(1).forEach((p, i) => { anchors[`step${i + 1}`] = [X(p), Y(L(p))]; });
  const tl = (b - a) * 0.12;
  return (
    <div className="absolute inset-0 flex select-none flex-col">
      <Caption text={scene.caption} />
      <div ref={box} className="relative min-h-0 flex-1">
        {w > 0 && (
          <svg ref={svg} width={w} height={h} className="block" role="img" aria-label={scene.caption ?? 'Loss curve'} onPointerMove={move} onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}>
            <line x1={padL} x2={w - padR} y1={h - padB} y2={h - padB} stroke="var(--axis)" strokeWidth={1.4} />
            <line x1={padL} x2={padL} y1={padT} y2={h - padB} stroke="var(--axis)" strokeWidth={1.4} />
            {scene.xLabel && <text x={w - padR} y={h - 8} textAnchor="end" fontSize={14} fontWeight={600} fill="var(--ink-2)" fontFamily="var(--font-sans)">{scene.xLabel} →</text>}
            {scene.yLabel && <text x={padL} y={18} fontSize={14} fontWeight={600} fill="var(--ink-2)" fontFamily="var(--font-sans)">↑ {scene.yLabel}</text>}
            <path d={d} fill="none" stroke="var(--t-primary)" strokeWidth={3.5} strokeLinecap="round" />
            {/* the slope where the ball stands */}
            <line x1={X(wv - tl)} y1={Y(L(wv) - slope * tl)} x2={X(wv + tl)} y2={Y(L(wv) + slope * tl)} stroke="var(--t-accent)" strokeWidth={3} strokeLinecap="round" opacity={0.9} />
            {/* the next steps, computed: hops along the curve, so an overshoot really jumps past the bottom */}
            {path.slice(1).map((p, i) => {
              const from = path[i];
              // A step that leaves the chart is drawn to the edge with an arrow, and the walk stops there (it diverged).
              if (path.slice(0, i + 1).some((v) => v < a || v > b || L(v) > yMax * 1.02)) return null;
              const off = p < a || p > b || L(p) > yMax * 1.02;
              const x1 = X(from), y1 = Y(L(from));
              if (off) {
                const ex = p > from ? w - padR : padL;
                return (
                  <g key={i}>
                    <path d={`M${x1},${y1} Q${(x1 + ex) / 2},${padT - 4} ${ex},${padT + 6}`} fill="none" stroke="var(--t-red)" strokeWidth={2.5} strokeDasharray="5 4" />
                    <text x={ex + (p > from ? -4 : 4)} y={padT + 24} textAnchor={p > from ? 'end' : 'start'} fontSize={14} fontWeight={800} fill="var(--t-red)" fontFamily="var(--font-sans)">{p > from ? `${words.offChart} →` : `← ${words.offChart}`}</text>
                  </g>
                );
              }
              const x2 = X(p), y2 = Y(L(p));
              const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - 26;
              return (
                <g key={i} opacity={Math.max(0.35, 1 - i * 0.12)}>
                  <path d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} fill="none" stroke="var(--t-green)" strokeWidth={2.5} strokeDasharray="5 4" />
                  <circle cx={x2} cy={y2} r={7} fill="var(--t-green)" stroke="var(--surface)" strokeWidth={2} />
                </g>
              );
            })}
            <circle cx={X(wv)} cy={Y(L(wv))} r={13} fill="var(--t-primary)" stroke="var(--surface)" strokeWidth={4} opacity={focus.length && !focus.includes('ball') ? 0.6 : 1} onClick={onTap ? () => onTap('ball') : undefined} />
            {knob && <circle cx={X(wv)} cy={Y(L(wv))} r={30} fill="transparent" style={{ cursor: 'grab', touchAction: 'none' }} role="slider" aria-label={knob.label} onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); dragging.current = true; }} />}
            <Pins w={w} h={h} pins={Object.entries(callouts).filter(([id]) => anchors[id]).map(([id, text]) => ({ id, text, at: anchors[id] }))} />
          </svg>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap justify-center gap-1.5 px-2 pb-1">
        <span className="rounded-full border border-line bg-surface px-3 py-1 text-[15px] font-semibold tabular-nums">{scene.yLabel ?? 'loss'}: {formatNumber(L(wv))}</span>
        <span className="rounded-full border border-line bg-surface px-3 py-1 text-[15px] font-semibold tabular-nums">{words.slope}: {formatNumber(slope)}</span>
      </div>
    </div>
  );
}

type RW = Extract<Scene, { type: 'reward' }>;
/**
 * A simple bandit, exported for tests: estimates start at 0.5 and approach each option's true reward as rounds grow;
 * the chance of picking an option is a softmax over the estimates, mixed with some exploring.
 */
export function rewardPolicy(rewards: number[], rounds: number, explore: number): { est: number[]; pick: number[] } {
  const k = 1 - Math.exp(-Math.max(0, rounds) / 6);
  const est = rewards.map((r) => 0.5 + (Math.max(0, Math.min(1, r)) - 0.5) * k);
  const e = est.map((v) => Math.exp(8 * v)), sum = e.reduce((a, b) => a + b, 0);
  const x = Math.max(0, Math.min(1, explore));
  const pick = e.map((v) => (1 - x) * (v / sum) + x / rewards.length);
  return { est, pick };
}

export function Reward({ scene, env, focus, callouts = {}, onTap, words = EN }: { scene: RW } & Common) {
  const rewards = scene.options.map((o) => evaluate(o.reward, env, 0.5));
  const rounds = Math.round(evaluate(scene.rounds, env, 0)), explore = scene.explore !== undefined ? evaluate(scene.explore, env, 0.1) : 0.1;
  const { est, pick } = rewardPolicy(rewards, rounds, explore);
  const best = pick.indexOf(Math.max(...pick));
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.6 : 1);
  return (
    <div className="absolute inset-0 flex select-none flex-col overflow-y-auto px-3 pb-2">
      <Caption text={scene.caption} />
      <p className="mt-1 flex flex-wrap justify-center gap-x-4 text-[13.5px] font-medium text-ink-2">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-[var(--t-primary)]" />{scene.pickLabel ?? words.chancePick}</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-[var(--t-green)]/70" />{scene.learnedLabel ?? words.learned}</span>
      </p>
      <ul className="mx-auto mt-2 w-full max-w-[540px] space-y-3">
        {scene.options.map((o, i) => (
          <li key={o.id} style={{ opacity: dim(o.id) }}>
            <button type="button" disabled={!onTap} onClick={onTap ? () => onTap(o.id) : undefined} className={`w-full rounded-2xl border-2 p-3 text-left ${i === best && rounds > 0 ? 'border-[var(--t-primary)]' : 'border-line'} ${onTap ? 'cursor-pointer' : ''} bg-surface`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[17px] font-semibold text-ink">{o.label}{callouts[o.id] ? <span className="ml-1.5 text-[13px] font-medium text-ink-2">· {callouts[o.id]}</span> : null}</span>
                <span className="text-[16px] font-bold tabular-nums text-[var(--t-primary)]">{Math.round(pick[i] * 100)}%</span>
              </div>
              {/* the chance it picks this option now */}
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-sunk"><div className="h-full rounded-full bg-[var(--t-primary)] transition-[width] duration-300" style={{ width: `${pick[i] * 100}%` }} /></div>
              {/* what it has learned the reward is, against the true reward (the tick) */}
              <div className="relative mt-2 h-2.5 rounded-full bg-sunk">
                <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--t-green)]/70 transition-[width] duration-300" style={{ width: `${est[i] * 100}%` }} />
                <div className="absolute -top-1 h-[18px] w-[3px] rounded bg-ink" style={{ left: `calc(${Math.max(0, Math.min(1, rewards[i])) * 100}% - 1px)` }} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type CY = Extract<Scene, { type: 'cycle' }>;
export function Cycle({ scene, env, focus, callouts = {}, onTap, t = 0, words = EN }: { scene: CY; t?: number } & Common) {
  const [box, size] = useSize<HTMLDivElement>();
  const { w, h } = size;
  const n = scene.stages.length;
  const speed = scene.speed !== undefined ? Math.max(0, evaluate(scene.speed, env, 0.4)) : 0.4;
  // Room for the side labels (up to ~90px each side) and the label under the bottom stage.
  const R = Math.max(56, Math.min(w / 2 - 92, h / 2 - 64)), cx = w / 2, cy = h / 2 - 8;
  const at = (k: number): [number, number] => [cx + R * Math.sin((2 * Math.PI * k) / n), cy - R * Math.cos((2 * Math.PI * k) / n)];
  const pos = t * speed; // stages travelled
  const round = Math.floor(pos / n) + 1;
  const here = Math.floor(pos) % n;
  const frac = pos - Math.floor(pos);
  const a0 = at(here), a1 = at(here + 1);
  const dot: [number, number] = [a0[0] + (a1[0] - a0[0]) * frac, a0[1] + (a1[1] - a0[1]) * frac];
  const node = Math.max(26, Math.min(40, R * 0.34));
  const anchors: Record<string, [number, number]> = {};
  scene.stages.forEach((st, k) => { anchors[st.id] = at(k); });
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.6 : 1);
  return (
    <div className="absolute inset-0 flex select-none flex-col">
      <Caption text={scene.caption} />
      {/* On a small circle the centre note moves under the caption instead of colliding with the stages. */}
      {scene.center && <p className="shrink-0 px-3 text-center text-[14px] font-medium text-ink-2">{scene.center}</p>}
      <div ref={box} className="relative min-h-0 flex-1">
        {w > 0 && (
          <svg width={w} height={h} className="block" role="img" aria-label={scene.caption ?? 'Cycle'}>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--line-2)" strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" />
            {scene.stages.map((st, k) => {
              const [x, y] = at(k), [x2, y2] = at(k + 1), mx = (x + x2) / 2, my = (y + y2) / 2;
              const ang = Math.atan2(y2 - y, x2 - x);
              return <path key={`a${k}`} d={`M${mx - 7 * Math.cos(ang - 0.5)},${my - 7 * Math.sin(ang - 0.5)} L${mx},${my} L${mx - 7 * Math.cos(ang + 0.5)},${my - 7 * Math.sin(ang + 0.5)}`} fill="none" stroke="var(--ink-3)" strokeWidth={2.5} strokeLinecap="round" />;
            })}
            <circle cx={dot[0]} cy={dot[1]} r={9} fill="var(--t-accent)" stroke="var(--surface)" strokeWidth={3} />
            {scene.stages.map((st, k) => {
              const [x, y] = at(k);
              return (
                <g key={st.id} opacity={dim(st.id)} onClick={onTap ? () => onTap(st.id) : undefined} style={onTap ? { cursor: 'pointer' } : undefined}>
                  <Glyph name={st.icon} cx={x} cy={y} size={node * 2} color={tone(st.tone)} ring={k === here} />
                  {onTap && <circle className="pulse-ring" cx={x} cy={y} r={node + 6} fill="none" stroke="var(--t-primary)" strokeWidth={3} style={{ pointerEvents: 'none' }} />}
                  {/* Labels wrap onto two short lines so side labels never run off a phone screen. */}
                  {(() => {
                    const words = st.label.split(' '), lines: string[] = [];
                    for (const wd of words) { const last = lines[lines.length - 1]; if (last && (last + ' ' + wd).length <= 14) lines[lines.length - 1] = last + ' ' + wd; else lines.push(wd); }
                    return lines.slice(0, 3).map((ln, li) => <text key={li} x={Math.max(54, Math.min(w - 54, x))} y={y + node + 18 + li * 17} textAnchor="middle" fontSize={14.5} fontWeight={700} fill="var(--ink)" stroke="var(--paper)" strokeWidth={4} paintOrder="stroke" fontFamily="var(--font-sans)">{ln}</text>);
                  })()}
                </g>
              );
            })}
            <g fontFamily="var(--font-sans)" textAnchor="middle">
              {false && scene.center && <text x={cx} y={cy - 6} fontSize={14} fontWeight={600} fill="var(--ink-2)">{scene.center}</text>}
              <text x={cx} y={cy + 8} fontSize={22} fontWeight={800} fill="var(--ink)">{(words.round ?? ((r: number) => `round ${r}`))(round)}</text>
            </g>
            <Pins w={w} h={h} pins={Object.entries(callouts).filter(([id]) => anchors[id]).map(([id, text]) => ({ id, text, at: anchors[id] }))} />
          </svg>
        )}
      </div>
    </div>
  );
}

type DN = Extract<Scene, { type: 'denoise' }>;
/** Deterministic noise per cell, so the same step always looks the same. */
const hash = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function Denoise({ scene, env, focus, words = EN }: { scene: DN } & Common) {
  const [box, size] = useSize<HTMLDivElement>();
  const { w, h } = size;
  const step = Math.max(0, Math.min(scene.steps, Math.round(evaluate(scene.step, env, 0))));
  const noise = 1 - step / scene.steps; // share of noise left
  const side = Math.max(120, Math.min(w - 40, h - 70));
  const cells = 18, cell = side / cells, x0 = (w - side) / 2, y0 = Math.max(8, (h - side - 50) / 2);
  return (
    <div className="absolute inset-0 flex select-none flex-col">
      <Caption text={scene.caption} />
      {scene.prompt && <p className="shrink-0 px-3 pt-1 text-center font-serif text-[18px] text-ink">"{scene.prompt}"</p>}
      <div ref={box} className="relative min-h-0 flex-1">
        {w > 0 && (
          <svg width={w} height={h} className="block" role="img" aria-label={scene.prompt ?? 'Denoising'} opacity={focus.length && !focus.includes('image') ? 0.6 : 1}>
            <rect x={x0} y={y0} width={side} height={side} rx={16} fill="var(--surface)" stroke="var(--line)" />
            <Glyph name={scene.icon} cx={x0 + side / 2} cy={y0 + side / 2} size={side * 0.82} color={tone(scene.tone)} soft />
            {/* each cell stays noisy until the steps clear it, in a fixed random order */}
            <g>
              {Array.from({ length: cells * cells }, (_, i) => {
                if (hash(i) >= noise) return null;
                const g = Math.round(90 + hash(i + 999) * 140);
                return <rect key={i} x={x0 + (i % cells) * cell} y={y0 + Math.floor(i / cells) * cell} width={cell + 0.5} height={cell + 0.5} fill={`rgb(${g},${g},${g})`} />;
              })}
            </g>
            <text x={w / 2} y={y0 + side + 30} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--ink)" fontFamily="var(--font-sans)">{(words.stepOf2 ?? ((n: number, t: number) => `step ${n} of ${t}`))(step, scene.steps)} · {(words.noiseLeft ?? ((p: number) => `${p}% noise`))(Math.round(noise * 100))}</text>
          </svg>
        )}
      </div>
    </div>
  );
}
