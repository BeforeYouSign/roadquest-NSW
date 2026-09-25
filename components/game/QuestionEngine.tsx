'use client';
// ONE reusable engine that renders every challenge type. The question data +
// the item "kind" decide which renderer is used.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, X, Timer, Hand, ArrowRight } from 'lucide-react';
import { Visual } from '@/components/art/Visual';
import { SignArt } from '@/components/art/Sign';
import { CUSTOM_PICKABLE } from '@/components/art/CustomArt';
import { HAZARD_TYPES } from '@/components/art/Pov';
import { QUESTION_MAP, optionLabel, shuffledOptions } from '@/lib/questions';
import { gradeAnswer } from '@/lib/scoring';
import { CATEGORY_MAP } from '@/lib/config';
import { shuffle } from '@/lib/random';
import { sfx } from '@/lib/sound';
import type { AnswerPayload, Question } from '@/lib/types';
import { useGame } from '@/lib/store';

export type ChallengeItem =
  | { kind: 'mcq'; q: Question }
  | { kind: 'tf'; q: Question; shown: string }
  | { kind: 'match'; qs: Question[] }
  | { kind: 'pick-sign'; q: Question; choices: Question[] }
  | { kind: 'sequence'; q: Question }
  | { kind: 'hazard'; q: Question };

export interface AnswerEvent {
  payloads: AnswerPayload[];
  correct: boolean;
  chosenText: string; // human description of what the player did
  primary: Question; // question used for the teaching panel
}

interface EngineProps {
  item: ChallengeItem;
  onAnswer: (e: AnswerEvent) => void;
  reveal: boolean; // show correct/incorrect markings (false during tests)
  answered: boolean;
  timerSec?: number;
}

export function itemQuestions(item: ChallengeItem): Question[] {
  return item.kind === 'match' ? item.qs : item.kind === 'pick-sign' ? [item.q] : [item.q];
}

// ─── shared pieces ─────────────────────────────────────────────
function useElapsed(): () => number {
  const t0 = useRef(Date.now());
  return () => Date.now() - t0.current;
}

