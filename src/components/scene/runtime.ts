'use client';
// Shared scene runtime: the clock (t), knob values that glide to new targets, element size, colours.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { compile, type Env } from '@/lib/expr';

export const tone = (t?: string) => `var(--t-${t ?? 'primary'})`;

const reducedQuery = '(prefers-reduced-motion: reduce)';
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(reducedQuery); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => window.matchMedia(reducedQuery).matches,
    () => false,
  );
}

/** Seconds since play started; stands still while paused. */
export function useClock(playing: boolean): number {
  const [t, setT] = useState(0);
  const base = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const start = performance.now() - base.current * 1000;
    const tick = (now: number) => {
      base.current = (now - start) / 1000;
      setT(base.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  return t;
}

/** Knob values that glide to their targets (ease-out, about 0.7s) so the learner sees the change happen.
 * With `instant` (a finger on a knob, or reduced motion) they follow at once. */
export function useGlide(target: Env, instant: boolean): Env {
  const [shown, setShown] = useState<Env>(target);
  const shownRef = useRef<Env>(target);
  useEffect(() => {
    const from = shownRef.current;
    const changed = Object.keys(target).some((k) => target[k] !== from[k]) || Object.keys(from).length !== Object.keys(target).length;
    if (!changed) return;
    const start = performance.now();
    const dur = instant ? 0 : 700;
    let raf = 0;
    const step = (now: number) => {
      const p = dur ? Math.min(1, (now - start) / dur) : 1;
      const e = 1 - Math.pow(1 - p, 3);
      const next: Env = {};
      for (const k of Object.keys(target)) {
        const a = from[k] ?? target[k];
        next[k] = a + (target[k] - a) * e;
      }
      shownRef.current = next;
      setShown(next);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, instant]);
  return shown;
}

export function useSize<T extends HTMLElement>(): [React.RefObject<T | null>, { w: number; h: number }] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      setSize((s) => (Math.abs(s.w - r.width) < 1 && Math.abs(s.h - r.height) < 1 ? s : { w: r.width, h: r.height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

/** Does any expression in this scene use t? Then the scene has motion and gets a play button. */
export function usesTime(value: unknown): boolean {
  const seen: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') seen.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(value);
  return seen.some((s) => {
    const parts = [s, ...[...s.matchAll(/\{([^{}]+)\}/g)].map((m) => m[1])];
    return parts.some((src) => { try { return compile(src).vars.includes('t'); } catch { return false; } });
  });
}
