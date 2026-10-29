'use client';
// Right-triangle template for trigonometry (blind panel 2026-10-29, Aisyah: labels collided, the answer was printed
// before the question, the 15px dot was hard to drag, the triangle did not redraw). Layout and maths are ours: the
// learner drags the top corner, the triangle redraws live, lengths and sin/cos/tan are computed, names can wait.
import { useRef } from 'react';
import { evaluate, formatNumber, type Env } from '@/lib/expr';
import type { Param, Scene } from '@/lib/recipe';
import { Pins } from './Graph2D';
import { useSize } from './runtime';

type RT = Extract<Scene, { type: 'rightTriangle' }>;

export default function RightTriangle({ scene, env, params, onDrag, focus, callouts = {}, onTap, guide }: {
  scene: RT; env: Env; params: Param[]; onDrag: (v: Record<string, number>) => void; focus: string[]; callouts?: Record<string, string>; onTap?: (id: string) => void; guide?: { param: string; target: number };
}) {
  const [box, size] = useSize<HTMLDivElement>();
  const { w, h } = size;
  const svg = useRef<SVGSVGElement>(null);
  const deg = Math.max(5, Math.min(85, evaluate(scene.angle, env, 35)));
  const H = Math.max(0.1, scene.hyp !== undefined ? evaluate(scene.hyp, env, 10) : 10);
  const th = (deg * Math.PI) / 180;
  const opp = H * Math.sin(th), adj = H * Math.cos(th);
  const on = (v: RT['showNames']) => (v === undefined ? true : evaluate(v, env, 1) >= 0.5);
  const showNames = on(scene.showNames), showLen = scene.showLengths !== undefined && on(scene.showLengths), showRat = scene.showRatios !== undefined && on(scene.showRatios);
  // Fit the largest triangle the angle range can make, so the picture does not jump as the angle changes.
  const padX = 70, padTop = 40, padBot = 64;
  const k = Math.min((w - 2 * padX) / H, (h - padTop - padBot) / H);
  const A: [number, number] = [w / 2 - (adj * k) / 2, h - padBot];
  const C: [number, number] = [A[0] + adj * k, A[1]];
  const B: [number, number] = [C[0], C[1] - opp * k];
  const knob = params.find((p) => p.id === String(scene.angle).trim());
  const dragging = useRef(false);
  const move = (e: React.PointerEvent) => {
    if (!dragging.current || !knob || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const a = (Math.atan2(A[1] - (e.clientY - r.top), e.clientX - r.left - A[0]) * 180) / Math.PI;
    onDrag({ [knob.id]: Math.max(knob.min, Math.min(knob.max, a)) });
  };
  const hot = (id: string) => focus.includes(id);
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.6 : 1);
  const side = (id: 'opp' | 'adj' | 'hyp', p: [number, number], q: [number, number], color: string, len: number, labelAt: [number, number], anchor: 'start' | 'end' | 'middle') => (
    <g key={id} opacity={dim(id)} onClick={onTap ? () => onTap(id) : undefined} style={onTap ? { cursor: 'pointer' } : undefined}>
      <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={color} strokeWidth={hot(id) ? 9 : 6} strokeLinecap="round" />
      {onTap && <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="transparent" strokeWidth={44} />}
      <g fontFamily="var(--font-sans)" textAnchor={anchor} fill={color} stroke="var(--paper)" strokeWidth={5} paintOrder="stroke">
        {showNames && <text x={labelAt[0]} y={labelAt[1]} fontSize={17} fontWeight={800}>{scene.names[id]}</text>}
        {showLen && <text x={labelAt[0]} y={labelAt[1] + (showNames ? 20 : 0)} fontSize={15} fontWeight={700} fill="var(--ink)">{formatNumber(len)}{scene.unit ? ` ${scene.unit}` : ''}</text>}
      </g>
    </g>
  );
  const arc = Math.min(46, adj * k * 0.35);
  const gx = guide && knob && guide.param === knob.id ? guide.target : null;
  return (
    <div className="absolute inset-0 flex select-none flex-col">
      {scene.caption && <p className="shrink-0 px-3 pt-1 text-center text-[15px] font-semibold leading-snug text-ink-2">{scene.caption}</p>}
      {showRat && (
        <div className="flex shrink-0 flex-wrap justify-center gap-1.5 px-2 pt-1" aria-live="polite">
          {[['sin', opp / H], ['cos', adj / H], ['tan', opp / adj]].map(([n, v]) => (
            <span key={n as string} className="rounded-full border border-line bg-surface px-3 py-1 text-[15px] font-semibold tabular-nums">{n} {formatNumber(deg)}° = {formatNumber(v as number)}</span>
          ))}
        </div>
      )}
      <div ref={box} className="relative min-h-0 flex-1">
        {w > 0 && (
          <svg ref={svg} width={w} height={h} className="block" role="img" aria-label={scene.caption ?? 'Right triangle'} onPointerMove={move} onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}>
            <polygon points={`${A.join(',')} ${B.join(',')} ${C.join(',')}`} fill="var(--t-primary)" fillOpacity={0.08} />
            {/* right-angle mark and the angle arc */}
            <path d={`M${C[0] - 16},${C[1]} L${C[0] - 16},${C[1] - 16} L${C[0]},${C[1] - 16}`} fill="none" stroke="var(--ink-3)" strokeWidth={2} />
            <g opacity={dim('angle')} onClick={onTap ? () => onTap('angle') : undefined}>
              <path d={`M${A[0] + arc},${A[1]} A${arc},${arc} 0 0 0 ${A[0] + arc * Math.cos(th)},${A[1] - arc * Math.sin(th)}`} fill="none" stroke="var(--t-accent)" strokeWidth={4} />
              <text x={A[0] + arc + 10} y={A[1] - 10} fontSize={17} fontWeight={800} fill="var(--t-accent)" fontFamily="var(--font-sans)" stroke="var(--paper)" strokeWidth={5} paintOrder="stroke">{scene.names.angle ?? 'θ'} = {Math.round(deg)}°</text>
            </g>
            {side('adj', A, C, 'var(--t-green)', adj, [(A[0] + C[0]) / 2, A[1] + 30], 'middle')}
            {side('opp', C, B, 'var(--t-red)', opp, [C[0] + 14, (B[1] + C[1]) / 2 + 6], 'start')}
            {side('hyp', A, B, 'var(--t-primary)', H, [(A[0] + B[0]) / 2 - 14, (A[1] + B[1]) / 2 - 12], 'end')}
            {gx !== null && <circle className="pulse-ring" cx={A[0] + Math.cos((gx * Math.PI) / 180) * H * k} cy={A[1] - Math.sin((gx * Math.PI) / 180) * H * k} r={16} fill="none" stroke="var(--t-primary)" strokeWidth={3} />}
            {/* the corner the learner drags: big, ringed, never under a label */}
            {knob && (
              <g>
                <circle cx={B[0]} cy={B[1]} r={24} fill="var(--t-primary)" fillOpacity={0.16} />
                <circle cx={B[0]} cy={B[1]} r={13} fill="var(--t-primary)" stroke="var(--surface)" strokeWidth={4} />
                <circle cx={B[0]} cy={B[1]} r={32} fill="transparent" style={{ cursor: 'grab', touchAction: 'none' }} role="slider" aria-label={knob.label} aria-valuenow={Math.round(deg)} onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); dragging.current = true; }} />
              </g>
            )}
            <Pins w={w} h={h} pins={Object.entries(callouts).filter(([id]) => ['opp', 'adj', 'hyp', 'angle'].includes(id)).map(([id, text]) => ({ id, text, at: id === 'adj' ? [(A[0] + C[0]) / 2, A[1]] as [number, number] : id === 'opp' ? [C[0], (B[1] + C[1]) / 2] as [number, number] : id === 'hyp' ? [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2] as [number, number] : A }))} />
          </svg>
        )}
      </div>
    </div>
  );
}