function TimerRing({ seconds, onExpire, paused }: { seconds: number; onExpire: () => void; paused: boolean }) {
  const [left, setLeft] = useState(seconds);
  const cb = useRef(onExpire);
  cb.current = onExpire;
  useEffect(() => {
    if (paused) return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const l = Math.max(0, seconds - (Date.now() - t0) / 1000);
      setLeft(l);
      if (l <= 3.05 && l > 0 && Math.abs(l - Math.round(l)) < 0.06) sfx.countdown();
      if (l <= 0) {
        clearInterval(id);
        cb.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [seconds, paused]);
  const pct = left / seconds;
  const danger = left <= 3;
  return (
    <div className={`flex items-center gap-2 font-display ${danger ? 'text-danger-400 animate-pulse' : 'text-aqua-300'}`} role="timer" aria-label={`${Math.ceil(left)} seconds left`}>
      <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="4" />
        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${pct * 94.2} 94.2`} strokeLinecap="round" />
      </svg>
      <span className="text-lg w-6 tabular-nums">{Math.ceil(left)}</span>
    </div>
  );
}

type OptState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim';

function OptionButton({ letter, text, state, onClick, disabled }: { letter: string; text: string; state: OptState; onClick: () => void; disabled?: boolean }) {
  const styles: Record<OptState, string> = {
    idle: 'bg-night-700/80 border-white/10 hover:border-sun-400/60 hover:bg-night-600',
    selected: 'bg-grape-600/40 border-grape-400',
    correct: 'bg-leaf-600/30 border-leaf-400',
    wrong: 'bg-danger-600/30 border-danger-400 animate-shake',
    dim: 'bg-night-800/60 border-white/5 opacity-60',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left flex items-center gap-3 rounded-2xl border-2 px-3.5 py-3 min-h-14 transition focus-ring ${styles[state]} ${disabled ? 'cursor-default' : 'active:scale-[.99]'}`}
      aria-pressed={state === 'selected'}
    >
      <span className={`grid place-items-center w-9 h-9 shrink-0 rounded-xl font-display text-lg ${state === 'correct' ? 'bg-leaf-500 text-night-950' : state === 'wrong' ? 'bg-danger-500 text-white' : 'bg-white/10 text-sun-400'}`}>
        {state === 'correct' ? <Check className="w-5 h-5" strokeWidth={3} /> : state === 'wrong' ? <X className="w-5 h-5" strokeWidth={3} /> : letter}
      </span>
      <span className="font-bold leading-snug text-[15px] md:text-base">{text}</span>
      {state === 'correct' && <span className="ml-auto shrink-0 text-xs font-extrabold text-leaf-400 uppercase">Correct</span>}
      {state === 'wrong' && <span className="ml-auto shrink-0 text-xs font-extrabold text-danger-400 uppercase">Your pick</span>}
    </button>
  );
}

function QuestionHeader({ q, extra }: { q: Question; extra?: ReactNode }) {
  const cat = CATEGORY_MAP[q.category];
  return (
    <div className="flex items-center gap-2 flex-wrap mb-2">
      <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide" style={{ background: `${cat?.color}22`, color: cat?.color }}>
        {cat?.short ?? q.category}
      </span>
      <span className="text-[11px] font-bold text-night-400">{q.sourceCode}</span>
      <span className="text-[11px] font-extrabold text-night-300" aria-label={`Difficulty ${q.difficulty} of 3`}>
        {'★'.repeat(q.difficulty)}
        <span className="text-night-600">{'★'.repeat(3 - q.difficulty)}</span>
      </span>
      {extra}
    </div>
  );
}

function VisualCard({ q, children }: { q: Question; children: ReactNode }) {
  const cap = q.visual?.caption ?? (q.visual?.kind === 'pov' ? undefined : undefined);
  const isSign = q.visual?.kind === 'sign' || q.visual?.kind === 'lights';
  return (
    <figure className={`rounded-3xl overflow-hidden border border-white/10 ${isSign ? 'bg-gradient-to-b from-sky-200 to-sky-100 p-4' : 'bg-night-950'}`}>
      <div className={isSign ? 'mx-auto max-w-[220px] md:max-w-[250px]' : ''}>{children}</div>
      {cap && <figcaption className={`px-3 py-2 text-xs font-bold ${isSign ? 'text-night-800 text-center' : 'text-night-300 bg-night-900'}`}>{cap}</figcaption>}
    </figure>
  );
}

// ─── MCQ (+ hotspot taps on diagrams) ───────────────────────────
function McqRenderer({ q, onAnswer, reveal, answered, timerSec }: { q: Question } & Omit<EngineProps, 'item'>) {
  const options = useMemo(() => shuffledOptions(q), [q]);
  const [picked, setPicked] = useState<string | null>(null);
  const elapsed = useElapsed();
  const reduced = useGame((s) => s.settings.reducedMotion);
  // hotspot mapping: option ↔ label on the diagram
  const labelMap = useMemo(() => {
    const labels = new Set<string>();
    q.visual?.vehicles?.forEach((v) => v.label && labels.add(v.label));
    q.visual?.hotspots?.forEach((h) => labels.add(h.id));
    if (q.visual?.kind === 'custom') (CUSTOM_PICKABLE[q.visual.name ?? ''] ?? []).forEach((l) => labels.add(l));
    const m: Record<string, string> = {};
    for (const o of options) {
      const plain = o.replace(/\.$/, '');
      if (labels.has(plain)) m[plain] = o;
      else {
        const l = optionLabel(o);
        if (l && labels.has(l)) m[l] = o;
      }
    }
    return Object.keys(m).length >= 2 ? m : {};
  }, [q, options]);
  const hot = Object.keys(labelMap).length >= 2;
  const choose = (o: string) => {
    if (answered || picked) return;
    setPicked(o);
    const payload: AnswerPayload = { qid: q.id, kind: 'option', value: o, ms: elapsed() };
    onAnswer({ payloads: [payload], correct: gradeAnswer(payload), chosenText: o, primary: q });
  };
  const stateOf = (o: string): OptState => {
    if (!picked) return 'idle';
    if (!reveal) return o === picked ? 'selected' : 'dim';
    if (o === q.correctAnswer) return 'correct';
    if (o === picked) return 'wrong';
    return 'dim';
  };
  const labelOf = (o: string) => Object.entries(labelMap).find(([, v]) => v === o)?.[0];
  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-start">
      {q.visual && (
        <div className="md:sticky md:top-4">
          <VisualCard q={q}>
            <Visual
              spec={q.visual}
              className="w-full h-auto block"
              reducedMotion={reduced}
              interaction={
                hot
                  ? {
                      pickable: answered || picked ? [] : Object.keys(labelMap),
                      onPick: (l) => choose(labelMap[l]),
                      picked: picked && labelOf(picked) ? [labelOf(picked)!] : [],
                      good: picked && reveal && labelOf(q.correctAnswer) ? [labelOf(q.correctAnswer)!] : [],
                      bad: picked && reveal && picked !== q.correctAnswer && labelOf(picked) ? [labelOf(picked)!] : [],
                    }
                  : undefined
              }
            />
          </VisualCard>
          {hot && !picked && (
            <p className="mt-2 text-sm font-bold text-sun-400 flex items-center gap-1.5">
              <Hand className="w-4 h-4" aria-hidden="true" /> Tap the diagram — or pick an answer below.
            </p>
          )}
        </div>
      )}
      <div className={q.visual ? '' : 'md:col-span-2 max-w-2xl w-full mx-auto'}>
        <QuestionHeader q={q} extra={timerSec && !answered ? <span className="ml-auto"><TimerRing seconds={timerSec} paused={!!picked || answered} onExpire={() => !picked && choose('__timeout__')} /></span> : null} />
        <h2 className="font-display text-xl md:text-2xl leading-snug mb-4">{q.question}</h2>
        <div className="grid gap-2.5" role="group" aria-label="Answer options">
          {options.map((o, i) => (
            <OptionButton key={o} letter={'ABC'[i]} text={o} state={stateOf(o)} onClick={() => choose(o)} disabled={answered || !!picked} />
          ))}
        </div>
        {picked === '__timeout__' && <p className="mt-3 font-bold text-danger-400">Time&apos;s up!</p>}
      </div>
    </div>
  );
}

