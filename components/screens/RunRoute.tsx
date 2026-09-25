'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { RunScreen, type RunConfig } from '@/components/game/RunScreen';
import { Spinner, EmptyState } from '@/components/ui/bits';
import { GameLink } from '@/components/ui/Button';
import { RequireProfile } from './RequireProfile';
import { getState, setLicence, pushToast, useGame } from '@/lib/store';
import { CATEGORY_MAP, GAME, MINIGAME_MAP } from '@/lib/config';
import { QUESTION_MAP, dailyChallengeIds, minigameQuestions, quickDrive, smartPractice, testQuestionIds, weeklyChallengeIds } from '@/lib/questions';
import { dayId, weekId } from '@/lib/time';
import { finalTestUnlocked, licenceEligible, licenceNumber, accuracy } from '@/lib/progression';
import { processRewards, snapshot } from '@/lib/rewards';
import type { GameMode } from '@/lib/types';

export function RunRoute() {
  return (
    <RequireProfile>
      <RunInner />
    </RequireProfile>
  );
}

function RunInner() {
  const params = useParams<{ mode: string }>();
  const search = useSearchParams();
  const mode = (params?.mode ?? 'quick') as GameMode;
  const gameId = search?.get('game') ?? '';
  const hydrated = useGame((s) => s.hydrated);

  const cfg: RunConfig | null = useMemo(() => {
    if (!hydrated) return null;
    const qstats = getState().progress.qstats;
    switch (mode) {
      case 'quick':
        return { mode, title: 'Quick Drive', subtitle: 'Random scenarios', questions: quickDrive(qstats), exitHref: '/play', intro: <p>8 mixed road-rule scenarios. Wrong calls show you what happens on the road — then teach you the rule.</p> };
      case 'practice': {
        const sp = smartPractice(qstats);
        return {
          mode,
          title: 'Smart Practice',
          subtitle: 'Focus on your weak spots',
          questions: sp.questions,
          exitHref: '/play',
          intro: (
            <div>
              <p className="mb-3">We&apos;ve selected these challenges because they will help improve your weakest road-rule areas.</p>
              <div className="flex flex-wrap gap-2">
                {sp.focus.map((c) => (
                  <span key={c} className="rounded-full px-3 py-1 text-xs font-extrabold uppercase" style={{ background: `${CATEGORY_MAP[c]?.color}22`, color: CATEGORY_MAP[c]?.color }}>{CATEGORY_MAP[c]?.name}</span>
                ))}
              </div>
            </div>
          ),
        };
      }
      case 'daily': {
        const day = dayId();
        const played = getState().progress.daily[day];
        return {
          mode, title: 'Daily Challenge', subtitle: played ? 'Practice replay' : 'Ranked attempt', questions: dailyChallengeIds(day).map((id) => QUESTION_MAP[id]), timerSec: GAME.daily.timePerQuestionSec, meta: { dayKey: day }, exitHref: '/challenges', exitLabel: 'See leaderboard',
          intro: (
            <ul className="space-y-1.5 list-disc pl-5">
              <li>Everyone in NSW gets the same {GAME.daily.count} scenarios today.</li>
              <li>Score = accuracy + difficulty + speed. {GAME.daily.timePerQuestionSec}s per question.</li>
              <li>{played ? <b>You&apos;ve used today&apos;s ranked attempt — this replay is for practice only.</b> : <b>Your FIRST attempt today is the ranked one. Make it count!</b>}</li>
            </ul>
          ),
        };
      }
      case 'weekly': {
        const wk = weekId();
        const played = getState().progress.weekly[wk];
        return {
          mode, title: 'Weekly Event', subtitle: played ? 'Practice replay' : 'Ranked attempt', questions: weeklyChallengeIds(wk).map((id) => QUESTION_MAP[id]), timerSec: GAME.weekly.timePerQuestionSec, meta: { weekKey: wk }, exitHref: '/challenges', exitLabel: 'See leaderboard',
          intro: (
            <ul className="space-y-1.5 list-disc pl-5">
              <li>{GAME.weekly.count} harder scenarios across every category.</li>
              <li>Rewards: {GAME.xp.weeklyChallenge} XP, {GAME.coins.weeklyChallenge} coins, competition points and the Weekly Warrior achievement.</li>
              <li>{played ? <b>Already completed this week — replay for practice.</b> : <b>One ranked attempt per week.</b>}</li>
            </ul>
          ),
        };
      }
      case 'test':
        return {
          mode, title: 'Practice Test', subtitle: 'Test mode', questions: testQuestionIds().map((id) => QUESTION_MAP[id]), reveal: false, exitHref: '/play',
          intro: <TestIntro />,
        };
      case 'final': {
        if (!finalTestUnlocked(getState())) return null;
        return {
          mode, title: 'Ultimate NSW Learner Test', subtitle: 'The big one', questions: testQuestionIds().map((id) => QUESTION_MAP[id]), reveal: false, exitHref: '/licence', exitLabel: 'Continue',
          intro: <TestIntro final />,
          onFinished: (r) => {
            if (!r.passed) return;
            const before = snapshot();
            const s = getState();
            if (licenceEligible(s) && !s.progress.licence && s.profile) {
              setLicence({ number: licenceNumber(s.profile.id), awardedAt: Date.now(), skill: Math.round(s.stats.skill), accuracy: accuracy(s) });
              pushToast({ kind: 'unlock', title: 'VIRTUAL LEARNER LICENCE EARNED!', body: 'Open your licence card to download and share it.', icon: 'IdCard' });
              processRewards(before);
            }
          },
          resultsExtra: (r) => (r.passed ? <div className="mt-6 text-center"><GameLink tone="leaf" size="lg" href="/licence">View my Virtual Licence</GameLink></div> : null),
        };
      }
      case 'minigame': {
        const g = MINIGAME_MAP[gameId];
        if (!g) return null;
        return { mode, title: g.name, subtitle: 'Mini-game', questions: minigameQuestions(g, qstats), mechanic: g.mechanic, timerSec: g.timerSec, meta: { minigameId: g.id }, exitHref: '/challenges', intro: <p>{g.tagline}</p> };
      }
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, mode, gameId]);

  if (!hydrated) return <Spinner />;
  if (!cfg)
    return (
      <div className="max-w-lg mx-auto p-6 pt-16">
        <EmptyState
          title={mode === 'final' ? 'Test locked' : 'Mode not found'}
          body={mode === 'final' ? 'Reach the Test Ready licence rank to unlock the Ultimate NSW Learner Test. Practice tests are always open.' : 'That challenge does not exist.'}
          action={<Link className="text-sun-400 font-bold underline" href="/play">Back to Play</Link>}
        />
      </div>
    );
  return <RunScreen {...cfg} />;
}

function TestIntro({ final }: { final?: boolean }) {
  return (
    <div className="space-y-2">
      <p className="font-bold text-sun-300">{GAME.branding.testDisclaimer}</p>
      <ul className="space-y-1.5 list-disc pl-5">
        {GAME.test.sections.map((s) => (
          <li key={s.id}>{s.label}: {s.count} questions — pass mark {s.passMark}/{s.count}</li>
        ))}
        <li>No hints, no XP pop-ups and no second chances. Results at the end.</li>
        {final && <li>Pass (with the required category mastery) to earn your <b>RoadQuest Virtual Learner Licence</b>.</li>}
      </ul>
    </div>
  );
}
