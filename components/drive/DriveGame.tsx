'use client';
// The driving simulator: steer, accelerate, brake and indicate through a
// NSW-inspired route, with live road-rule events and question checkpoints.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Flame, Sparkles, X, Star, Check } from 'lucide-react';
import { buildWorld, currentObjective, laneX, step, type GameEvent, type Player, type Violation, type World, WORLD_W } from './engine';
import { drawFrame } from './draw';
import { QuestionEngine, type AnswerEvent } from '@/components/game/QuestionEngine';
import { Consequence } from '@/components/game/Consequence';
import { TeachPanel } from '@/components/game/TeachPanel';
import { Confetti } from '@/components/game/Confetti';
import { GameButton, GameLink } from '@/components/ui/Button';
import { ProgressBar, Modal } from '@/components/ui/bits';
import { QUESTION_MAP } from '@/lib/questions';
import { startSession, submitSession } from '@/lib/api';
import { applyServerStats, applySessionResult, bumpCounter, completeLevel, getState, pushToast, useGame } from '@/lib/store';
import { processRewards, snapshot } from '@/lib/rewards';
import { createEngine, sfx } from '@/lib/sound';
import { GAME, LEVELS, paintHex } from '@/lib/config';
import type { AnswerPayload, GameMode, MapLevel, Question, SessionResult } from '@/lib/types';

export interface DriveProps {
  level: Pick<MapLevel, 'id' | 'name' | 'theme' | 'events'> & { num?: number };
  questions: Question[];
  mode: GameMode; // 'journey' | 'drive' | 'onboarding'
  tutorial?: boolean;
  exitHref: string;
  onDone?: (r: { result: SessionResult | null; stars: number; passed: boolean }) => void;
}

type Phase = 'ready' | 'countdown' | 'driving' | 'paused' | 'question' | 'consequence' | 'teach' | 'submitting' | 'finished';