// ─── Legal or Illegal? (true / false) ──────────────────────────
function TrueFalseRenderer({ q, shown, onAnswer, answered, timerSec, reveal }: { q: Question; shown: string } & Omit<EngineProps, 'item'>) {
  const [pick, setPick] = useState<boolean | null>(null);
  const elapsed = useElapsed();
  const shownCorrect = shown === q.correctAnswer;
  const choose = (v: boolean | null) => {
    if (answered || pick !== null) return;
    setPick(v === null ? !shownCorrect : v);
    const payload: AnswerPayload = { qid: q.id, kind: 'tf', value: v === null ? String(!shownCorrect) : String(v), shown, ms: elapsed() };
    onAnswer({ payloads: [payload], correct: gradeAnswer(payload), chosenText: v === null ? 'Ran out of time' : v ? `Right call: "${shown}"` : `Wrong call: "${shown}"`, primary: q });
  };
  return (
    <div className="max-w-2xl mx-auto">
      <QuestionHeader q={q} extra={timerSec && !answered ? <span className="ml-auto"><TimerRing seconds={timerSec} paused={pick !== null} onExpire={() => choose(null)} /></span> : null} />
      <div className="card-game p-5 md:p-6 mb-4">
        {q.visual && (
          <div className="mb-4 max-w-sm mx-auto">
            <VisualCard q={q}>
              <Visual spec={q.visual} className="w-full h-auto block" />
            </VisualCard>
          </div>
        )}
        <p className="text-night-300 font-bold text-sm uppercase tracking-widest mb-1">The situation</p>
        <p className="font-display text-xl md:text-2xl leading-snug mb-4">{q.question}</p>
        <p className="text-night-300 font-bold text-sm uppercase tracking-widest mb-1">A driver says…</p>
        <p className={`text-lg font-extrabold rounded-2xl px-4 py-3 border-2 ${pick !== null && reveal ? (shownCorrect ? 'border-leaf-400 bg-leaf-600/20' : 'border-danger-400 bg-danger-600/20') : 'border-sun-400/50 bg-sun-500/10'}`}>“{shown}”</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button disabled={pick !== null} onClick={() => choose(true)} className="btn-3d bg-gradient-to-b from-leaf-400 to-leaf-600 text-night-950 px-4 py-5 text-lg" style={{ ['--btn-shadow' as string]: '#166534' } as React.CSSProperties}>
          <Check className="w-6 h-6" strokeWidth={3} /> Right call
        </button>
        <button disabled={pick !== null} onClick={() => choose(false)} className="btn-3d bg-gradient-to-b from-danger-400 to-danger-600 text-white px-4 py-5 text-lg" style={{ ['--btn-shadow' as string]: '#7f1d1d' } as React.CSSProperties}>
          <X className="w-6 h-6" strokeWidth={3} /> Wrong call
        </button>
      </div>
      {pick !== null && reveal && (
        <p className="mt-4 text-center font-bold text-night-200">
          Correct answer: <span className="text-leaf-400">{q.correctAnswer}</span>
        </p>
      )}
    </div>
  );
}

