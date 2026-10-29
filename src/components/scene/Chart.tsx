'use client';
// Charts: horizontal bars (labels stay readable on a phone) or lines on the 2D graph's axes.
import { evaluate, formatNumber, type Env } from '@/lib/expr';
import type { Scene } from '@/lib/recipe';
import Graph2D, { type Polyline } from './Graph2D';
import { tone, useSize } from './runtime';

type C = Extract<Scene, { type: 'chart' }>;

type Extra = { callouts?: Record<string, string>; onTap?: (id: string) => void };

export default function Chart({ scene, env, focus, callouts, onTap }: { scene: C; env: Env; focus: string[] } & Extra) {
  if (scene.kind === 'line' && scene.series?.length) return <LineChart scene={scene} env={env} focus={focus} callouts={callouts} onTap={onTap} />;
  return <Bars scene={scene} env={env} focus={focus} callouts={callouts} onTap={onTap} />;
}

function Bars({ scene, env, focus, callouts = {}, onTap }: { scene: C; env: Env; focus: string[] } & Extra) {
  const [box, size] = useSize<HTMLDivElement>();
  const bars = (scene.bars ?? []).map((b) => ({ ...b, v: evaluate(b.value, env, 0) }));
  const max = Math.max(1e-9, ...bars.map((b) => Math.abs(b.v)));
  // Long names go above their bar instead of being cut to "2026 AI b..." (walk 2026-10-29).
  const stacked = bars.some((b) => b.label.length > 12) && size.w < 640;
  const rowH = stacked ? Math.min(56, Math.max(22, (size.h - 48) / Math.max(1, bars.length) - 34)) : Math.min(64, Math.max(40, (size.h - 40) / Math.max(1, bars.length)));
  return (
    <div ref={box} className={`absolute inset-0 flex flex-col overflow-y-auto px-5 py-4 sm:px-10 ${stacked ? 'justify-start' : 'justify-center'}`}>
      {scene.yLabel && <div className="mb-4 text-[17px] font-semibold text-ink">{scene.yLabel}</div>}
      <div className="flex flex-col" style={{ gap: Math.max(6, rowH * 0.22) }}>
        {bars.map((b) => {
          const op = focus.length && !focus.includes(b.id) ? 0.55 : 1;
          return (
            <div
              key={b.id} className={`grid items-center gap-3 rounded-lg ${onTap ? 'cursor-pointer hover:bg-sunk' : ''}`}
              style={{ gridTemplateColumns: stacked ? '1fr' : 'minmax(72px, 30%) 1fr', opacity: op, transition: 'opacity 300ms' }}
              onClick={onTap ? () => onTap(b.id) : undefined} role={onTap ? 'button' : undefined}
            >
              <div className={`${stacked ? 'text-left leading-tight' : 'truncate text-right'} text-[16px] font-semibold text-ink`} title={b.label}>{b.label}</div>
              <div className="flex items-center gap-2" style={{ height: rowH * 0.66 }}>
                <div
                  className="h-full rounded-[10px] shadow-sm"
                  style={{ width: `${(Math.abs(b.v) / max) * 82}%`, minWidth: 3, background: tone(b.tone), transition: 'width 500ms cubic-bezier(.2,.8,.2,1)' }}
                />
                <span className="shrink-0 text-[16px] font-bold tabular-nums text-ink">{formatNumber(b.v)}{scene.unit ? ` ${scene.unit}` : ''}</span>
                {callouts[b.id] && <span className="shrink-0 rounded-full bg-ink px-2.5 py-0.5 text-[12px] font-semibold text-paper">{callouts[b.id]}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineChart({ scene, env, focus, callouts, onTap }: { scene: C; env: Env; focus: string[] } & Extra) {
  const series = scene.series ?? [];
  const pts = series.flatMap((s) => s.points.map(([x, y]) => [evaluate(x, env, 0), evaluate(y, env, 0)]));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const pad = (a: number, b: number) => { const d = (b - a) || 1; return [a - d * 0.06, b + d * 0.1] as [number, number]; };
  const yMin = Math.min(0, ...ys);
  const items: Polyline[] = series.map((s) => ({ type: 'polyline', id: s.id, points: s.points, label: s.label, tone: s.tone }));
  return (
    <Graph2D
      scene={{ type: 'graph2d', x: pad(Math.min(...xs), Math.max(...xs)), y: pad(yMin, Math.max(...ys)), xLabel: scene.xLabel, yLabel: scene.yLabel, items }}
      env={env} focus={focus} params={[]} onDrag={() => {}} callouts={callouts} onTap={onTap}
    />
  );
}
