'use client';
// ProfAI: one prompt in, a lesson path out, each lesson taught by a visual you can play with.
// Home -> planning -> course. In a course the prompt bar is for questions: stop anywhere and ask.
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluate, type Env } from '@/lib/expr';
import { LEVEL_LABEL, LEVELS, type Lesson, type Level, type Plan, type Source } from '@/lib/recipe';
import RichText from './RichText';
import { useGlide, useReducedMotion, useSize, usesTime } from './scene/runtime';
import SceneBoundary from './SceneBoundary';
import Stage from './Stage';
import { Icon, Knob, PromptBar } from './ui';

type Course = { prompt: string; level: Level; planId: string; askToken: string; plan: Plan; sources: Source[] };
type Slot = { status: 'idle' | 'loading' | 'ready' | 'error'; lesson?: Lesson; error?: string };
type Answer = { q: string; a?: string; error?: string; pending: boolean };

const LEVEL_HINT: Record<Level, string> = {
  novice: 'New to it',
  beginner: 'Know a little',
  intermediate: 'Studied it',
  expert: 'Use it often',
  professional: 'Work in it',
};

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data as T;
}

export default function App() {
  const [view, setView] = useState<'home' | 'planning' | 'course'>('home');
  const [prompt, setPrompt] = useState('');
  const [level, setLevel] = useState<Level>('beginner');
  const [homeMsg, setHomeMsg] = useState<{ kind: 'clarify' | 'refuse' | 'error'; text: string; options?: string[] } | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const slotsRef = useRef<Slot[]>([]);
  // The course a lesson response belongs to; a response for an older course is dropped.
  const coursePlanId = useRef('');

  // Restore the last level choice on this device after hydration (the server cannot know it); nothing else is stored.
  useEffect(() => {
    try {
      const l = localStorage.getItem('profai-level') as Level | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (l && LEVELS.includes(l)) setLevel(l);
    } catch {}
  }, []);
  const pickLevel = (l: Level) => { setLevel(l); try { localStorage.setItem('profai-level', l); } catch {} };

  const loadLesson = useCallback(async (c: Course, i: number) => {
    if (i < 0 || i >= c.plan.lessons.length) return;
    const s = slotsRef.current[i];
    if (s && (s.status === 'loading' || s.status === 'ready')) return;
    const put = (slot: Slot) => {
      if (coursePlanId.current !== c.planId) return;
      slotsRef.current = slotsRef.current.map((s, j) => (j === i ? slot : s));
      setSlots(slotsRef.current);
    };
    put({ status: 'loading' });
    try {
      const { lesson } = await post<{ lesson: Lesson }>('/api/lesson', { plan: c.plan, sources: c.sources, level: c.level, planId: c.planId, index: i });
      put({ status: 'ready', lesson });
    } catch (e) {
      put({ status: 'error', error: (e as Error).message });
    }
  }, []);

  const retryLesson = useCallback((c: Course, i: number) => {
    slotsRef.current = slotsRef.current.map((s, j) => (j === i ? { status: 'idle' } : s));
    setSlots(slotsRef.current);
    loadLesson(c, i);
  }, [loadLesson]);

  async function start(text: string, lvl = level) {
    const p = text.trim();
    if (!p) return;
    setHomeMsg(null);
    setPrompt(p);
    setView('planning');
    try {
      coursePlanId.current = '';
      const r = await post<{ plan: Plan; sources: Source[]; planId: string; askToken: string; level: Level }>('/api/plan', { prompt: p, level: lvl });
      if (r.plan.status === 'clarify') {
        setHomeMsg({ kind: 'clarify', text: r.plan.question || 'What would you like to understand?', options: r.plan.options });
        setPrompt('');
        setView('home');
        return;
      }
      if (r.plan.status === 'refuse') {
        setHomeMsg({ kind: 'refuse', text: r.plan.reason || 'ProfAI cannot help with that one.' });
        setPrompt('');
        setView('home');
        return;
      }
      const c: Course = { prompt: p, level: lvl, planId: r.planId, askToken: r.askToken, plan: r.plan, sources: r.sources };
      coursePlanId.current = c.planId;
      const empty: Slot[] = r.plan.lessons.map(() => ({ status: 'idle' }));
      slotsRef.current = empty;
      setSlots(empty);
      setCourse(c);
      setPrompt('');
      setView('course');
      if (window.history.state?.profai !== 'course') window.history.pushState({ profai: 'course' }, '');
      loadLesson(c, 0);
    } catch (e) {
      setHomeMsg({ kind: 'error', text: (e as Error).message });
      setView('home');
    }
  }

  // The phone's back gesture leaves a course for the home screen instead of leaving ProfAI.
  useEffect(() => {
    const onPop = () => { coursePlanId.current = ''; setView((v) => (v === 'course' ? 'home' : v)); setCourse(null); setSlots([]); setHomeMsg(null); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function goHome() {
    coursePlanId.current = '';
    if (window.history.state?.profai === 'course') { window.history.back(); return; }
    setView('home');
    setCourse(null);
    setSlots([]);
    setHomeMsg(null);
    setPrompt('');
  }

  if (view === 'course' && course) {
    return <CourseView course={course} slots={slots} loadLesson={loadLesson} retryLesson={retryLesson} onHome={goHome} onRelevel={(l) => { pickLevel(l); start(course.prompt, l); }} />;
  }
  return (
    <Home
      prompt={prompt} setPrompt={setPrompt} level={level} setLevel={pickLevel}
      planning={view === 'planning'} msg={homeMsg} onSubmit={(t) => start(t)}
    />
  );
}

// ---------------------------------------------------------------- home

function Home({ prompt, setPrompt, level, setLevel, planning, msg, onSubmit }: {
  prompt: string; setPrompt: (s: string) => void; level: Level; setLevel: (l: Level) => void; planning: boolean;
  msg: { kind: 'clarify' | 'refuse' | 'error'; text: string; options?: string[] } | null; onSubmit: (t: string) => void;
}) {
  return (
    <main className="mx-auto flex h-[100dvh] max-w-[760px] flex-col px-4 sm:px-6">
      <header className="flex h-14 shrink-0 items-center">
        <span className="text-[17px] font-semibold tracking-[-0.01em] text-ink">ProfAI</span>
      </header>
      <section className="flex flex-1 flex-col justify-center pb-6">
        {planning ? (
          <Planning prompt={prompt} />
        ) : (
          <>
            <h1 className="font-serif text-[34px] leading-[1.1] tracking-[-0.015em] text-ink sm:text-[52px]">What do you want to understand?</h1>
            <div className="mt-7">
              <div className="mb-2 text-[13px] font-medium text-ink-3" id="level-label">Your level</div>
              <div role="radiogroup" aria-labelledby="level-label" className="flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l} role="radio" aria-checked={level === l} onClick={() => setLevel(l)}
                    className={`rounded-full border px-3.5 py-[7px] text-left transition-colors ${level === l ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink hover:border-line-2'}`}
                  >
                    <span className="block text-[14px] font-semibold leading-tight">{LEVEL_LABEL[l]}</span>
                    <span className={`block text-[11.5px] leading-tight ${level === l ? 'text-paper/70' : 'text-ink-3'}`}>{LEVEL_HINT[l]}</span>
                  </button>
                ))}
              </div>
            </div>
            {msg && (
              <div className={`mt-6 rounded-[var(--radius)] border px-4 py-3 ${msg.kind === 'error' ? 'border-[var(--t-red)]/40' : 'border-line'} bg-surface`} role="status">
                <p className="font-serif text-[17px] leading-snug text-ink">{msg.text}</p>
                {msg.options && msg.options.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.options.map((o) => (
                      <button key={o} onClick={() => onSubmit(o)} className="rounded-full border border-line px-3 py-1.5 text-[14px] text-ink hover:border-line-2">{o}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>
      <div className="shrink-0 pb-[max(14px,env(safe-area-inset-bottom))]">
        <PromptBar value={prompt} onChange={setPrompt} onSubmit={() => onSubmit(prompt)} placeholder="Type any topic" busy={planning} />
      </div>
    </main>
  );
}

/**
 * While the course is planned (5-15 s): the real stages, each appearing when it typically starts, and a bar that
 * eases toward the end without ever claiming to be done. Honest, calm, and it gives the eye somewhere to rest.
 */
function Planning({ prompt }: { prompt: string }) {
  const reduced = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const id = setInterval(() => setElapsed((performance.now() - t0) / 1000), 200);
    return () => clearInterval(id);
  }, []);
  const stages = [
    { at: 0, text: 'Reading up on it' },
    { at: 4, text: 'Choosing what to learn first' },
    { at: 10, text: 'Designing hands-on lessons' },
    { at: 20, text: 'Almost there' },
  ];
  const progress = 1 - Math.exp(-elapsed / 12); // approaches 1, never reaches it
  return (
    <div aria-live="polite">
      <p className="text-[13px] font-medium text-ink-3">Building your course</p>
      <h1 className="mt-2 font-serif text-[30px] leading-[1.15] tracking-[-0.01em] text-ink sm:text-[40px]">{prompt}</h1>
      <div className="mt-6 h-[3px] w-full max-w-[420px] overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-ink transition-[width] duration-200 ease-out" style={{ width: `${Math.round(progress * 92)}%` }} />
      </div>
      <ol className="mt-6 space-y-3">
        {stages.map((st, i) => {
          const started = elapsed >= st.at;
          const finished = i < stages.length - 1 && elapsed >= stages[i + 1].at;
          if (!started) return null;
          return (
            <motion.li
              key={st.text} className="flex items-center gap-3 text-[15px]"
              initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full ${finished ? 'bg-ink text-paper' : 'border-2 border-line-2'}`}>
                {finished ? <Icon name="check" size={12} /> : <span className={`h-1.5 w-1.5 rounded-full bg-ink-2 ${reduced ? '' : 'animate-pulse'}`} />}
              </span>
              <span className={finished ? 'text-ink-3' : 'font-medium text-ink'}>{st.text}</span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------- course

function CourseView({ course, slots, loadLesson, retryLesson, onHome, onRelevel }: {
  course: Course; slots: Slot[]; loadLesson: (c: Course, i: number) => void; retryLesson: (c: Course, i: number) => void; onHome: () => void; onRelevel: (l: Level) => void;
}) {
  const reduced = useReducedMotion();
  const [li, setLi] = useState(0);
  const [si, setSi] = useState(0);
  const [values, setValues] = useState<Record<number, Env>>({});
  // Per-lesson play state; until the learner or a step changes it, a moving scene plays (still under reduced motion).
  const [playState, setPlayState] = useState<Record<number, boolean>>({});
  const [askText, setAskText] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [answerFocus, setAnswerFocus] = useState<string[] | null>(null);
  // Knob values from before an answer moved them; "Back to the lesson" puts them back.
  const [beforeAnswer, setBeforeAnswer] = useState<Env | null>(null);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  // Bumped whenever the learner moves; an answer that arrives after a move is dropped.
  const askSeq = useRef(0);
  const [sheet, setSheet] = useState(false);
  const [asking, setAsking] = useState(false);
  // What happened on each step: done, the predict choice, a wrong tap (for the nudge).
  const [progress, setProgress] = useState<Record<string, { done?: boolean; pick?: number; miss?: number; shown?: boolean }>>({});
  const [instant, setInstant] = useState(false);
  // The caption and the control panel sit inside the scene; the drawing is laid out in the space between them.
  const [topRef, topSize] = useSize<HTMLDivElement>();
  const [botRef, botSize] = useSize<HTMLDivElement>();

  const slot = slots[li];
  const lesson = slot?.status === 'ready' ? slot.lesson! : null;
  const step = lesson ? lesson.steps[Math.min(si, lesson.steps.length - 1)] : null;
  const key = `${li}-${si}`;
  const sp = progress[key] ?? {};
  const task = step?.task;
  const done = !task || !!sp.done;
  const total = course.plan.lessons.length;
  const meta = course.plan.lessons[li];
  const lastStep = lesson ? si >= lesson.steps.length - 1 : false;
  const moving = useMemo(() => (lesson ? usesTime(lesson.scene) || (lesson.scene.type === 'diagram' && lesson.scene.edges.some((e) => e.flow !== undefined)) : false), [lesson]);

  // Keep the next lesson building while this one is studied.
  useEffect(() => {
    if (slot?.status === 'ready') loadLesson(course, li + 1);
    if (slot?.status === 'idle') loadLesson(course, li);
  }, [slot?.status, li, course, loadLesson]);

  const env = useMemo(() => values[li] ?? (lesson ? startValues(lesson) : {}), [values, li, lesson]);
  const playing = playState[li] ?? (!reduced && (lesson?.steps[0]?.play ?? true));
  const setPlaying = (p: boolean | ((x: boolean) => boolean)) => setPlayState((s) => ({ ...s, [li]: typeof p === 'function' ? p(playing) : p }));
  const shownEnv = useGlide(env, instant || reduced);

  const mark = useCallback((k: string, patch: { done?: boolean; pick?: number; miss?: number; shown?: boolean }) => setProgress((p) => ({ ...p, [k]: { ...p[k], ...patch } })), []);

  const celebrate = useCallback(() => {
    try { if (!reduced) navigator.vibrate?.(12); } catch {}
  }, [reduced]);

  // A slide task is done the moment the learner's own move makes its goal hold.
  const checkGoal = useCallback((next: Env) => {
    if (!task || task.kind !== 'slide' || sp.done) return;
    if (evaluate(task.goal, { ...next, t: 0 }, 0)) { mark(key, { done: true }); celebrate(); }
  }, [task, sp.done, key, mark, celebrate]);

  function resetAsk() {
    askSeq.current++;
    setAnswer(null);
    setAnswerFocus(null);
    setBeforeAnswer(null);
  }

  function goStep(next: number) {
    if (!lesson) return;
    const n = Math.max(0, Math.min(lesson.steps.length - 1, next));
    resetAsk();
    setSi(n);
    const st = lesson.steps[n];
    setInstant(false);
    if (st.set) setValues((v) => ({ ...v, [li]: { ...(v[li] ?? startValues(lesson)), ...clampSet(lesson, st.set!) } }));
    if (st.play !== undefined && !reduced) setPlaying(st.play);
  }

  function goLesson(n: number) {
    if (n < 0 || n >= total) return;
    resetAsk();
    setLi(n);
    setSi(0);
    setHistory([]);
    setSheet(false);
    loadLesson(course, n);
  }

  const setKnob = (id: string, v: number) => { setInstant(true); const next = { ...env, [id]: v }; setValues((all) => ({ ...all, [li]: next })); checkGoal(next); };
  const onDrag = useCallback((vals: Record<string, number>) => { setInstant(true); const next = { ...env, ...vals }; setValues((all) => ({ ...all, [li]: next })); checkGoal(next); }, [li, env, checkGoal]);

  const onTap = useCallback((id: string) => {
    if (!task || task.kind !== 'tap' || sp.done) return;
    if (id === task.target) { mark(key, { done: true }); celebrate(); }
    else mark(key, { miss: (sp.miss ?? 0) + 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, sp.done, sp.miss, key, mark]);

  function pick(i: number) {
    if (!lesson || !task || task.kind !== 'predict' || sp.pick !== undefined) return;
    mark(key, { pick: i, done: true });
    if (i === task.answer) celebrate();
    const r = task.reveal;
    setInstant(false);
    if (r?.set) setValues((v) => ({ ...v, [li]: { ...(v[li] ?? startValues(lesson)), ...clampSet(lesson, r.set!) } }));
    if (r?.play && !reduced) setPlaying(true);
  }

  // "Show me": finish the task for them, visibly, so skipping still teaches.
  function showMe() {
    if (!lesson || !task) return;
    if (task.kind === 'slide') {
      const p = lesson.params.find((q) => q.id === task.param);
      const b = p ? goalTarget(task.goal, p, env) : null;
      if (p && b !== null) { setInstant(false); setValues((all) => ({ ...all, [li]: { ...env, ...all[li], [p.id]: b } })); }
      mark(key, { done: true, shown: true });
    } else if (task.kind === 'tap') mark(key, { done: true, shown: true });
    else pick(task.answer);
  }

  async function ask() {
    const q = askText.trim();
    if (!q || !lesson) return;
    setAskText('');
    setAnswer({ q, pending: true });
    const seq = ++askSeq.current;
    try {
      const r = await post<{ answer: { answer: string; set?: Record<string, number>; focus?: string[] } }>('/api/ask', {
        question: q,
        planId: course.planId,
        askToken: course.askToken,
        history,
        context: {
          topic: course.plan.topic,
          level: course.level,
          lessonTitle: lesson.title,
          beatText: step?.say ?? '',
          sceneSummary: summarise(lesson),
          sceneIds: sceneIds(lesson),
          params: lesson.params.map((p) => ({ id: p.id, label: p.label, value: env[p.id] ?? p.value, min: p.min, max: p.max })),
        },
      });
      if (seq !== askSeq.current) return;
      setAnswer({ q, a: r.answer.answer, pending: false });
      setHistory((h) => [...h.slice(-4), { q, a: r.answer.answer }]);
      if (r.answer.set && Object.keys(r.answer.set).length) {
        setBeforeAnswer((b) => b ?? env);
        setInstant(false);
        setValues((v) => ({ ...v, [li]: { ...env, ...v[li], ...clampSet(lesson, r.answer.set!) } }));
      }
      setAnswerFocus(r.answer.focus?.length ? r.answer.focus : null);
    } catch (e) {
      if (seq !== askSeq.current) return;
      setAnswer({ q, error: (e as Error).message, pending: false });
    }
  }

  function closeAnswer() {
    setAnswer(null);
    setAnswerFocus(null);
    if (beforeAnswer) { const b = beforeAnswer; setInstant(false); setValues((v) => ({ ...v, [li]: b })); setBeforeAnswer(null); }
  }

  const tapTarget = task?.kind === 'tap' && sp.done ? [task.target] : null;
  const focus = answerFocus ?? tapTarget ?? step?.focus ?? [];
  const callouts = useMemo(() => Object.fromEntries((step?.callouts ?? []).map((c) => [c.at, c.text])), [step]);
  // Direct manipulation beats a slider: a knob tied to a draggable point is moved by dragging the point itself.
  const dragged = useMemo(() => new Set(lesson?.scene.type === 'graph2d' ? lesson.scene.items.flatMap((it) => (it.type === 'point' || it.type === 'icon' ? [it.dragX, it.dragY].filter(Boolean) as string[] : [])) : []), [lesson]);
  const slideKnob = task?.kind === 'slide' ? lesson?.params.find((p) => p.id === task.param) : undefined;
  const taskKnob = slideKnob && !dragged.has(slideKnob.id) ? slideKnob : undefined;
  // Where the active slide task wants the knob: drives the glowing handle and the direction arrows.
  const guide = useMemo(() => {
    if (!slideKnob || task?.kind !== 'slide' || done) return undefined;
    const target = goalTarget(task.goal, slideKnob, env);
    return target === null ? undefined : { param: slideKnob.id, target };
  }, [slideKnob, task, done, env]);
  // Knobs only appear when the step is about them: during a tap or a prediction they would steal the picture's space.
  const freeKnobs = lesson && (!task || done) ? lesson.params.filter((p) => p.id !== slideKnob?.id && !dragged.has(p.id)) : [];
  const stepsDone = lesson ? lesson.steps.filter((_, i) => i < si || (i === si && done)).length : 0;

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden">
      {/* header: back, where you are, all lessons */}
      <header className="flex h-14 shrink-0 items-center gap-1 px-2 lg:px-4">
        <button onClick={onHome} aria-label="New topic" className="flex h-10 items-center gap-1 rounded-full px-2 text-[15px] font-medium text-ink-2 hover:text-ink">
          <Icon name="back" size={20} /><span className="hidden sm:inline">New topic</span>
        </button>
        <button onClick={() => setSheet(true)} className="mx-auto flex min-w-0 max-w-[70%] flex-col items-center rounded-xl px-3 py-1 text-center" aria-label="All lessons">
          <span className="text-[11.5px] font-medium tabular-nums text-ink-3">Lesson {li + 1} of {total}</span>
          <span className="truncate text-[15px] font-semibold leading-tight text-ink">{course.plan.topic}</span>
        </button>
        <button onClick={() => setSheet(true)} aria-label="All lessons" className="flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:text-ink">
          <Icon name="list" />
        </button>
      </header>
      {/* step progress, like a book's page marker */}
      <div className="mx-3 mb-2 flex gap-1 lg:mx-4" aria-label={lesson ? `Step ${si + 1} of ${lesson.steps.length}` : 'Loading'}>
        {(lesson?.steps ?? [0, 1, 2, 3, 4]).map((_, i) => (
          <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-line">
            <motion.div className="h-full rounded-full bg-ink" initial={false} animate={{ width: lesson && i < stepsDone ? '100%' : lesson && i === si ? '35%' : '0%' }} transition={{ duration: reduced ? 0 : 0.3, ease: [0.2, 0.8, 0.2, 1] }} />
          </div>
        ))}
      </div>

      {/* the scene: the lesson happens here */}
      <section className="stage relative mx-3 min-h-[300px] flex-1 overflow-hidden rounded-[var(--radius)] border border-line lg:mx-4">
        {lesson && step ? (
          <>
            <div className="absolute inset-x-0" style={{ top: topSize.h ? topSize.h + 16 : 0, bottom: botSize.h ? botSize.h + 16 : 0, transition: reduced ? undefined : 'top 220ms ease, bottom 220ms ease' }}>
              <SceneBoundary key={`${course.planId}-${li}`}>
                <Stage lesson={lesson} env={shownEnv} focus={focus} playing={playing} onDrag={onDrag} callouts={callouts} onTap={task?.kind === 'tap' && !sp.done ? onTap : undefined} guide={guide} />
              </SceneBoundary>
              {moving && (
                <button
                  onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}
                  className="absolute right-3 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface/95 text-ink shadow-sm lg:right-4"
                >
                  <Icon name={playing ? 'pause' : 'play'} size={15} />
                </button>
              )}
            </div>

            {/* what to look at or do, inside the picture */}
            <div ref={topRef} className="pointer-events-none absolute inset-x-3 top-3 flex lg:inset-x-4 lg:top-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={answer ? `a-${answer.q}` : `${key}-${done ? 'd' : 'o'}`}
                  initial={reduced ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
                  className={`no-scrollbar pointer-events-auto max-h-[36dvh] max-w-[600px] overflow-y-auto rounded-[20px] border bg-surface/95 px-5 py-4 shadow-[var(--shadow)] backdrop-blur ${task && done && !answer ? 'border-[var(--t-green)]/50' : 'border-line'}`}
                  aria-live="polite"
                >
                  {answer ? (
                    <>
                      <p className="text-[14px] font-medium text-ink-3">You asked: {answer.q}</p>
                      <div className="mt-1 font-serif text-[19px] leading-[1.4] text-ink lg:text-[21px]">
                        {answer.pending ? <div className="space-y-2 py-1"><div className="shimmer h-3.5 w-[260px] max-w-full rounded" /><div className="shimmer h-3.5 w-[180px] rounded" /></div>
                          : answer.error ? <span className="text-ink-2">{answer.error}</span>
                          : <RichText text={answer.a!} env={env} />}
                      </div>
                      {!answer.pending && <button onClick={closeAnswer} className="mt-2 text-[13.5px] font-semibold text-[var(--t-primary)]">Back to the lesson</button>}
                    </>
                  ) : (
                    <>
                      {si === 0 && !done && <p className="mb-1 text-[14px] font-semibold uppercase tracking-[0.04em] text-ink-3">{lesson.title}</p>}
                      {task && done ? (
                        <div className="flex gap-2.5">
                          <motion.span
                            initial={reduced ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                            className={`mt-[3px] flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-white ${task.kind === 'predict' && sp.pick !== task.answer ? 'bg-[var(--t-accent)]' : 'bg-[var(--t-green)]'}`}
                          >
                            <Icon name={task.kind === 'predict' && sp.pick !== task.answer ? 'reset' : 'check'} size={14} />
                          </motion.span>
                          <p className="font-serif text-[19px] leading-[1.4] text-ink lg:text-[22px]">
                            {task.kind === 'predict' && sp.pick !== task.answer && <span className="font-semibold">Not quite. Watch: </span>}
                            {!(task.kind === 'predict' && sp.pick !== task.answer) && !sp.shown && <span className="font-semibold">{praise(key)} </span>}
                            <RichText text={step.after || step.say} env={env} />
                          </p>
                        </div>
                      ) : (
                        <p className="font-serif text-[20px] leading-[1.38] text-ink lg:text-[23px]"><RichText text={step.say} env={env} /></p>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* the task and the knobs, also inside the picture */}
            <div ref={botRef} className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-start gap-2 lg:inset-x-4 lg:bottom-4">
              {task?.kind === 'predict' && !answer && (
                <div className="pointer-events-auto w-full max-w-[600px] rounded-[20px] border border-line bg-surface/95 p-4 shadow-[var(--shadow)] backdrop-blur">
                  <p className="mb-2.5 text-[17px] font-semibold leading-snug text-ink"><RichText text={task.question} /></p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {task.choices.map((c, i) => {
                      const picked = sp.pick === i, right = i === task.answer, settled = sp.pick !== undefined;
                      return (
                        <button
                          key={i} onClick={() => pick(i)} disabled={settled}
                          className={`flex min-h-[54px] items-center justify-between gap-2 rounded-2xl border-2 px-4 py-2.5 text-left text-[17px] font-medium transition-colors duration-150 ${settled && right ? 'border-[var(--t-green)] bg-[var(--t-green)]/10' : settled && picked ? 'border-[var(--t-accent)] bg-[var(--t-accent)]/10' : 'border-line hover:border-ink-3'} ${settled && !right && !picked ? 'opacity-50' : ''}`}
                        >
                          <span><RichText text={c} /></span>
                          {settled && right && <span className="text-[var(--t-green)]"><Icon name="check" size={16} /></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {task?.kind === 'slide' && !taskKnob && !done && !answer && (
                <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border-2 border-[var(--t-primary)]/40 bg-surface/95 px-4 py-2.5 text-[16.5px] font-semibold text-ink shadow-[var(--shadow)] backdrop-blur">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--t-primary)]" />{task.hint}
                </div>
              )}
              {task?.kind === 'tap' && !done && !answer && (
                <motion.div
                  key={`miss-${sp.miss ?? 0}`}
                  initial={reduced || !sp.miss ? false : { x: [0, -6, 6, -4, 4, 0] }} animate={{ x: 0 }} transition={{ duration: 0.32 }}
                  className="pointer-events-auto flex items-center gap-2.5 rounded-full border-2 border-[var(--t-primary)]/40 bg-surface/95 px-4 py-2.5 text-[16.5px] font-semibold text-ink shadow-[var(--shadow)] backdrop-blur"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--t-primary)]" />
                  {sp.miss ? `Not that one. ${task.hint}` : task.hint}
                </motion.div>
              )}
              {(taskKnob || freeKnobs.length > 0) && !answer && task?.kind !== 'predict' && (
                <div className="pointer-events-auto w-full max-w-[600px] rounded-[20px] border border-line bg-surface/95 px-4 py-2.5 shadow-[var(--shadow)] backdrop-blur">
                  {taskKnob && task?.kind === 'slide' && (
                    <>
                      {!done && <p className="pt-2 text-[15.5px] font-semibold text-ink">{task.hint}</p>}
                      <Knob p={taskKnob} value={env[taskKnob.id] ?? taskKnob.value} onChange={(v) => setKnob(taskKnob.id, v)} toward={guide?.target} />
                    </>
                  )}
                  {freeKnobs.map((p) => <Knob key={p.id} p={p} value={env[p.id] ?? p.value} onChange={(v) => setKnob(p.id, v)} />)}
                </div>
              )}
            </div>

          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            {slot?.status === 'error' ? (
              <div className="text-center">
                <p className="text-[15px] text-ink-2">{slot.error}</p>
                <button onClick={() => retryLesson(course, li)} className="mt-3 rounded-full bg-ink px-4 py-2 text-[14px] font-semibold text-paper">Try again</button>
              </div>
            ) : (
              <Drawing title={meta?.title ?? ''} aha={meta?.goal ?? ''} lessonNo={li + 1} reduced={reduced} />
            )}
          </div>
        )}
      </section>

      {/* next, skip, ask */}
      <footer className="shrink-0 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2.5 lg:px-4">
        <div className="mx-auto w-full max-w-[760px]">
          {lesson && (
            <div className="mb-3 flex items-center gap-2">
              <button onClick={() => goStep(si - 1)} disabled={si === 0} aria-label="Previous step" className="flex h-12 w-12 items-center justify-center rounded-full text-ink-2 disabled:opacity-25"><Icon name="back" size={20} /></button>
              {!asking && (
                <button onClick={() => setAsking(true)} className="flex h-12 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[16px] font-medium text-ink-2 hover:text-ink sm:px-4" aria-label="Ask a question">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>
                  <span className="hidden sm:inline">Ask</span>
                </button>
              )}
              <div className="flex-1" />
              {!done && task && (
                <button onClick={showMe} className="h-12 shrink-0 whitespace-nowrap rounded-full px-3 text-[16px] font-medium text-ink-2 hover:text-ink sm:px-4">Show me</button>
              )}
              <motion.button
                key={`${key}-${done}`}
                initial={reduced || !done || !task ? false : { scale: 1 }} animate={reduced || !done || !task ? undefined : { scale: [1, 1.05, 1] }} transition={{ duration: 0.28 }}
                onClick={() => (!lastStep ? goStep(si + 1) : li < total - 1 ? goLesson(li + 1) : setSheet(true))}
                disabled={!done}
                className="h-12 min-w-[132px] shrink-0 whitespace-nowrap rounded-full bg-ink px-6 text-[17px] font-semibold text-paper transition-colors disabled:bg-sunk disabled:text-ink-3"
              >
                {!lastStep ? 'Continue' : li < total - 1 ? 'Next lesson' : 'Finish'}
              </motion.button>
            </div>
          )}
          {/* Asking is one tap away but folded, so the picture keeps the room; it opens wide while you type or wait. */}
          {asking || answer?.pending || !lesson ? (
            <PromptBar value={askText} onChange={setAskText} onSubmit={() => { ask(); setAsking(false); }} placeholder="Ask anything about this" busy={answer?.pending} autoFocus={asking} />
          ) : null}
        </div>
      </footer>

      <AnimatePresence>
        {sheet && (
          <LessonSheet
            course={course} slots={slots} current={li} reduced={reduced}
            onPick={goLesson} onClose={() => setSheet(false)} onRelevel={(l) => { setSheet(false); onRelevel(l); }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

const PRAISE = ['Exactly.', 'Nice.', 'Right.', 'Spot on.', 'Yes.', 'That\'s it.'];
function praise(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  return PRAISE[Math.abs(h) % PRAISE.length];
}

/** While a lesson is drawn: the lesson's title and goal, and a pen line drawing itself. Calm, and honest about what is happening. */
function Drawing({ title, aha, lessonNo, reduced }: { title: string; aha: string; lessonNo: number; reduced: boolean }) {
  return (
    <div className="flex max-w-[420px] flex-col items-center text-center">
      <svg width="120" height="56" viewBox="0 0 120 56" aria-hidden className="mb-5 text-ink-3">
        <motion.path
          d="M4 44 C 24 44, 26 12, 46 12 S 70 44, 90 30 S 110 8, 116 10"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 1.6, ease: [0.45, 0, 0.2, 1], repeat: Infinity, repeatType: 'reverse', repeatDelay: 0.25 }}
        />
      </svg>
      <p className="text-[12.5px] font-medium text-ink-3">Drawing lesson {lessonNo}</p>
      <p className="mt-1 font-serif text-[20px] leading-snug text-ink">{title}</p>
      {aha && <p className="mt-2 text-[14px] leading-snug text-ink-2">{aha}</p>}
    </div>
  );
}

/** The value of a knob that completes a slide goal: the middle of the nearest stretch where the goal holds. */
function goalTarget(goal: string, p: { id: string; min: number; max: number }, env: Env): number | null {
  const N = 600, ok: boolean[] = [];
  for (let k = 0; k <= N; k++) ok.push(!!evaluate(goal, { ...env, t: 0, [p.id]: p.min + ((p.max - p.min) * k) / N }, 0));
  let best: number | null = null;
  for (let k = 0; k <= N; k++) {
    if (!ok[k] || (k > 0 && ok[k - 1])) continue;
    let e = k;
    while (e < N && ok[e + 1]) e++;
    const mid = p.min + ((p.max - p.min) * (k + e)) / 2 / N;
    if (best === null || Math.abs(mid - env[p.id]) < Math.abs(best - env[p.id])) best = mid;
  }
  return best;
}

function startValues(lesson: Lesson): Env {
  const env: Env = {};
  for (const p of lesson.params) env[p.id] = p.value;
  return { ...env, ...clampSet(lesson, lesson.steps[0]?.set ?? {}) };
}

function clampSet(lesson: Lesson, set: Record<string, number>): Env {
  const out: Env = {};
  for (const [k, v] of Object.entries(set)) {
    const p = lesson.params.find((q) => q.id === k);
    if (p && Number.isFinite(v)) out[k] = Math.min(p.max, Math.max(p.min, v));
  }
  return out;
}

function sceneIds(l: Lesson): string[] {
  const s = l.scene;
  switch (s.type) {
    case 'graph2d': return s.items.map((i) => i.id);
    case 'diagram': return s.nodes.map((n) => n.id);
    case 'model3d': return s.parts.map((p) => p.id);
    case 'chart': return [...(s.bars ?? []).map((b) => b.id), ...(s.series ?? []).map((x) => x.id)];
    case 'timeline': return s.events.map((e) => e.id);
  }
}

function summarise(l: Lesson): string {
  const s = l.scene;
  switch (s.type) {
    case 'graph2d': return `2D graph: ${s.items.map((i) => `${i.id} (${i.type}${'expr' in i ? ` ${i.expr}` : ''}${i.label ? `, "${i.label}"` : ''})`).join('; ')}`.slice(0, 780);
    case 'diagram': return `Diagram: ${s.nodes.map((n) => `${n.id} "${n.label}"`).join(', ')}; links: ${s.edges.map((e) => `${e.from}->${e.to}${e.label ? ` (${e.label})` : ''}`).join(', ')}`.slice(0, 780);
    case 'model3d': return `3D model: ${s.parts.map((p) => `${p.id}${p.label ? ` "${p.label}"` : ''}`).join(', ')}`.slice(0, 780);
    case 'chart': return `Chart: ${(s.bars ?? []).map((b) => `${b.label}=${b.value}`).join(', ')}${(s.series ?? []).map((x) => x.label).join(', ')}`.slice(0, 780);
    case 'timeline': return `Timeline: ${s.events.map((e) => `${e.when} ${e.label}`).join('; ')}`.slice(0, 780);
  }
}

function LessonSheet({ course, slots, current, reduced, onPick, onClose, onRelevel }: {
  course: Course; slots: Slot[]; current: number; reduced: boolean; onPick: (i: number) => void; onClose: () => void; onRelevel: (l: Level) => void;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
      <button className="absolute inset-0 bg-black/30" aria-label="Close" onClick={onClose} />
      <motion.div
        role="dialog" aria-modal="true" aria-label="Lessons"
        initial={reduced ? false : { y: 40 }} animate={{ y: 0 }} exit={reduced ? undefined : { y: 40 }} transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        className="relative max-h-[86dvh] w-full max-w-[560px] overflow-y-auto rounded-t-[20px] bg-surface px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 shadow-xl lg:rounded-[20px]"
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line-2 lg:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-[24px] font-semibold leading-tight text-ink">{course.plan.topic}</h2>
            {course.plan.summary && <p className="mt-1 text-[14.5px] leading-snug text-ink-2">{course.plan.summary}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:text-ink"><Icon name="close" /></button>
        </div>
        <ol className="mt-4 divide-y divide-line">
          {course.plan.lessons.map((l, i) => {
            const s = slots[i]?.status;
            return (
              <li key={i}>
                <button onClick={() => onPick(i)} className="flex w-full items-center gap-3 py-3 text-left">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums ${i === current ? 'bg-ink text-paper' : 'bg-sunk text-ink-2'}`}>{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15.5px] font-semibold leading-snug text-ink">{l.title}</span>
                    <span className="block text-[13px] leading-snug text-ink-3">{l.goal}</span>
                  </span>
                  {s === 'loading' && <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-line-2 border-t-ink-2" aria-label="Building" />}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-5">
          <div className="mb-2 text-[13px] font-medium text-ink-3">Level</div>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <button key={l} onClick={() => l !== course.level && onRelevel(l)} className={`rounded-full border px-3 py-1.5 text-[13.5px] font-medium ${l === course.level ? 'border-ink bg-ink text-paper' : 'border-line text-ink hover:border-line-2'}`}>{LEVEL_LABEL[l]}</button>
            ))}
          </div>
        </div>
        {course.sources.length > 0 && (
          <div className="mt-5">
            <div className="mb-1 text-[13px] font-medium text-ink-3">Sources</div>
            <ul>
              {course.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 py-1.5 text-[14px] text-ink-2 hover:text-ink">
                    <span className="truncate">{s.title}</span><span className="shrink-0 text-ink-3"><Icon name="link" size={14} /></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-5 text-[12.5px] leading-snug text-ink-3">ProfAI writes each lesson with AI. It can get things wrong, so check anything important against the sources.</p>
      </motion.div>
    </motion.div>
  );
}