export function DriveGame({ level, questions, mode, tutorial, exitHref, onDone }: DriveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<World>(buildWorld(level, questions.length, tutorial));
  const playerRef = useRef<Player>({ d: 0, lane: 0, x: laneX(worldRef.current, 0), speed: 0, indicator: null, laneChangeFrom: null });
  const input = useRef({ gas: false, brake: false });
  const phaseRef = useRef<Phase>('ready');
  const [phase, setPhaseState] = useState<Phase>('ready');
  const [hud, setHud] = useState({ speed: 0, limit: worldRef.current.limit, progress: 0, objective: 'Press START', indicator: null as Player['indicator'], lane: 0 });
  const [countdown, setCountdown] = useState(3);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answered, setAnswered] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<AnswerEvent | null>(null);
  const [violation, setViolation] = useState<Violation | null>(null);
  const [infringements, setInfringements] = useState(0);
  const [streak, setStreak] = useState(0);
  const [xpRun, setXpRun] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [quit, setQuit] = useState(false);
  const payloads = useRef<AnswerPayload[]>([]);
  const answersLog = useRef<AnswerEvent[]>([]);
  const sessionId = useRef('');
  const before = useRef(snapshot());
  const engineSound = useRef<ReturnType<typeof createEngine> | null>(null);
  const viewH = useRef(640);
  const scale = useRef(1);
  const tRef = useRef(0);
  const reduced = useGame((s) => s.settings.reducedMotion);
  const carColor = useGame((s) => paintHex(s.progress.garage.custom[s.progress.garage.current]?.paint ?? 'sunburst'));
  const maxSpeed = tutorial ? level.theme.speedLimit : level.theme.speedLimit + 35;

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
    if (p !== 'driving') engineSound.current?.set(0);
  }, []);

  // ── canvas sizing
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      const wrap = wrapRef.current;
      if (!c || !wrap) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      scale.current = (w * dpr) / WORLD_W;
      viewH.current = (h * dpr) / scale.current;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── main loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let hudT = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tRef.current += dt;
      const w = worldRef.current;
      const p = playerRef.current;
      if (phaseRef.current === 'driving') {
        const r = step(w, p, dt, input.current, maxSpeed);
        engineSound.current?.set(p.speed);
        if (r.violation) triggerViolation(r.violation);
        else if (r.checkpoint) triggerCheckpoint(r.checkpoint);
        else if (r.finished) void finish();
      }
      const c = canvasRef.current;
      const ctx = c?.getContext('2d');
      if (c && ctx) {
        ctx.setTransform(scale.current, 0, 0, scale.current, 0, 0);
        drawFrame(ctx, w, p, { scenery: level.theme.scenery, env: level.theme.env, grass: level.theme.grass }, viewH.current, tRef.current, carColor, input.current.brake && p.speed > 0);
      }
      hudT += dt;
      if (hudT > 0.1) {
        hudT = 0;
        setHud({ speed: Math.round(p.speed), limit: w.limit, progress: Math.min(1, p.d / w.length), objective: currentObjective(w, p), indicator: p.indicator, lane: p.lane });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carColor]);

  useEffect(() => () => engineSound.current?.stop(), []);

  // Development-only helper for automated play-testing (stripped of effect in production).
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    (window as unknown as Record<string, unknown>).__rqJump = (frac: number) => {
      playerRef.current.d = worldRef.current.length * frac;
      for (const ev of worldRef.current.events) if (ev.at < playerRef.current.d && ev.type !== 'checkpoint') ev.done = true;
    };
  }, []);

  // ── indicator ticking sound
  useEffect(() => {
    if (!hud.indicator || phase !== 'driving') return;
    const id = setInterval(() => sfx.indicator(), 420);
    return () => clearInterval(id);
  }, [hud.indicator, phase]);

  const steer = useCallback((dir: -1 | 1) => {
    if (phaseRef.current !== 'driving') return;
    const w = worldRef.current;
    const p = playerRef.current;
    const target = Math.max(0, Math.min(w.lanes - 1, p.lane + dir));
    if (target === p.lane) return;
    const needed = dir === 1 ? 'right' : 'left';
    const signalled = p.indicator === needed;
    p.laneChangeFrom = p.lane;
    p.lane = target;
    if (!signalled && !tutorial) triggerViolation({ kind: 'no-signal', code: 'LD013', consequence: 'near-miss', happened: `You changed lanes to the ${needed} without indicating first.` });
    else if (!signalled && tutorial) pushToast({ kind: 'info', title: 'Tip: indicate first!', body: 'Always signal before you change lanes.' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorial]);

  const indicate = useCallback((dir: 'left' | 'right') => {
    const p = playerRef.current;
    p.indicator = p.indicator === dir ? null : dir;
    sfx.indicator();
  }, []);

  // ── keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') input.current.gas = true;
      if (k === 'arrowdown' || k === 's' || k === ' ') input.current.brake = true;
      if (e.repeat) return;
      if (k === 'arrowleft' || k === 'a') steer(-1);
      if (k === 'arrowright' || k === 'd') steer(1);
      if (k === 'q' || k === 'z') indicate('left');
      if (k === 'e' || k === 'x') indicate('right');
      if (k === 'p' || k === 'escape') {
        if (phaseRef.current === 'driving') setPhase('paused');
        else if (phaseRef.current === 'paused') setPhase('driving');
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') input.current.gas = false;
      if (k === 'arrowdown' || k === 's' || k === ' ') input.current.brake = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [steer, indicate, setPhase]);

  const start = async () => {
    before.current = snapshot();
    setPhase('countdown');
    try {
      const s = await startSession(mode, questions.map((q) => q.id), { levelId: level.id });
      sessionId.current = s.sessionId;
    } catch (e) {
      pushToast({ kind: 'info', title: 'Offline drive', body: (e as Error).message });
    }
    engineSound.current = createEngine();
    let n = 3;
    setCountdown(n);
    sfx.countdown();
    const id = setInterval(() => {
      n--;
      setCountdown(n);
      if (n > 0) sfx.countdown();
      if (n <= 0) {
        clearInterval(id);
        sfx.go();
        setPhase('driving');
      }
    }, reduced ? 350 : 700);
  };

  function triggerViolation(v: Violation) {
    input.current = { gas: false, brake: false };
    playerRef.current.speed = 0;
    setViolation(v);
    setInfringements((n) => n + 1);
    setStreak(0);
    setPhase('consequence');
  }

  function triggerCheckpoint(ev: GameEvent) {
    const q = questions[ev.qIndex ?? 0];
    if (!q) return;
    input.current = { gas: false, brake: false };
    playerRef.current.speed = Math.min(playerRef.current.speed, 30);
    setQuestion(q);
    setAnswered(false);
    setLastAnswer(null);
    setPhase('question');
    sfx.whoosh();
  }

  const onAnswer = (e: AnswerEvent) => {
    setAnswered(true);
    setLastAnswer(e);
    payloads.current.push(...e.payloads);
    answersLog.current.push(e);
    if (e.correct) {
      const q = e.primary;
      const xp = (q.difficulty >= GAME.xp.hardFromDifficulty ? GAME.xp.correctHard : GAME.xp.correctStandard) + (e.payloads[0]?.ms <= GAME.xp.fastThresholdMs ? GAME.xp.fastBonus : 0);
      setXpRun((x) => x + xp);
      setStreak((s) => s + 1);
      sfx.correct();
    } else {
      setStreak(0);
      setTimeout(() => {
        setViolation(null);
        setPhase('consequence');
      }, 600);
    }
  };

  const resume = () => {
    setQuestion(null);
    setViolation(null);
    setLastAnswer(null);
    setPhase('driving');
  };

  const finish = async () => {
    if (phaseRef.current === 'submitting' || phaseRef.current === 'finished') return;
    setPhase('submitting');
    engineSound.current?.stop();
    const correct = answersLog.current.filter((a) => a.correct).length;
    const total = Math.max(1, answersLog.current.length);
    const acc = correct / total;
    const passed = questions.length === 0 || acc >= 0.6;
    const stars = !passed ? 0 : acc >= 0.9 && infringements === 0 ? 3 : acc >= 0.75 && infringements <= 1 ? 2 : 1;
    let r: SessionResult | null = null;
    try {
      const res = await submitSession(sessionId.current, mode, payloads.current, { levelId: level.id });
      r = res.result;
      applySessionResult(r);
      if (res.stats) applyServerStats(res.stats);
    } catch (e) {
      pushToast({ kind: 'info', title: 'Could not save results', body: (e as Error).message });
    }
    if (mode === 'onboarding' && getState().progress.counters.firstDrive === 0) bumpCounter('firstDrive');
    if (infringements === 0) bumpCounter('cleanDrives');
    if (mode === 'journey' && passed) {
      const wasDone = !!getState().progress.map[level.id];
      completeLevel(level.id, stars, Math.round(acc * 100));
      const idx = LEVELS.findIndex((l) => l.id === level.id);
      const nextL = LEVELS[idx + 1];
      if (!wasDone && nextL) pushToast({ kind: 'unlock', title: `NEW AREA UNLOCKED: ${nextL.name.toUpperCase()}`, body: nextL.blurb, icon: nextL.icon });
    }
    processRewards(before.current);
    setResult(r);
    setPhase('finished');
    sfx.levelUp();
    onDone?.({ result: r, stars, passed });
    finalRef.current = { stars, passed, acc };
  };
  const finalRef = useRef({ stars: 0, passed: false, acc: 0 });

  const hold = (key: 'gas' | 'brake', v: boolean) => (e: React.PointerEvent) => {
    e.preventDefault();
    input.current[key] = v;
  };

  const over = hud.speed > hud.limit + 2;
  const qIndex = answersLog.current.length;
  const nextLevel = LEVELS[LEVELS.findIndex((l) => l.id === level.id) + 1];

  return (
    <div className="fixed inset-0 bg-night-950 flex flex-col select-none" style={{ touchAction: 'none' }}>
      {/* Top HUD */}
      <div className="relative z-10 flex items-center gap-2 px-3 pt-[max(.5rem,env(safe-area-inset-top))] pb-2 bg-night-950/90 border-b border-white/5">
        <button onClick={() => { if (phaseRef.current === 'driving') setPhase('paused'); setQuit(true); }} className="p-2 rounded-xl hover:bg-white/10 focus-ring" aria-label="Quit drive">
          <X className="w-6 h-6" />
        </button>
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-aqua-400">{level.num ? `Location ${level.num}` : tutorial ? 'Tutorial' : 'Free drive'}</div>
          <div className="font-display text-base leading-none truncate">{level.name}</div>
        </div>
        <div className="flex-1 mx-2"><ProgressBar value={hud.progress} height="h-2.5" color="from-aqua-400 to-leaf-400" label="Route progress" /></div>
        <div className={`flex items-center gap-1 font-display ${streak >= 3 ? 'text-flame-400' : 'text-night-400'}`}><Flame className="w-5 h-5" aria-hidden="true" />{streak}</div>
        <div className="flex items-center gap-1 font-display text-sun-400"><Sparkles className="w-5 h-5" aria-hidden="true" />{xpRun}</div>
        <button onClick={() => setPhase(phaseRef.current === 'paused' ? 'driving' : 'paused')} disabled={phase !== 'driving' && phase !== 'paused'} className="p-2 rounded-xl hover:bg-white/10 focus-ring disabled:opacity-30" aria-label={phase === 'paused' ? 'Resume' : 'Pause'}>
          {phase === 'paused' ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      </div>

      {/* Road */}
      <div className="relative flex-1 min-h-0 flex justify-center bg-night-900">
        <div ref={wrapRef} className="relative h-full w-full max-w-[560px] overflow-hidden">
          <canvas ref={canvasRef} className="block" aria-label={`Driving view. ${hud.objective}`} role="img" />
          {/* objective + speedo */}
          <div className="absolute top-3 inset-x-3 flex justify-between items-start gap-2 pointer-events-none">
            <div className="rounded-2xl bg-night-950/80 border border-white/10 px-3 py-2 max-w-[58%]" aria-live="polite">
              <div className="text-[10px] font-extrabold tracking-widest text-aqua-400">OBJECTIVE</div>
              <div className="font-bold text-sm leading-snug">{hud.objective}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`rounded-2xl px-3 py-1.5 text-center border-2 ${over ? 'bg-danger-600/80 border-danger-400 animate-pulse' : 'bg-night-950/80 border-white/10'}`}>
                <div className="font-display text-3xl leading-none tabular-nums" aria-label={`Speed ${hud.speed} km/h`}>{hud.speed}</div>
                <div className="text-[10px] font-extrabold tracking-widest">KM/H</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-white border-[5px] border-[#d71920] grid place-items-center font-display text-night-950 text-lg" aria-label={`Speed limit ${hud.limit}`}>{hud.limit}</div>
            </div>
          </div>
          {hud.indicator && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-6 pointer-events-none" aria-hidden="true">
              <ArrowLeft className={`w-9 h-9 ${hud.indicator === 'left' ? 'text-flame-400 animate-blink' : 'text-night-700'}`} strokeWidth={3} />
              <ArrowRight className={`w-9 h-9 ${hud.indicator === 'right' ? 'text-flame-400 animate-blink' : 'text-night-700'}`} strokeWidth={3} />
            </div>
          )}
          {(phase === 'ready' || phase === 'countdown') && (
            <div className="absolute inset-0 grid place-items-center bg-night-950/70 backdrop-blur-sm p-4">
              {phase === 'ready' ? (
                <div className="card-game p-6 max-w-sm text-center animate-pop">
                  <div className="text-xs font-extrabold uppercase tracking-[.25em] text-aqua-400">{level.num ? `Location ${level.num}` : 'Drive'}</div>
                  <h1 className="font-display text-3xl mb-3">{level.name}</h1>
                  <ul className="text-left text-sm text-night-200 space-y-1.5 mb-5">
                    <li>⬆️ / W — accelerate · ⬇️ / S / Space — brake</li>
                    <li>⬅️ ➡️ / A D — change lanes</li>
                    <li>Q / E — indicate left / right (always signal first!)</li>
                    <li>On phones use the big on-screen controls.</li>
                    {questions.length > 0 && <li>🟦 {questions.length} decision points — answer to keep driving.</li>}
                  </ul>
                  <GameButton tone="sun" size="lg" full onClick={() => void start()} autoFocus>Start engine</GameButton>
                </div>
              ) : (
                <div key={countdown} className="font-display text-8xl text-sun-400 text-outline animate-pop" aria-live="assertive">{countdown > 0 ? countdown : 'GO!'}</div>
              )}
            </div>
          )}
          {phase === 'paused' && !quit && (
            <div className="absolute inset-0 grid place-items-center bg-night-950/70 backdrop-blur-sm">
              <div className="card-game p-6 text-center">
                <div className="font-display text-4xl mb-4">PAUSED</div>
                <GameButton tone="sun" onClick={() => setPhase('driving')} autoFocus><Play className="w-5 h-5" /> Resume</GameButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Touch controls */}
      <div className="relative z-10 bg-night-950/95 border-t border-white/5 px-3 pt-2 pb-[max(.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-[560px] grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
          <div className="flex gap-2">
            <button onPointerDown={(e) => { e.preventDefault(); steer(-1); }} className="flex-1 h-16 rounded-2xl bg-night-700 border-2 border-white/10 grid place-items-center active:bg-night-600 focus-ring" aria-label="Steer left (change lane left)">
              <ChevronLeft className="w-9 h-9" />
            </button>
            <button onPointerDown={(e) => { e.preventDefault(); steer(1); }} className="flex-1 h-16 rounded-2xl bg-night-700 border-2 border-white/10 grid place-items-center active:bg-night-600 focus-ring" aria-label="Steer right (change lane right)">
              <ChevronRight className="w-9 h-9" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1.5">
              <button onClick={() => indicate('left')} aria-pressed={hud.indicator === 'left'} className={`w-12 h-10 rounded-xl border-2 grid place-items-center focus-ring ${hud.indicator === 'left' ? 'bg-flame-500 border-flame-300 text-night-950' : 'bg-night-800 border-white/10'}`} aria-label="Indicate left">
                <ArrowLeft className="w-5 h-5" strokeWidth={3} />
              </button>
              <button onClick={() => indicate('right')} aria-pressed={hud.indicator === 'right'} className={`w-12 h-10 rounded-xl border-2 grid place-items-center focus-ring ${hud.indicator === 'right' ? 'bg-flame-500 border-flame-300 text-night-950' : 'bg-night-800 border-white/10'}`} aria-label="Indicate right">
                <ArrowRight className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
            <div className="text-center text-[10px] font-extrabold tracking-widest text-night-400">INDICATORS</div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onPointerDown={hold('brake', true)} onPointerUp={hold('brake', false)} onPointerLeave={hold('brake', false)} onPointerCancel={hold('brake', false)} className="w-20 h-16 rounded-2xl bg-gradient-to-b from-danger-400 to-danger-600 font-display text-lg shadow-[0_4px_0_#7f1d1d] active:translate-y-1 active:shadow-none focus-ring" aria-label="Brake (hold)">
              BRAKE
            </button>
            <button onPointerDown={hold('gas', true)} onPointerUp={hold('gas', false)} onPointerLeave={hold('gas', false)} onPointerCancel={hold('gas', false)} className="w-20 h-20 rounded-2xl bg-gradient-to-b from-leaf-400 to-leaf-600 text-night-950 font-display text-lg shadow-[0_4px_0_#166534] active:translate-y-1 active:shadow-none focus-ring" aria-label="Accelerate (hold)">
              GAS
            </button>
          </div>
        </div>
      </div>

      {/* Question checkpoint */}
      {phase === 'question' && question && (
        <div className="fixed inset-0 z-50 bg-night-950/92 backdrop-blur-md overflow-y-auto">
          <div className="mx-auto max-w-5xl p-4 pb-32 animate-slide-up">
            <div className="text-center mb-4">
              <div className="font-display text-sm text-aqua-400 tracking-[.3em]">DECISION POINT {qIndex + (answered ? 0 : 1)}/{questions.length}</div>
            </div>
            <QuestionEngine item={{ kind: 'mcq', q: question }} onAnswer={onAnswer} reveal answered={answered} />
            {answered && lastAnswer?.correct && (
              <div className="mt-6 flex justify-center">
                <GameButton tone="leaf" size="lg" onClick={resume} autoFocus>
                  <Check className="w-5 h-5" /> Correct — keep driving
                </GameButton>
              </div>
            )}
          </div>
        </div>
      )}
      {phase === 'consequence' && (violation || lastAnswer) && (
        <Consequence type={violation ? violation.consequence : lastAnswer!.primary.consequence} onDone={() => setPhase('teach')} />
      )}
      {phase === 'teach' && violation && QUESTION_MAP[violation.code.toLowerCase()] && (
        <TeachPanel q={QUESTION_MAP[violation.code.toLowerCase()]} chosen="" happened={violation.happened} onContinue={resume} />
      )}
      {phase === 'teach' && !violation && lastAnswer && <TeachPanel q={lastAnswer.primary} chosen={lastAnswer.chosenText} onContinue={resume} />}

      {/* Finish */}
      {(phase === 'submitting' || phase === 'finished') && (
        <div className="fixed inset-0 z-50 bg-night-950/92 backdrop-blur-md overflow-y-auto grid place-items-center p-4">
          {phase === 'finished' && finalRef.current.passed && <Confetti />}
          <div className="card-game p-6 w-full max-w-md text-center animate-pop">
            {phase === 'submitting' ? (
              <div className="font-display text-2xl py-8">Parking up…</div>
            ) : (
              <>
                {tutorial ? (
                  <div className="font-display text-4xl text-sun-400 text-outline mb-2">YOU&apos;RE ON THE ROAD.</div>
                ) : (
                  <>
                    <div className="flex justify-center gap-2 mb-2" aria-label={`${finalRef.current.stars} of 3 stars`}>
                      {[0, 1, 2].map((i) => <Star key={i} className={`w-12 h-12 ${i < finalRef.current.stars ? 'text-sun-400 fill-sun-400' : 'text-night-600'}`} />)}
                    </div>
                    <div className={`font-display text-4xl ${finalRef.current.passed ? 'text-leaf-400' : 'text-flame-400'}`}>{finalRef.current.passed ? 'LOCATION CLEARED!' : 'NOT QUITE!'}</div>
                  </>
                )}
                <p className="text-night-300 font-bold mt-1 mb-4">
                  {answersLog.current.filter((a) => a.correct).length}/{answersLog.current.length} decisions correct · {infringements} infringement{infringements === 1 ? '' : 's'}
                </p>
                {result && (
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    <div className="rounded-xl bg-white/5 p-2"><div className="font-display text-xl text-sun-400">+{result.xp}</div><div className="text-[10px] font-bold text-night-300">XP</div></div>
                    <div className="rounded-xl bg-white/5 p-2"><div className="font-display text-xl text-sun-300">+{result.coins}</div><div className="text-[10px] font-bold text-night-300">COINS</div></div>
                    <div className="rounded-xl bg-white/5 p-2"><div className="font-display text-xl text-aqua-400">{result.skillAfter}</div><div className="text-[10px] font-bold text-night-300">SKILL</div></div>
                  </div>
                )}
                {!finalRef.current.passed && !tutorial && <p className="text-sm text-night-300 mb-4">Get at least 60% of decisions right to clear this location.</p>}
                <div className="flex flex-col gap-2">
                  {tutorial ? (
                    <GameLink tone="sun" size="lg" href="/map" full>Open the map</GameLink>
                  ) : finalRef.current.passed && nextLevel && mode === 'journey' ? (
                    <GameLink tone="sun" size="lg" href="/map" full>Next location: {nextLevel.name}</GameLink>
                  ) : (
                    <GameButton tone="sun" size="lg" full onClick={() => window.location.reload()}>Drive again</GameButton>
                  )}
                  <GameLink tone="dark" href={exitHref} full>Back</GameLink>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Modal open={quit} onClose={() => setQuit(false)} title="End this drive?">
        <p className="text-night-300 mb-4">Progress on this route won&apos;t be saved.</p>
        <div className="flex gap-2">
          <Link href={exitHref} className="btn-3d bg-gradient-to-b from-danger-400 to-danger-600 text-white px-5 py-3" style={{ ['--btn-shadow' as string]: '#7f1d1d' } as React.CSSProperties}>Leave</Link>
          <GameButton tone="dark" onClick={() => setQuit(false)}>Keep driving</GameButton>
        </div>
      </Modal>
    </div>
  );
}
