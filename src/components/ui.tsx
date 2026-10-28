'use client';
// Small UI pieces: the prompt bar, knobs, icons, buttons.
import { useEffect, useRef } from 'react';
import { formatNumber } from '@/lib/expr';
import type { Param } from '@/lib/recipe';

export function Icon({ name, size = 20 }: { name: 'arrow-up' | 'back' | 'play' | 'pause' | 'list' | 'close' | 'check' | 'reset' | 'link'; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (name) {
    case 'arrow-up': return <svg {...p}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
    case 'back': return <svg {...p}><path d="M15 18l-6-6 6-6" /></svg>;
    case 'play': return <svg {...p} fill="currentColor" stroke="none"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z" /></svg>;
    case 'pause': return <svg {...p} fill="currentColor" stroke="none"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>;
    case 'list': return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>;
    case 'close': return <svg {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>;
    case 'check': return <svg {...p}><path d="M20 6L9 17l-5-5" /></svg>;
    case 'reset': return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>;
    case 'link': return <svg {...p}><path d="M7 17L17 7M8 7h9v9" /></svg>;
  }
}

export function PromptBar({ value, onChange, onSubmit, placeholder, busy, autoFocus }: { value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string; busy?: boolean; autoFocus?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // On a slow phone connection people type before the page is interactive; keep what they typed.
  useEffect(() => {
    const typed = ref.current?.value;
    if (typed && !value) onChange(typed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(140, el.scrollHeight)}px`;
  }, [value]);
  const can = value.trim().length > 0 && !busy;
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (can) onSubmit(); }}
      className="flex items-end gap-2 rounded-[22px] border border-line bg-surface p-1.5 pl-4 shadow-[var(--shadow)] focus-within:border-line-2"
    >
      <label className="sr-only" htmlFor="prompt">{placeholder}</label>
      <textarea
        id="prompt" ref={ref} rows={1} value={value} autoFocus={autoFocus} maxLength={600}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (can) onSubmit(); } }}
        placeholder={placeholder} enterKeyHint="send"
        className="min-h-[40px] flex-1 resize-none bg-transparent py-[9px] text-[16px] leading-[22px] text-ink outline-none placeholder:text-ink-3"
      />
      <button
        type="submit" disabled={!can} aria-label="Send"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-opacity disabled:opacity-25"
      >
        {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" /> : <Icon name="arrow-up" size={19} />}
      </button>
    </form>
  );
}

export function Knob({ p, value, onChange }: { p: Param; value: number; onChange: (v: number) => void }) {
  const fill = ((value - p.min) / (p.max - p.min)) * 100;
  if (p.toggle) {
    const on = value >= (p.min + p.max) / 2;
    return (
      <div className="flex min-h-[40px] items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-ink-2">{p.label}</span>
        <button
          role="switch" aria-checked={on} aria-label={p.label}
          onClick={() => onChange(on ? p.min : p.max)}
          className={`relative h-[28px] w-[48px] rounded-full transition-colors ${on ? 'bg-[var(--t-primary)]' : 'bg-line-2'}`}
        >
          <span className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-[left] ${on ? 'left-[23px]' : 'left-[3px]'}`} />
        </button>
      </div>
    );
  }
  const step = p.step ?? (p.max - p.min) / 200;
  const value_ = <span className="min-w-[44px] shrink-0 whitespace-nowrap text-right text-[13px] font-semibold tabular-nums text-ink">{formatNumber(value)}{p.unit ? ` ${p.unit}` : ''}</span>;
  const input = (
    <input
      id={`k-${p.id}`} type="range" className="knob" min={p.min} max={p.max} step={step} value={value}
      style={{ ['--fill' as string]: `${fill}%` }}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
  // A long name gets its own line rather than being cut off.
  if (p.label.length > 16 || (p.unit?.length ?? 0) > 6) {
    return (
      <div className="pt-1">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={`k-${p.id}`} className="text-[13px] font-medium leading-tight text-ink-2">{p.label}</label>
          {value_}
        </div>
        {input}
      </div>
    );
  }
  return (
    <div className="grid min-h-[38px] grid-cols-[minmax(0,34%)_1fr_auto] items-center gap-3">
      <label htmlFor={`k-${p.id}`} className="text-[13px] font-medium leading-tight text-ink-2">{p.label}</label>
      {input}
      {value_}
    </div>
  );
}
