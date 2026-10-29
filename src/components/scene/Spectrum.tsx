'use client';
// Spectrum template: a scale with a marker (wavelength and colour, pH, temperature). The marker's place and its
// readout come from one mapping, so the number always agrees with the end labels (blind panel 2026-10-29: the old
// free-drawn rainbow read 407 nm at the end labelled "red 700 nm"). Drag along the bar, or use the slider below.
import { useRef } from 'react';
import { evaluate, formatNumber, type Env } from '@/lib/expr';
import type { Param, Scene } from '@/lib/recipe';
import { Pins } from './Graph2D';
import { useSize } from './runtime';

type S = Extract<Scene, { type: 'spectrum' }>;

/** Visible light, 380-750 nm, to a colour (after Dan Bruton's approximation, a common public-domain formula). */
function wavelengthColor(nm: number): string {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }
  const f = nm < 420 ? 0.35 + (0.65 * (nm - 380)) / 40 : nm > 700 ? 0.35 + (0.65 * (750 - nm)) / 50 : 1;
  const c = (v: number) => Math.round(255 * Math.max(0, Math.min(1, v * f)) ** 0.8);
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}
function colorAt(kind: S['colors'], t: number, v: number): string {
  if (kind === 'light') return wavelengthColor(Math.max(380, Math.min(750, v)));
  if (kind === 'heat') return `hsl(${Math.round(220 - 220 * t)} 80% 52%)`;
  if (kind === 'acid') return `hsl(${Math.round(t * 280)} 70% 50%)`;
  return `color-mix(in oklab, var(--t-primary) ${Math.round(25 + 75 * t)}%, var(--surface))`;
}

