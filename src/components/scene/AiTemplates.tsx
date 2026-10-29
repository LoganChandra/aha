'use client';
// AI templates (Logan, 2026-10-29: "rmb we're focusing on AI topics"). The model writes words and raw numbers; every
// probability, nearest neighbour and gradient step is computed here, so the picture can never contradict the maths.
import { useRef } from 'react';
import { evaluate, formatNumber, type Env } from '@/lib/expr';
import type { Param, Scene } from '@/lib/recipe';
import { Pins } from './Graph2D';
import { tone, useSize } from './runtime';

type NW = Extract<Scene, { type: 'nextWord' }>;
type TK = Extract<Scene, { type: 'tokens' }>;
type EM = Extract<Scene, { type: 'embedding' }>;
type DS = Extract<Scene, { type: 'descent' }>;
type Common = { env: Env; focus: string[]; callouts?: Record<string, string>; onTap?: (id: string) => void };

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
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.45 : 1);
  return (
    <div className="absolute inset-0 flex select-none flex-col overflow-y-auto px-3 pb-2">
      <Caption text={scene.caption} />
      {/* the sentence so far, with the blank the model must fill */}
      <p className="mt-2 text-center font-serif text-[22px] leading-snug text-ink">
        {scene.context} <span className="inline-block min-w-[70px] rounded-lg border-2 border-dashed border-[var(--t-primary)] px-2 text-[var(--t-primary)]">{pick >= 0 && scene.words[pick] ? scene.words[pick].label : '?'}</span>
      </p>
      <ul className="mx-auto mt-4 w-full max-w-[520px] space-y-2">
        {scene.words.map((w, i) => (
          <li key={w.id} style={{ opacity: dim(w.id) }}>
            <button
              type="button" disabled={!onTap} onClick={onTap ? () => onTap(w.id) : undefined}
              className={`grid w-full grid-cols-[minmax(64px,28%)_1fr_56px] items-center gap-2 rounded-xl px-2 py-1 text-left ${onTap ? 'cursor-pointer ring-2 ring-[var(--t-primary)]/30' : ''} ${focus.includes(w.id) || i === pick ? 'bg-sunk' : ''}`}
            >
              <span className="truncate text-[17px] font-semibold text-ink">{w.label}{callouts[w.id] ? <span className="ml-1.5 text-[13px] font-medium text-ink-2">· {callouts[w.id]}</span> : null}</span>
              <span className="h-6 overflow-hidden rounded-full bg-sunk">
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
export function Tokens({ scene, env, focus, callouts = {}, onTap }: { scene: TK } & Common) {
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
      <p className="mt-4 text-center text-[17px] font-bold tabular-nums text-ink">{scene.pieces.length} tokens</p>
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
  if (q) anchors.query = [X(q.x), Y(q.y)];
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.45 : 1);
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
                <text x={X(p.x) + 13} y={Y(p.y) + 5} fontSize={16} fontWeight={700} fill={colour(p.group)} stroke="var(--paper)" strokeWidth={4} paintOrder="stroke" fontFamily="var(--font-sans)">{p.label}</text>
              </g>
            ))}
            {q && scene.query && (
              <g opacity={dim('query')}>
                <circle cx={X(q.x)} cy={Y(q.y)} r={22} fill="var(--t-red)" fillOpacity={0.15} />
                <circle cx={X(q.x)} cy={Y(q.y)} r={12} fill="var(--t-red)" stroke="var(--surface)" strokeWidth={3} />
                <text x={X(q.x) + 16} y={Y(q.y) - 12} fontSize={17} fontWeight={800} fill="var(--t-red)" stroke="var(--paper)" strokeWidth={4} paintOrder="stroke" fontFamily="var(--font-sans)">{scene.query.label}</text>
                {(qx || qy) && <circle cx={X(q.x)} cy={Y(q.y)} r={30} fill="transparent" style={{ cursor: 'grab', touchAction: 'none' }} role="slider" aria-label={`Drag ${scene.query.label}`} onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); dragging.current = true; }} />}
              </g>
            )}
            <Pins w={w} h={h} pins={Object.entries(callouts).filter(([id]) => anchors[id]).map(([id, text]) => ({ id, text, at: anchors[id] }))} />
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

export function Descent({ scene, env, params, onDrag, focus, callouts = {}, onTap }: { scene: DS; params: Param[]; onDrag: (v: Record<string, number>) => void } & Common) {
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
  const padL = 40, padR = 16, padT = 16, padB = 34;
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
            {scene.yLabel && <text x={padL + 4} y={padT + 12} fontSize={14} fontWeight={600} fill="var(--ink-2)" fontFamily="var(--font-sans)">↑ {scene.yLabel}</text>}
            <path d={d} fill="none" stroke="var(--t-primary)" strokeWidth={3.5} strokeLinecap="round" />
            {/* the slope where the ball stands */}
            <line x1={X(wv - tl)} y1={Y(L(wv) - slope * tl)} x2={X(wv + tl)} y2={Y(L(wv) + slope * tl)} stroke="var(--t-accent)" strokeWidth={3} strokeLinecap="round" opacity={0.9} />
            {/* the next steps, computed: hops along the curve, so an overshoot really jumps past the bottom */}
            {path.slice(1).map((p, i) => {
              const from = path[i];
              const x1 = X(from), y1 = Y(L(from)), x2 = X(p), y2 = Y(L(p));
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
        <span className="rounded-full border border-line bg-surface px-3 py-1 text-[15px] font-semibold tabular-nums">slope: {formatNumber(slope)}</span>
      </div>
    </div>
  );
}