// ─── Sign Snap: drag & drop matching (with tap alternative) ─────
function MatchRenderer({ qs, onAnswer, answered, timerSec, reveal }: { qs: Question[] } & Omit<EngineProps, 'item'>) {
  const meanings = useMemo(() => shuffle(qs.map((q) => ({ id: q.id, text: q.correctAnswer }))), [qs]);
  const [assign, setAssign] = useState<Record<string, string>>({}); // signQid -> meaningQid
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const elapsed = useElapsed();
  const finish = (final: Record<string, string>) => {
    if (done) return;
    setDone(true);
    const ms = elapsed();
    const payloads: AnswerPayload[] = qs.map((q) => {
      const chosen = QUESTION_MAP[final[q.id] ?? '']?.correctAnswer ?? '';
      return { qid: q.id, kind: 'option', value: chosen, ms: Math.round(ms / qs.length) };
    });
    const allRight = payloads.every((p) => gradeAnswer(p));
    const firstWrong = qs.find((q) => final[q.id] !== q.id) ?? qs[0];
    onAnswer({ payloads, correct: allRight, chosenText: allRight ? 'All matched' : `Matched "${QUESTION_MAP[final[firstWrong.id] ?? '']?.correctAnswer ?? 'nothing'}"`, primary: firstWrong });
  };
  const place = (signId: string, meaningId: string) => {
    if (done || answered) return;
    const next = { ...assign };
    for (const k of Object.keys(next)) if (next[k] === meaningId) delete next[k];
    next[signId] = meaningId;
    setAssign(next);
    setSelectedSign(null);
    sfx.tap();
    if (Object.keys(next).length === qs.length) finish(next);
  };
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-3">
        <p className="font-display text-xl md:text-2xl">Match each sign to its meaning</p>
        {timerSec && !answered && <span className="ml-auto"><TimerRing seconds={timerSec} paused={done} onExpire={() => finish(assign)} /></span>}
      </div>
      <p className="text-sm text-night-300 mb-4">Drag a sign onto a meaning — or tap a sign, then tap its meaning.</p>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {qs.map((q) => {
          const placed = !!assign[q.id];
          const right = done && reveal && assign[q.id] === q.id;
          const wrong = done && reveal && assign[q.id] !== q.id;
          return (
            <button
              key={q.id}
              draggable={!done}
              onDragStart={(e) => e.dataTransfer.setData('text/plain', q.id)}
              onClick={() => !done && setSelectedSign(q.id)}
              className={`rounded-2xl p-2 bg-gradient-to-b from-sky-200 to-sky-100 border-4 transition focus-ring ${selectedSign === q.id ? 'border-sun-400 scale-105' : right ? 'border-leaf-400' : wrong ? 'border-danger-400' : placed ? 'border-grape-400' : 'border-transparent'}`}
              aria-label={`Sign ${q.sourceCode}${placed ? ', placed' : ''}`}
            >
              <SignArt id={q.visual?.sign ?? ''} className="w-full h-24 md:h-32" />
            </button>
          );
        })}
      </div>
      <div className="grid gap-2.5">
        {meanings.map((m) => {
          const signId = Object.entries(assign).find(([, v]) => v === m.id)?.[0];
          const signQ = signId ? QUESTION_MAP[signId] : null;
          return (
            <div
              key={m.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                place(e.dataTransfer.getData('text/plain'), m.id);
              }}
              onClick={() => selectedSign && place(selectedSign, m.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectedSign && place(selectedSign, m.id)}
              className={`flex items-center gap-3 rounded-2xl border-2 border-dashed px-3 py-2.5 min-h-16 transition focus-ring ${selectedSign ? 'border-sun-400/70 bg-sun-500/10 cursor-pointer' : 'border-white/15 bg-night-800/70'}`}
            >
              <div className="w-12 h-12 shrink-0 rounded-xl bg-night-950/60 grid place-items-center overflow-hidden">
                {signQ && <SignArt id={signQ.visual?.sign ?? ''} className="w-10 h-10" post={false} />}
              </div>
              <span className="font-bold text-sm md:text-base">{m.text}</span>
              {done && reveal && signId && (signId === m.id ? <Check className="ml-auto w-5 h-5 text-leaf-400 shrink-0" aria-label="correct" /> : <X className="ml-auto w-5 h-5 text-danger-400 shrink-0" aria-label="incorrect" />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Which sign means…? (image choice) ─────────────────────────
function PickSignRenderer({ q, choices, onAnswer, answered, reveal, timerSec }: { q: Question; choices: Question[] } & Omit<EngineProps, 'item'>) {
  const order = useMemo(() => shuffle(choices), [choices]);
  const [pick, setPick] = useState<string | null>(null);
  const elapsed = useElapsed();
  const choose = (id: string) => {
    if (pick || answered) return;
    setPick(id);
    const payload: AnswerPayload = { qid: q.id, kind: 'pick', value: id, ms: elapsed() };
    onAnswer({ payloads: [payload], correct: gradeAnswer(payload), chosenText: id === '__timeout__' ? 'Ran out of time' : `Picked sign ${QUESTION_MAP[id]?.sourceCode ?? ''}`, primary: q });
  };
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-2">
        <p className="text-sm font-extrabold uppercase tracking-widest text-aqua-400">Which sign means…</p>
        {timerSec && !answered && <span className="ml-auto"><TimerRing seconds={timerSec} paused={!!pick} onExpire={() => choose('__timeout__')} /></span>}
      </div>
      <p className="font-display text-xl md:text-2xl leading-snug mb-5">“{q.correctAnswer}”</p>
      <div className="grid grid-cols-3 gap-3">
        {order.map((c) => {
          const st = !pick ? 'idle' : reveal && c.id === q.id ? 'good' : c.id === pick ? 'bad' : 'dim';
          return (
            <button key={c.id} onClick={() => choose(c.id)} disabled={!!pick} className={`rounded-2xl p-2 bg-gradient-to-b from-sky-200 to-sky-100 border-4 focus-ring transition ${st === 'good' ? 'border-leaf-400' : st === 'bad' ? 'border-danger-400 animate-shake' : st === 'dim' ? 'border-transparent opacity-50' : 'border-transparent hover:border-sun-400'}`} aria-label={`Sign option ${c.sourceCode}`}>
              <SignArt id={c.visual?.sign ?? ''} className="w-full h-28 md:h-40" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Who goes first? (tap order) ───────────────────────────────
function SequenceRenderer({ q, onAnswer, answered, reveal }: { q: Question } & Omit<EngineProps, 'item'>) {
  const order = q.visual?.order ?? [];
  const labels = (q.visual?.vehicles ?? []).map((v) => v.label).filter(Boolean) as string[];
  const [taps, setTaps] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const elapsed = useElapsed();
  const reduced = useGame((s) => s.settings.reducedMotion);
  const tap = (l: string) => {
    if (done || answered || taps.includes(l)) return;
    sfx.tap();
    const next = [...taps, l];
    setTaps(next);
    if (next.length === order.length) {
      setDone(true);
      const correct = next.every((x, i) => x === order[i]);
      const payload: AnswerPayload = { qid: q.id, kind: 'option', value: correct ? q.correctAnswer : q.incorrectAnswers[0], ms: elapsed() };
      onAnswer({ payloads: [payload], correct, chosenText: `Your order: ${next.join(' → ')}`, primary: q });
    }
  };
  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-start">
      <div>
        <VisualCard q={q}>
          <Visual spec={q.visual} className="w-full h-auto block" teach={done && reveal} reducedMotion={reduced} interaction={{ pickable: done ? [] : labels.filter((l) => !taps.includes(l)), onPick: tap, picked: taps, good: done && reveal ? order.filter((l, i) => taps[i] === l) : [], bad: done && reveal ? taps.filter((l, i) => order[i] !== l) : [] }} />
        </VisualCard>
      </div>
      <div>
        <QuestionHeader q={q} />
        <h2 className="font-display text-xl md:text-2xl leading-snug mb-2">{q.question}</h2>
        <p className="text-sun-400 font-bold mb-4 flex items-center gap-1.5"><Hand className="w-4 h-4" aria-hidden="true" /> Tap the vehicles in the order they should go.</p>
        <div className="flex gap-2 flex-wrap" aria-live="polite">
          {order.map((_, i) => (
            <div key={i} className={`w-14 h-14 rounded-2xl grid place-items-center font-display text-2xl border-2 ${taps[i] ? (done && reveal ? (taps[i] === order[i] ? 'bg-leaf-600/30 border-leaf-400' : 'bg-danger-600/30 border-danger-400') : 'bg-grape-600/30 border-grape-400') : 'border-dashed border-white/20 text-night-500'}`}>
              {taps[i] ?? i + 1}
            </div>
          ))}
          {!done && taps.length > 0 && (
            <button onClick={() => setTaps([])} className="px-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold focus-ring">Reset</button>
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="Vehicle buttons">
          {labels.map((l) => (
            <button key={l} disabled={done || taps.includes(l)} onClick={() => tap(l)} className="rounded-xl bg-night-700 border border-white/10 py-3 font-display text-lg disabled:opacity-40 focus-ring">
              {l.length === 1 ? `Vehicle ${l}` : l}
            </button>
          ))}
        </div>
        {done && reveal && <p className="mt-4 font-bold text-night-200">Correct order: <span className="text-leaf-400">{order.join(' → ')}</span> — {q.correctAnswer}</p>}
      </div>
    </div>
  );
}

// ─── Spot the Hazard ───────────────────────────────────────────
function HazardRenderer({ q, onAnswer, answered, reveal, timerSec }: { q: Question } & Omit<EngineProps, 'item'>) {
  const hazards = useMemo(() => (q.visual?.objects ?? []).map((o, i) => ({ o, i })).filter(({ o }) => HAZARD_TYPES.has(o.type) || o.indicate || o.highlight).map((h) => h.i), [q]);
  const [found, setFound] = useState<number[]>([]);
  const [phase, setPhase] = useState<'spot' | 'answer'>(hazards.length ? 'spot' : 'answer');
  const hit = (i: number) => {
    if (found.includes(i)) return;
    sfx.coin();
    const next = [...found, i];
    setFound(next);
    if (next.length >= hazards.length) setTimeout(() => setPhase('answer'), 500);
  };
  if (phase === 'spot')
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-3">
          <p className="font-display text-2xl">Spot the hazard!</p>
          <span className="ml-auto flex items-center gap-3">
            <span className="font-display text-sun-400">{found.length}/{hazards.length}</span>
            <TimerRing seconds={Math.min(timerSec ?? 10, 10)} paused={phase !== 'spot'} onExpire={() => setPhase('answer')} />
          </span>
        </div>
        <VisualCard q={q}>
          <Visual spec={q.visual} className="w-full h-auto block" hazardMode onHazard={hit} found={found} />
        </VisualCard>
        <div className="mt-3 flex justify-between items-center">
          <p className="text-sm font-bold text-night-300">Tap anything in the scene that could put you in danger.</p>
          <button onClick={() => setPhase('answer')} className="text-sm font-bold text-aqua-400 flex items-center gap-1 focus-ring rounded">Skip <ArrowRight className="w-4 h-4" /></button>
        </div>
      </div>
    );
  return <McqRenderer q={q} onAnswer={onAnswer} answered={answered} reveal={reveal} timerSec={timerSec} />;
}

// ─── Engine ─────────────────────────────────────────────────────
export function QuestionEngine(props: EngineProps) {
  const { item, ...rest } = props;
  switch (item.kind) {
    case 'mcq':
      return <McqRenderer q={item.q} {...rest} />;
    case 'tf':
      return <TrueFalseRenderer q={item.q} shown={item.shown} {...rest} />;
    case 'match':
      return <MatchRenderer qs={item.qs} {...rest} />;
    case 'pick-sign':
      return <PickSignRenderer q={item.q} choices={item.choices} {...rest} />;
    case 'sequence':
      return <SequenceRenderer q={item.q} {...rest} />;
    case 'hazard':
      return <HazardRenderer q={item.q} {...rest} />;
  }
}

export function TimerHint() {
  return <Timer className="w-4 h-4" aria-hidden="true" />;
}
