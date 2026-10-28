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

/** Knob values follow their targets with a spring (slightly under-damped, ~0.6 s), so every change moves like a
 * physical thing settling, not a tween. With `instant` (a finger on a knob, or reduced motion) they follow at once. */
export function useGlide(target: Env, instant: boolean): Env {
  const [shown, setShown] = useState<Env>(target);
  const pos = useRef<Env>(target);
  const vel = useRef<Env>({});
  useEffect(() => {
    if (instant) {
      pos.current = { ...target };
      vel.current = {};
      setShown(pos.current);
      return;
    }
    const K = 170, C = 2 * Math.sqrt(K) * 0.82; // stiffness and damping: a hint of overshoot, then still
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const next: Env = {};
      let moving = false;
      for (const k of Object.keys(target)) {
        const x = pos.current[k] ?? target[k], v = vel.current[k] ?? 0;
        const span = Math.max(1e-6, Math.abs(target[k]) * 0.001 + 1e-4);
        const a = -K * (x - target[k]) - C * v;
        const nv = v + a * dt, nx = x + nv * dt;
        if (Math.abs(nx - target[k]) < span && Math.abs(nv) < span * 10) { next[k] = target[k]; vel.current[k] = 0; }
        else { next[k] = nx; vel.current[k] = nv; moving = true; }
      }
      pos.current = next;
      setShown(next);
      if (moving) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, instant]);
  return shown;
}

/** Size of an element that may mount later (a callback ref, so the observer attaches whenever the node appears). */
export function useSize<T extends HTMLElement>(): [(el: T | null) => void, { w: number; h: number }] {
  const [el, setEl] = useState<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      setSize((s) => (Math.abs(s.w - r.width) < 1 && Math.abs(s.h - r.height) < 1 ? s : { w: r.width, h: r.height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, size];
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
