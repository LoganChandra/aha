'use client';
// Timeline: events in order down a single rail. The beat's focus lifts the events it talks about.
import { useEffect, useRef } from 'react';
import type { Scene } from '@/lib/recipe';
import { tone } from './runtime';

type T = Extract<Scene, { type: 'timeline' }>;

export default function Timeline({ scene, focus, callouts = {}, onTap }: { scene: T; focus: string[]; callouts?: Record<string, string>; onTap?: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Keep the first focused event in view as the beats move on.
    const el = ref.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(focus[0] ?? '')}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focus]);
  return (
    <div ref={ref} className="no-scrollbar absolute inset-0 overflow-y-auto px-5 py-6 sm:px-10">
      <ol className="relative mx-auto max-w-[560px]">
        <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-line" aria-hidden />
        {scene.events.map((e) => {
          const on = focus.includes(e.id);
          const op = focus.length && !on ? 0.35 : 1;
          return (
            <li key={e.id} data-id={e.id} className={`relative pb-5 pl-8 last:pb-0 ${onTap ? 'cursor-pointer' : ''}`} style={{ opacity: op, transition: 'opacity 300ms' }} onClick={onTap ? () => onTap(e.id) : undefined} role={onTap ? 'button' : undefined}>
              <span
                className="absolute left-0 top-[5px] h-4 w-4 rounded-full border-2 bg-surface"
                style={{ borderColor: tone(e.tone), background: on ? tone(e.tone) : undefined }}
              />
              <div className="text-[14px] font-semibold tracking-wide text-ink-3 tabular-nums">{e.when}</div>
              <div className="text-[18px] font-semibold text-ink">{e.label}</div>
              {e.detail && <div className="mt-1 text-[15.5px] leading-snug text-ink-2">{e.detail}</div>}
              {callouts[e.id] && <div className="mt-1.5 inline-block rounded-full bg-ink px-2.5 py-0.5 text-[12px] font-semibold text-paper">{callouts[e.id]}</div>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