export default function Spectrum({ scene, env, params, onDrag, focus, callouts = {}, onTap, guide }: {
  scene: S; env: Env; params: Param[]; onDrag: (v: Record<string, number>) => void; focus: string[]; callouts?: Record<string, string>; onTap?: (id: string) => void; guide?: { param: string; target: number };
}) {
  const [box, size] = useSize<HTMLDivElement>();
  const { w, h } = size;
  const svg = useRef<SVGSVGElement>(null);
  const a = scene.from.value, b = scene.to.value;
  const v = evaluate(scene.marker, env, a);
  const t = Math.max(0, Math.min(1, (v - a) / (b - a || 1)));
  const pad = 28, x0 = pad, x1 = w - pad, barH = Math.min(64, Math.max(40, h * 0.12));
  // Stack top to bottom (readout, bar, end labels, marks, readouts) and centre the stack, so nothing collides when a
  // tall task card leaves little room (panel walk: the readout ran into the caption).
  const hasMarks = (scene.marks ?? []).length > 0, hasReads = (scene.readouts ?? []).length > 0;
  const stackH = 76 + barH + 54 + (hasMarks ? 36 : 0) + (hasReads ? 66 : 0);
  const barY = Math.max(4, (h - stackH) / 2) + 76;
  const marksY = barY + barH + 54 + 22, readY = barY + barH + 54 + (hasMarks ? 36 : 0) + 52;
  const X = (val: number) => x0 + ((val - a) / (b - a || 1)) * (x1 - x0);
  const mx = x0 + t * (x1 - x0);
  // The marker is draggable when it is a knob itself.
  const knob = params.find((p) => p.id === String(scene.marker).trim());
  const dragging = useRef(false);
  const move = (clientX: number) => {
    if (!knob || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const tt = Math.max(0, Math.min(1, (clientX - r.left - x0) / (x1 - x0)));
    const val = a + tt * (b - a);
    onDrag({ [knob.id]: Math.max(knob.min, Math.min(knob.max, val)) });
  };
  const stops = Array.from({ length: 13 }, (_, i) => i / 12);
  const unit = scene.unit ? ` ${scene.unit}` : '';
  const anchors: Record<string, [number, number]> = { marker: [mx, barY - 6] };
  (scene.marks ?? []).forEach((m) => { anchors[m.id] = [X(m.at), barY + barH + 6]; });
  const dim = (id: string) => (focus.length && !focus.includes(id) ? 0.5 : 1);
  const gx = guide && knob && guide.param === knob.id ? X(guide.target) : null;
  return (
    <div className="absolute inset-0 flex select-none flex-col">
      {scene.caption && <p className="shrink-0 px-3 pt-1 text-center text-[15px] font-semibold leading-snug text-ink-2">{scene.caption}</p>}
      <div ref={box} className="relative min-h-0 flex-1">
      {w > 0 && (
        <svg
          ref={svg} width={w} height={h} className="block" role="img" aria-label={scene.caption ?? `${scene.from.label} to ${scene.to.label}`}
          onPointerMove={(e) => dragging.current && move(e.clientX)} onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}
        >
          <defs>
            <linearGradient id="spec-grad" x1="0" x2="1" y1="0" y2="0">
              {stops.map((s) => <stop key={s} offset={`${s * 100}%`} stopColor={colorAt(scene.colors, s, a + s * (b - a))} />)}
            </linearGradient>
          </defs>
          {/* the bar: full-strength colours, a touch of depth */}
          <rect x={x0} y={barY} width={x1 - x0} height={barH} rx={14} fill="url(#spec-grad)" stroke="var(--line-2)" strokeWidth={1}
            style={{ cursor: knob ? 'pointer' : undefined, touchAction: 'none' }}
            onPointerDown={(e) => { if (!knob) return; (e.target as Element).setPointerCapture(e.pointerId); dragging.current = true; move(e.clientX); }} />
          {/* where a slide task wants the marker */}
          {gx !== null && <rect className="pulse-ring" x={gx - 10} y={barY - 6} width={20} height={barH + 12} rx={8} fill="none" stroke="var(--t-primary)" strokeWidth={3} style={{ pointerEvents: 'none' }} />}
          {(scene.marks ?? []).map((m) => (
            <g key={m.id} opacity={dim(m.id)} onClick={onTap ? () => onTap(m.id) : undefined} style={onTap ? { cursor: 'pointer' } : undefined}>
              <line x1={X(m.at)} x2={X(m.at)} y1={barY + barH} y2={marksY - 16} stroke="var(--ink-3)" strokeWidth={1.5} strokeDasharray="3 3" />
              <text x={X(m.at)} y={marksY} textAnchor="middle" fontSize={15} fontWeight={650} fill="var(--ink)" fontFamily="var(--font-sans)">{m.label}</text>
              {onTap && <circle cx={X(m.at)} cy={barY + barH / 2} r={26} fill="transparent" />}
              {onTap && <circle className="pulse-ring" cx={X(m.at)} cy={barY + barH / 2} r={18} fill="none" stroke="var(--t-primary)" strokeWidth={3} style={{ pointerEvents: 'none' }} />}
            </g>
          ))}
          {/* end labels: the words and the numbers, under each end */}
          <g fontFamily="var(--font-sans)" fill="var(--ink)" stroke="var(--paper)" strokeWidth={6} paintOrder="stroke" strokeLinejoin="round">
            <text x={x0} y={barY + barH + 26} fontSize={17} fontWeight={700}>{scene.from.label}</text>
            <text x={x0} y={barY + barH + 48} fontSize={15} fill="var(--ink-2)" fontWeight={600}>{formatNumber(a)}{unit}</text>
            <text x={x1} y={barY + barH + 26} fontSize={17} fontWeight={700} textAnchor="end">{scene.to.label}</text>
            <text x={x1} y={barY + barH + 48} fontSize={15} fill="var(--ink-2)" fontWeight={600} textAnchor="end">{formatNumber(b)}{unit}</text>
          </g>
          {/* the marker: a line through the bar, a big handle, and its live value above */}
          <g opacity={dim('marker')} style={{ pointerEvents: knob ? undefined : 'none' }}>
            <line x1={mx} x2={mx} y1={barY - 10} y2={barY + barH + 10} stroke="var(--ink)" strokeWidth={3} />
            <circle cx={mx} cy={barY - 18} r={13} fill={colorAt(scene.colors, t, v)} stroke="var(--surface)" strokeWidth={4} />
            {knob && <circle cx={mx} cy={barY + barH / 2} r={34} fill="transparent" style={{ cursor: 'grab', touchAction: 'none' }} role="slider" aria-label={knob.label} aria-valuenow={v}
              onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); dragging.current = true; }} />}
            <g fontFamily="var(--font-sans)" textAnchor="middle">
              {scene.markerLabel && <text x={Math.max(70, Math.min(w - 70, mx))} y={barY - 66} fontSize={15} fontWeight={600} fill="var(--ink-2)">{scene.markerLabel}</text>}
              <text x={Math.max(70, Math.min(w - 70, mx))} y={barY - 42} fontSize={22} fontWeight={800} fill="var(--ink)">{formatNumber(v)}{unit}</text>
            </g>
          </g>
          {/* readouts that follow the marker, big and centred under the scale */}
          {(scene.readouts ?? []).length > 0 && (
            <g fontFamily="var(--font-sans)" textAnchor="middle">
              {(scene.readouts ?? []).map((r, i, all) => {
                const cx = w * ((i + 0.5) / all.length), y = readY;
                return (
                  <g key={i}>
                    <text x={cx} y={y - 26} fontSize={15} fontWeight={600} fill="var(--ink-2)">{r.label}</text>
                    <text x={cx} y={y} fontSize={26} fontWeight={800} fill={r.tone ? `var(--t-${r.tone})` : 'var(--ink)'}>{formatNumber(evaluate(r.value, env, 0))}{r.unit ? ` ${r.unit}` : ''}</text>
                  </g>
                );
              })}
            </g>
          )}
          <Pins w={w} h={h} pins={Object.entries(callouts).filter(([id]) => anchors[id]).map(([id, text]) => ({ id, text, at: anchors[id] }))} />
        </svg>
      )}
      </div>
      <span className="sr-only" aria-live="polite">{`${formatNumber(v)}${unit}`}</span>
    </div>
  );
}
