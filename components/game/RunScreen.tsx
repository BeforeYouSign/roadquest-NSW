'use client';
// Runs one game session: intro → questions (with consequences + teaching) → server grading → results.
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Coins, Flame, Sparkles, Trophy, TrendingUp, RotateCcw, X, Check, Star } from 'lucide-react';
import { QuestionEngine, type AnswerEvent, type ChallengeItem } from './QuestionEngine';
import { Consequence } from './Consequence';
import { TeachPanel } from './TeachPanel';
import { Confetti } from './Confetti';
import { GameButton, GameLink } from '@/components/ui/Button';
import { ProgressBar, Spinner, Modal } from '@/components/ui/bits';
import { buildItems, itemCount } from '@/lib/challenges';
import { QUESTION_MAP } from '@/lib/questions';
import { startSession, submitSession, type SessionMeta } from '@/lib/api';
import { applyServerStats, applySessionResult, useGame } from '@/lib/store';
import { processRewards, snapshot } from '@/lib/rewards';
import { skillTier } from '@/lib/scoring';
import { sfx } from '@/lib/sound';
import { GAME } from '@/lib/config';
import type { AnswerPayload, GameMode, MiniGame, Question, SessionResult } from '@/lib/types';

export interface RunConfig {
  mode: GameMode;
  title: string;
  subtitle?: string;
  questions: Question[];
  mechanic?: MiniGame['mechanic'] | 'standard';
  timerSec?: number;
  meta?: SessionMeta;
  reveal?: boolean;
  intro?: ReactNode;
  exitHref: string;
  exitLabel?: string;
  onFinished?: (r: SessionResult, log: AnswerEvent[]) => void;
  resultsExtra?: (r: SessionResult) => ReactNode;
  autoStart?: boolean;
  embedded?: boolean; // used inside the driving game (no intro/results chrome)
}

type Phase = 'intro' | 'loading' | 'play' | 'consequence' | 'teach' | 'submitting' | 'results' | 'error';

