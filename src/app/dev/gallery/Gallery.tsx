// Dev-only page; set-state-in-effect is fine here.
/* eslint-disable react-hooks/set-state-in-effect */
'use client';
// Development only: render one bake-off lesson per page (?f=file&b=beat) for screenshot checks.
import { useEffect, useState } from 'react';
import RichText from '@/components/RichText';
import Stage from '@/components/Stage';
import type { Env } from '@/lib/expr';
import type { Lesson } from '@/lib/recipe';

export default function Gallery() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [env, setEnv] = useState<Env>({});
  const [f, setF] = useState<string | null | undefined>(undefined);
  const [b, setB] = useState(0);
  useEffect(() => { const q = new URLSearchParams(window.location.search); setF(q.get('f')); setB(Number(q.get('b') ?? 0)); }, []);
  useEffect(() => {
    if (f === undefined) return;
    if (!f) { fetch('/api/dev/fixtures').then((r) => r.json()).then(setFiles); return; }
    fetch(`/api/dev/fixtures?f=${encodeURIComponent(f)}`).then((r) => r.json()).then((d) => {
      setLesson(d.lesson); setErrors(d.errors);
      const e: Env = {};
      for (const p of d.lesson?.params ?? []) e[p.id] = p.value;
      for (let i = 0; i <= b; i++) Object.assign(e, d.lesson?.steps[i]?.set ?? {});
      setEnv(e);
    });
  }, [f, b]);
  if (!f) return <ul className="p-6 text-sm">{files.map((x) => <li key={x}><a className="underline" href={`?f=${x}`}>{x}</a></li>)}</ul>;
  if (!lesson) return <p className="p-6">{errors.join(' | ') || 'loading'}</p>;
  const beat = lesson.steps[Math.min(b, lesson.steps.length - 1)];
  const callouts = Object.fromEntries((beat.callouts ?? []).map((c) => [c.at, c.text]));
  return (
    <main className="flex h-[100dvh] flex-col gap-3 p-3">
      <h1 className="font-serif text-xl">{lesson.title} <span className="text-xs text-ink-3">{lesson.scene.type} {errors.length ? `ERR ${errors.length}` : ''}</span></h1>
      <div className="relative h-[55dvh] rounded-[14px] border border-line bg-surface"><Stage lesson={lesson} env={env} focus={beat.focus ?? []} playing={false} callouts={callouts} onDrag={(v) => setEnv((e) => ({ ...e, ...v }))} /></div>
      <p className="font-serif text-[18px] leading-relaxed"><RichText text={beat.say} env={env} /></p>
    </main>
  );
}
