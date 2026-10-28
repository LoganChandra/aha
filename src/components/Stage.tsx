'use client';
// Hosts one lesson scene: picks the renderer, owns the clock, shows the play control when the scene moves.
import dynamic from 'next/dynamic';
import { memo } from 'react';
import type { Env } from '@/lib/expr';
import type { Lesson } from '@/lib/recipe';
import Chart from './scene/Chart';
import Diagram from './scene/Diagram';
import Graph2D from './scene/Graph2D';
import { useClock } from './scene/runtime';
import Timeline from './scene/Timeline';
import Balance from './scene/Balance';
import IconArray from './scene/IconArray';
import Pipeline from './scene/Pipeline';

// three.js is only downloaded when a lesson actually has a 3D model.
const Model3D = dynamic(() => import('./scene/Model3D'), { ssr: false, loading: () => <div className="shimmer absolute inset-6 rounded-[var(--radius)]" /> });

type Props = {
  lesson: Lesson;
  env: Env;
  focus: string[];
  playing: boolean;
  onDrag: (v: Record<string, number>) => void;
  callouts?: Record<string, string>;
  onTap?: (id: string) => void;
  guide?: { param: string; target: number };
};

function StageInner({ lesson, env, focus, playing, onDrag, callouts, onTap, guide }: Props) {
  const t = useClock(playing);
  const e = { ...env, t };
  const s = lesson.scene;
  switch (s.type) {
    case 'graph2d': return <Graph2D scene={s} env={e} focus={focus} params={lesson.params} onDrag={onDrag} callouts={callouts} onTap={onTap} guide={guide} />;
    case 'diagram': return <Diagram scene={s} env={e} focus={focus} t={t} playing={playing} callouts={callouts} onTap={onTap} />;
    case 'model3d': return <Model3D scene={s} env={e} focus={focus} t={t} playing={playing} callouts={callouts} onTap={onTap} />;
    case 'chart': return <Chart scene={s} env={e} focus={focus} callouts={callouts} onTap={onTap} />;
    case 'timeline': return <Timeline scene={s} focus={focus} callouts={callouts} onTap={onTap} />;
    case 'pipeline': return <Pipeline scene={s} env={e} focus={focus} t={t} playing={playing} callouts={callouts} onTap={onTap} />;
    case 'iconArray': return <IconArray scene={s} env={e} focus={focus} callouts={callouts} onTap={onTap} />;
    case 'balance': return <Balance scene={s} env={e} focus={focus} callouts={callouts} onTap={onTap} />;
  }
}

export default memo(StageInner);