export function RunScreen(cfg: RunConfig) {
  const reveal = cfg.reveal ?? true;
  const [phase, setPhase] = useState<Phase>(cfg.autoStart ? 'loading' : 'intro');
  const [items, setItems] = useState<ChallengeItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [last, setLast] = useState<AnswerEvent | null>(null);
  const [streak, setStreak] = useState(0);
  const [xpRun, setXpRun] = useState(0);
  const [fly, setFly] = useState<{ id: number; text: string } | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quit, setQuit] = useState(false);
  const log = useRef<AnswerEvent[]>([]);
  const payloads = useRef<AnswerPayload[]>([]);
  const session = useRef<string>('');
  const before = useRef(snapshot());
  const reduced = useGame((s) => s.settings.reducedMotion);
  const started = useRef(false);

  const begin = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    setPhase('loading');
    try {
      before.current = snapshot();
      const s = await startSession(cfg.mode, cfg.questions.map((q) => q.id), cfg.meta);
      session.current = s.sessionId;
      const qs = s.questionIds.map((id) => QUESTION_MAP[id]).filter(Boolean);
      const built = buildItems(qs.length ? qs : cfg.questions, cfg.mechanic ?? 'standard');
      setItems(built);
      setIdx(0);
      setPhase('play');
      sfx.go();
    } catch (e) {
      setError((e as Error).message);
      setPhase('error');
      started.current = false;
    }
  }, [cfg.mode, cfg.questions, cfg.meta, cfg.mechanic]);

  useEffect(() => {
    if (cfg.autoStart) void begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(() => itemCount(items), [items]);
  const doneCount = useMemo(() => items.slice(0, idx).reduce((n, it) => n + (it.kind === 'match' ? it.qs.length : 1), 0), [items, idx]);

  const finish = useCallback(async () => {
    setPhase('submitting');
    try {
      const { result: r, stats } = await submitSession(session.current, cfg.mode, payloads.current, cfg.meta);
      applySessionResult(r, { dayKey: cfg.meta?.dayKey, weekKey: cfg.meta?.weekKey, minigameId: cfg.meta?.minigameId });
      if (stats) applyServerStats(stats);
      cfg.onFinished?.(r, log.current);
      processRewards(before.current);
      setResult(r);
      setPhase('results');
      if (r.perfect || r.passed) sfx.levelUp();
      else sfx.coin();
    } catch (e) {
      setError((e as Error).message);
      setPhase('error');
    }
  }, [cfg]);

  const next = useCallback(() => {
    setLast(null);
    setAnswered(false);
    if (idx + 1 >= items.length) void finish();
    else {
      setIdx((i) => i + 1);
      setPhase('play');
    }
  }, [idx, items.length, finish]);

  const onAnswer = (e: AnswerEvent) => {
    if (answered) return;
    setAnswered(true);
    setLast(e);
    log.current.push(e);
    payloads.current.push(...e.payloads);
    if (!reveal) {
      sfx.tap();
      setTimeout(next, 250);
      return;
    }
    if (e.correct) {
      const gained = e.payloads.reduce((s, p) => {
        const q = QUESTION_MAP[p.qid];
        return s + (q && q.difficulty >= GAME.xp.hardFromDifficulty ? GAME.xp.correctHard : GAME.xp.correctStandard) + (p.ms <= GAME.xp.fastThresholdMs ? GAME.xp.fastBonus : 0);
      }, 0);
      setXpRun((x) => x + gained);
      setStreak((s) => s + 1);
      setFly({ id: Date.now(), text: `+${gained} XP` });
      sfx.correct();
      setTimeout(() => sfx.xp(), 150);
    } else {
      setStreak(0);
      setTimeout(() => setPhase('consequence'), reduced ? 200 : 650);
    }
  };

  // ── intro
  if (phase === 'intro')
    return (
      <Shell cfg={cfg} onQuit={null}>
        <div className="max-w-xl mx-auto text-center py-8 animate-slide-up">
          <div className="text-xs font-extrabold uppercase tracking-[0.25em] text-aqua-400 mb-2">{cfg.subtitle ?? 'Get ready'}</div>
          <h1 className="font-display text-4xl md:text-5xl mb-4">{cfg.title}</h1>
          {cfg.intro && <div className="card-game p-5 text-left mb-6 text-night-200">{cfg.intro}</div>}
          <GameButton tone="sun" size="xl" onClick={() => void begin()} autoFocus>
            Start
          </GameButton>
        </div>
      </Shell>
    );
  if (phase === 'loading' || phase === 'submitting')
    return (
      <Shell cfg={cfg} onQuit={null}>
        <Spinner label={phase === 'loading' ? 'Warming up the engine' : 'Checking your answers'} />
      </Shell>
    );
  if (phase === 'error')
    return (
      <Shell cfg={cfg} onQuit={null}>
        <div className="max-w-md mx-auto card-game p-6 text-center">
          <div className="font-display text-2xl mb-2">Hmm, a roadblock</div>
          <p className="text-night-300 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <GameButton tone="sun" onClick={() => (items.length ? void finish() : void begin())}>Try again</GameButton>
            <GameLink tone="dark" href={cfg.exitHref}>Back</GameLink>
          </div>
        </div>
      </Shell>
    );
  if (phase === 'results' && result) return <Results cfg={cfg} r={result} log={log.current} />;

  const item = items[idx];
  const correctNow = last?.correct;
  return (
    <Shell cfg={cfg} onQuit={() => setQuit(true)}>
      {/* HUD */}
      <div className="flex items-center gap-3 mb-4">
        <div className="font-display text-sm text-night-300 shrink-0" aria-live="polite">
          {Math.min(doneCount + 1, total)}/{total}
        </div>
        <ProgressBar value={doneCount / Math.max(1, total)} color="from-aqua-400 to-grape-500" label="Challenge progress" />
        {reveal && (
          <>
            <div className={`flex items-center gap-1 font-display shrink-0 ${streak >= 3 ? 'text-flame-400' : 'text-night-400'}`} title="Streak">
              <Flame className={`w-5 h-5 ${streak >= 5 ? 'animate-wiggle' : ''}`} aria-hidden="true" />
              <span aria-label={`streak ${streak}`}>{streak}</span>
            </div>
            <div className="flex items-center gap-1 font-display text-sun-400 shrink-0" title="XP this run">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              {xpRun}
            </div>
          </>
        )}
      </div>
      <div className="relative" key={idx}>
        {item && <QuestionEngine item={item} onAnswer={onAnswer} reveal={reveal} answered={answered} timerSec={cfg.timerSec} />}
        {fly && (
          <div key={fly.id} className="pointer-events-none absolute left-1/2 top-10 font-display text-3xl text-sun-400 text-outline" style={{ animation: 'flyUp 1.1s ease-out forwards' }}>
            {fly.text}
          </div>
        )}
      </div>
      {answered && reveal && correctNow && phase === 'play' && (
        <div className="fixed bottom-0 inset-x-0 z-30 p-3 safe-bottom bg-gradient-to-t from-night-950 via-night-950/95 to-transparent">
          <div className="mx-auto max-w-2xl flex items-center gap-3 rounded-2xl bg-leaf-600/25 border-2 border-leaf-400 px-4 py-3 animate-slide-up">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-leaf-500 text-night-950"><Check className="w-6 h-6" strokeWidth={3} /></span>
            <div className="min-w-0">
              <div className="font-display text-xl text-leaf-300">{streak >= 5 ? `${streak} IN A ROW!` : ['NICE!', 'SPOT ON!', 'CORRECT!', 'SAFE DRIVING!'][idx % 4]}</div>
              <div className="text-xs text-night-200 truncate">{last?.primary.correctAnswer}</div>
            </div>
            <GameButton tone="leaf" className="ml-auto" onClick={next} autoFocus>
              {idx + 1 >= items.length ? 'Finish' : 'Next'}
            </GameButton>
          </div>
        </div>
      )}
      {phase === 'consequence' && last && <Consequence type={last.primary.consequence} onDone={() => setPhase('teach')} />}
      {phase === 'teach' && last && <TeachPanel q={last.primary} chosen={last.chosenText} onContinue={next} />}
      <Modal open={quit} onClose={() => setQuit(false)} title="Leave this run?">
        <p className="text-night-300 mb-4">Your answers in this run won&apos;t be saved{cfg.mode === 'daily' ? ' and today’s ranked attempt stays available' : ''}.</p>
        <div className="flex gap-2">
          <GameLink tone="danger" href={cfg.exitHref}>Leave</GameLink>
          <GameButton tone="dark" onClick={() => setQuit(false)}>Keep driving</GameButton>
        </div>
      </Modal>
    </Shell>
  );
}

function Shell({ cfg, children, onQuit }: { cfg: RunConfig; children: ReactNode; onQuit: (() => void) | null }) {
  return (
    <div className="min-h-dvh">
      <div className="sticky top-0 z-20 bg-night-950/80 backdrop-blur border-b border-white/5">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
          {onQuit ? (
            <button onClick={onQuit} className="p-2 -ml-2 rounded-xl hover:bg-white/10 focus-ring" aria-label="Quit run">
              <X className="w-6 h-6" />
            </button>
          ) : (
            <Link href={cfg.exitHref} className="p-2 -ml-2 rounded-xl hover:bg-white/10 focus-ring" aria-label="Back">
              <ArrowLeft className="w-6 h-6" />
            </Link>
          )}
          <div className="font-display text-lg truncate">{cfg.title}</div>
          {cfg.mode === 'test' || cfg.mode === 'final' ? <span className="ml-auto text-[10px] font-bold text-night-400 hidden sm:block">{GAME.branding.testDisclaimer}</span> : null}
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-5 pb-32">{children}</div>
    </div>
  );
}

function Results({ cfg, r, log }: { cfg: RunConfig; r: SessionResult; log: AnswerEvent[] }) {
  const pct = r.total ? r.correctCount / r.total : 0;
  const isTest = r.mode === 'test' || r.mode === 'final';
  const headline = isTest ? (r.passed ? 'PASSED!' : 'NOT YET') : r.perfect ? 'PERFECT DRIVE!' : pct >= 0.8 ? 'GREAT DRIVE!' : pct >= 0.5 ? 'GOOD EFFORT!' : 'KEEP PRACTISING!';
  const color = isTest ? (r.passed ? 'text-leaf-400' : 'text-flame-400') : pct >= 0.8 ? 'text-sun-400' : 'text-aqua-400';
  const wrong = log.filter((e) => !e.correct);
  const dSkill = r.skillAfter - r.skillBefore;
  const tier = skillTier(r.skillAfter);
  const stars = pct >= 0.95 ? 3 : pct >= 0.75 ? 2 : pct >= 0.5 ? 1 : 0;
  return (
    <div className="min-h-dvh">
      {(r.perfect || r.passed) && <Confetti />}
      <div className="mx-auto max-w-3xl px-4 py-8 pb-32">
        <div className="text-center animate-pop">
          {!isTest && (
            <div className="flex justify-center gap-2 mb-2" aria-label={`${stars} of 3 stars`}>
              {[0, 1, 2].map((i) => (
                <Star key={i} className={`w-12 h-12 ${i < stars ? 'text-sun-400 fill-sun-400' : 'text-night-600'}`} style={{ animation: i < stars ? `pop .4s ${0.2 + i * 0.2}s both` : undefined }} />
              ))}
            </div>
          )}
          <div className={`font-display text-5xl md:text-6xl text-outline ${color}`}>{headline}</div>
          <p className="text-night-300 font-bold mt-2">
            {r.correctCount} / {r.total} correct {r.ranked ? '· RANKED ATTEMPT' : r.mode === 'daily' || r.mode === 'weekly' ? '· practice replay (not ranked)' : ''}
          </p>
        </div>

        {isTest && r.sectionScores && (
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            {r.sectionScores.map((s) => (
              <div key={s.id} className={`card-game p-4 border-2 ${s.passed ? 'border-leaf-500/60' : 'border-flame-500/60'}`}>
                <div className="text-xs font-extrabold uppercase tracking-widest text-night-300">{s.label}</div>
                <div className="font-display text-3xl">{s.correct}/{s.total}</div>
                <div className={`text-sm font-bold ${s.passed ? 'text-leaf-400' : 'text-flame-400'}`}>{s.passed ? '✓ Pass' : '✗ Below pass mark'} (need {s.passMark})</div>
              </div>
            ))}
            <p className="sm:col-span-2 text-xs text-night-400">{GAME.branding.testDisclaimer}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <Reward icon={<Sparkles className="w-6 h-6" />} label="XP" value={`+${r.xp}`} tone="text-sun-400" />
          <Reward icon={<Coins className="w-6 h-6" />} label="Coins" value={`+${r.coins}`} tone="text-sun-300" />
          <Reward icon={<Trophy className="w-6 h-6" />} label="Comp. points" value={`+${r.points}`} tone="text-aqua-400" />
          <Reward icon={<TrendingUp className="w-6 h-6" />} label={`Skill · ${tier.name}`} value={`${r.skillAfter.toLocaleString()} (${dSkill >= 0 ? '+' : ''}${dSkill})`} tone={dSkill >= 0 ? 'text-leaf-400' : 'text-danger-400'} />
        </div>
        {r.bonuses.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {r.bonuses.map((b, i) => (
              <span key={i} className="rounded-full bg-grape-600/30 border border-grape-400/50 px-3 py-1 text-sm font-bold">
                {b.label} +{b.xp} XP{b.coins ? ` · +${b.coins} coins` : ''}
              </span>
            ))}
          </div>
        )}
        {cfg.resultsExtra?.(r)}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <GameButton tone="sun" size="lg" onClick={() => window.location.reload()}>
            <RotateCcw className="w-5 h-5" /> Play again
          </GameButton>
          <GameLink tone="dark" size="lg" href={cfg.exitHref}>
            {cfg.exitLabel ?? 'Continue'}
          </GameLink>
        </div>

        {wrong.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-2xl mb-3">Review your mistakes</h2>
            <div className="space-y-3">
              {wrong.map((e, i) => (
                <div key={i} className="card-game p-4">
                  <div className="text-xs font-bold text-night-400 mb-1">{e.primary.sourceCode}</div>
                  <div className="font-bold mb-2">{e.primary.question}</div>
                  <div className="text-sm text-danger-300 flex gap-2"><X className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /> <span><span className="sr-only">Your answer: </span>{e.chosenText === '__timeout__' ? 'No answer (time ran out)' : e.chosenText}</span></div>
                  <div className="text-sm text-leaf-300 flex gap-2 mt-1"><Check className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /> <span><span className="sr-only">Correct answer: </span>{e.primary.correctAnswer}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Reward({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="card-game p-4 text-center animate-pop">
      <div className={`flex justify-center ${tone}`}>{icon}</div>
      <div className={`font-display text-2xl mt-1 ${tone}`}>{value}</div>
      <div className="text-[11px] font-extrabold uppercase tracking-widest text-night-300">{label}</div>
    </div>
  );
}
