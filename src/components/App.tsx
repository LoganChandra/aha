'use client';
// ProfAI: one prompt in, a lesson path out, each lesson taught by a visual you can play with.
// Home -> planning -> course. In a course the prompt bar is for questions: stop anywhere and ask.
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Env } from '@/lib/expr';
import { LEVEL_LABEL, LEVELS, type Lesson, type Level, type Plan, type Source } from '@/lib/recipe';
import RichText from './RichText';
import { useGlide, useReducedMotion, usesTime } from './scene/runtime';
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
          <div aria-live="polite">
            <p className="text-[13px] font-medium text-ink-3">Planning your lessons</p>
            <h1 className="mt-2 font-serif text-[30px] leading-[1.15] tracking-[-0.01em] text-ink sm:text-[40px]">{prompt}</h1>
            <div className="mt-8 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[13px] tabular-nums text-ink-3">{i + 1}</span>
                  <div className="shimmer h-[18px] flex-1 rounded-md" style={{ maxWidth: `${82 - i * 9}%` }} />
                </div>
              ))}
            </div>
          </div>
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

// ---------------------------------------------------------------- course

function CourseView({ course, slots, loadLesson, retryLesson, onHome, onRelevel }: {
  course: Course; slots: Slot[]; loadLesson: (c: Course, i: number) => void; retryLesson: (c: Course, i: number) => void; onHome: () => void; onRelevel: (l: Level) => void;
}) {
  const reduced = useReducedMotion();
  const [li, setLi] = useState(0);
  const [bi, setBi] = useState(0);
  const [values, setValues] = useState<Record<number, Env>>({});
  // Per-lesson play state; until the learner or a beat changes it, a moving scene plays (still under reduced motion).
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
  const [check, setCheck] = useState<{ open: boolean; pick?: number }>({ open: false });

  const slot = slots[li];
  const lesson = slot?.status === 'ready' ? slot.lesson! : null;
  const beat = lesson ? lesson.beats[Math.min(bi, lesson.beats.length - 1)] : null;
  const total = course.plan.lessons.length;
  const moving = useMemo(() => (lesson ? usesTime(lesson.scene) || lesson.scene.type === 'diagram' && lesson.scene.edges.some((e) => e.flow !== undefined) : false), [lesson]);

  // Keep the next lesson building while this one is read.
  useEffect(() => {
    if (slot?.status === 'ready') loadLesson(course, li + 1);
    if (slot?.status === 'idle') loadLesson(course, li);
  }, [slot?.status, li, course, loadLesson]);

  const env = useMemo(() => values[li] ?? (lesson ? startValues(lesson) : {}), [values, li, lesson]);
  const playing = playState[li] ?? (!reduced && (lesson?.beats[0]?.play ?? true));
  const setPlaying = (p: boolean | ((x: boolean) => boolean)) => setPlayState((s) => ({ ...s, [li]: typeof p === 'function' ? p(playing) : p }));
  // Knob values from a beat or an answer glide into place; a finger on a knob moves it instantly.
  const [instant, setInstant] = useState(false);
  const shownEnv = useGlide(env, instant || reduced);

  function goBeat(next: number) {
    if (!lesson) return;
    const n = Math.max(0, Math.min(lesson.beats.length - 1, next));
    askSeq.current++;
    setBi(n);
    setAnswer(null);
    setAnswerFocus(null);
    setBeforeAnswer(null);
    setCheck({ open: false });
    const b = lesson.beats[n];
    setInstant(false);
    if (b.set) setValues((v) => ({ ...v, [li]: { ...(v[li] ?? startValues(lesson)), ...clampSet(lesson, b.set!) } }));
    if (b.play !== undefined && !reduced) setPlaying(b.play);
  }

  function goLesson(n: number) {
    if (n < 0 || n >= total) return;
    askSeq.current++;
    setLi(n);
    setBi(0);
    setAnswer(null);
    setAnswerFocus(null);
    setBeforeAnswer(null);
    setHistory([]);
    setCheck({ open: false });
    setSheet(false);
    loadLesson(course, n);
  }

  const setKnob = (id: string, v: number) => { setInstant(true); setValues((all) => ({ ...all, [li]: { ...env, ...all[li], [id]: v } })); };
  const onDrag = useCallback((vals: Record<string, number>) => { setInstant(true); setValues((all) => ({ ...all, [li]: { ...env, ...all[li], ...vals } })); }, [li, env]);

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
          beatText: beat?.text ?? '',
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

  const focus = answerFocus ?? beat?.focus ?? [];
  const lastBeat = lesson ? bi >= lesson.beats.length - 1 : false;
  const meta = course.plan.lessons[li];

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-[56px_minmax(0,1fr)_auto]">
      {/* header */}
      <header className="flex h-14 shrink-0 items-center gap-1 px-2 lg:col-span-2 lg:px-4">
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

      {/* stage */}
      <section className="relative mx-3 h-[42dvh] min-h-[250px] shrink-0 overflow-hidden rounded-[var(--radius)] border border-line bg-surface lg:row-start-2 lg:mx-4 lg:mb-4 lg:h-auto">
        {lesson ? (
          <>
            <SceneBoundary key={`${course.planId}-${li}`}>
              <Stage lesson={lesson} env={shownEnv} focus={focus} playing={playing} onDrag={onDrag} />
            </SceneBoundary>
            {moving && (
              <button
                onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}
                className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface/95 text-ink shadow-sm"
              >
                <Icon name={playing ? 'pause' : 'play'} size={16} />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            {slot?.status === 'error' ? (
              <>
                <p className="text-[15px] text-ink-2">{slot.error}</p>
                <button onClick={() => retryLesson(course, li)} className="rounded-full bg-ink px-4 py-2 text-[14px] font-semibold text-paper">Try again</button>
              </>
            ) : (
              <>
                <div className="shimmer absolute inset-4 rounded-[10px] opacity-60" />
                <p className="relative text-[13px] font-medium text-ink-2">Building lesson {li + 1}</p>
                <p className="relative max-w-[320px] font-serif text-[18px] leading-snug text-ink">{meta?.title}</p>
              </>
            )}
          </div>
        )}
      </section>

      {/* lesson panel */}
      <section className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3 pb-2 lg:row-span-1 lg:row-start-2 lg:px-6 lg:pt-1">
        <div className="mx-auto w-full max-w-[640px]">
          <h2 className="font-serif text-[21px] font-semibold leading-tight tracking-[-0.01em] text-ink lg:text-[26px]">{lesson?.title ?? meta?.title}</h2>
          <div className="mt-2 min-h-[84px]" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {answer ? (
                <motion.div key={`a${answer.q}`} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="rounded-[var(--radius)] border border-line bg-surface p-4">
                  <p className="text-[13px] font-medium text-ink-3">You asked</p>
                  <p className="text-[15px] font-medium text-ink">{answer.q}</p>
                  <div className="mt-3 font-serif text-[18px] leading-[1.5] text-ink">
                    {answer.pending ? <div className="space-y-2"><div className="shimmer h-4 w-[92%] rounded" /><div className="shimmer h-4 w-[70%] rounded" /></div>
                      : answer.error ? <span className="text-ink-2">{answer.error}</span>
                      : <RichText text={answer.a!} env={env} />}
                  </div>
                  {!answer.pending && (
                    <button onClick={closeAnswer} className="mt-3 text-[14px] font-semibold text-[var(--t-primary)]">Back to the lesson</button>
                  )}
                </motion.div>
              ) : beat ? (
                <motion.p key={`b${li}-${bi}`} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="font-serif text-[17.5px] leading-[1.5] text-ink lg:text-[19px]">
                  <RichText text={beat.text} env={env} />
                </motion.p>
              ) : (
                <div className="space-y-2.5"><div className="shimmer h-4 w-[94%] rounded" /><div className="shimmer h-4 w-[86%] rounded" /><div className="shimmer h-4 w-[60%] rounded" /></div>
              )}
            </AnimatePresence>
          </div>

          {lesson && lesson.params.length > 0 && (
            <div className="mt-3 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-1">
              {lesson.params.map((p) => <Knob key={p.id} p={p} value={env[p.id] ?? p.value} onChange={(v) => setKnob(p.id, v)} />)}
            </div>
          )}

          {lesson && check.open && lesson.check && (
            <div className="mt-4 rounded-[var(--radius)] border border-line bg-surface p-4">
              <p className="font-serif text-[17px] leading-snug text-ink"><RichText text={lesson.check.question} /></p>
              <div className="mt-3 flex flex-col gap-2">
                {lesson.check.choices.map((c, i) => {
                  const picked = check.pick === i, right = i === lesson.check!.answer, done = check.pick !== undefined;
                  return (
                    <button
                      key={i} disabled={done} onClick={() => setCheck({ open: true, pick: i })}
                      className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-[15px] transition-colors ${done && right ? 'border-[var(--t-green)] text-ink' : done && picked ? 'border-[var(--t-red)] text-ink' : 'border-line text-ink hover:border-line-2'}`}
                    >
                      <RichText text={c} />
                      {done && right && <span className="text-[var(--t-green)]"><Icon name="check" size={18} /></span>}
                    </button>
                  );
                })}
              </div>
              {check.pick !== undefined && <p className="mt-3 text-[15px] leading-snug text-ink-2"><RichText text={lesson.check.why} /></p>}
            </div>
          )}
        </div>
      </section>

      {/* steps + ask */}
      <footer className="shrink-0 border-t border-line bg-paper px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2.5 lg:col-start-2 lg:row-start-3 lg:border-t-0 lg:px-6">
        <div className="mx-auto w-full max-w-[640px]">
          {lesson && (
            <div className="mb-2.5 flex items-center gap-2">
              <button onClick={() => goBeat(bi - 1)} disabled={bi === 0} className="h-10 rounded-full px-3 text-[15px] font-medium text-ink-2 disabled:opacity-30">Back</button>
              <div className="flex flex-1 justify-center gap-1.5" aria-label={`Step ${bi + 1} of ${lesson.beats.length}`}>
                {lesson.beats.map((_, i) => (
                  <button key={i} onClick={() => goBeat(i)} aria-label={`Step ${i + 1}`} className="flex h-6 items-center px-[3px]">
                    <span className={`block h-[6px] rounded-full transition-all ${i === bi ? 'w-5 bg-ink' : 'w-[6px] bg-line-2'}`} />
                  </button>
                ))}
              </div>
              {!lastBeat ? (
                <button onClick={() => goBeat(bi + 1)} className="h-10 rounded-full bg-ink px-5 text-[15px] font-semibold text-paper">Next</button>
              ) : (
                <div className="flex items-center gap-1">
                  {lesson.check && !check.open && (
                    <button onClick={() => setCheck({ open: true })} className="h-10 rounded-full px-3 text-[14px] font-medium text-ink-2 hover:text-ink">Quick check</button>
                  )}
                  {li < total - 1 ? (
                    <button onClick={() => goLesson(li + 1)} className="h-10 rounded-full bg-ink px-5 text-[15px] font-semibold text-paper">Next lesson</button>
                  ) : (
                    <button onClick={() => setSheet(true)} className="h-10 rounded-full bg-ink px-5 text-[15px] font-semibold text-paper">Finish</button>
                  )}
                </div>
              )}
            </div>
          )}
          <PromptBar value={askText} onChange={setAskText} onSubmit={ask} placeholder="Ask about this lesson" busy={answer?.pending} />
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

function startValues(lesson: Lesson): Env {
  const env: Env = {};
  for (const p of lesson.params) env[p.id] = p.value;
  return { ...env, ...clampSet(lesson, lesson.beats[0]?.set ?? {}) };
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
