'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarCheck, Swords, Timer } from 'lucide-react';
import { MINIGAMES, GAME } from '@/lib/config';
import { useGame } from '@/lib/store';
import { dayId, msUntilDayEnd, msUntilWeekEnd, weekId } from '@/lib/time';
import { fetchDailyTop } from '@/lib/api';
import { GameLink } from '@/components/ui/Button';
import { SectionTitle, useCountdown } from '@/components/ui/bits';
import { Icon } from '@/components/ui/Icon';
import { BoardRows } from './Leaderboards';
import type { LeaderboardRow } from '@/lib/types';

export function Challenges() {
  const s = useGame((x) => x);
  const daily = s.progress.daily[dayId()];
  const weekly = s.progress.weekly[weekId()];
  const dayLeft = useCountdown(() => msUntilDayEnd());
  const weekLeft = useCountdown(() => msUntilWeekEnd());
  const [top, setTop] = useState<LeaderboardRow[] | null>(null);
  useEffect(() => {
    void fetchDailyTop().then((r) => setTop(r.rows));
  }, [daily]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10 space-y-8">
      <div>
        <div className="text-xs font-extrabold tracking-[.25em] text-aqua-400">COMPETE &amp; PRACTISE</div>
        <h1 className="font-display text-4xl md:text-5xl">Challenges</h1>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card-game p-6 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-leaf-500/20 blur-2xl" aria-hidden="true" />
          <div className="flex items-center gap-2 text-leaf-400 font-display text-lg"><CalendarCheck className="w-6 h-6" /> DAILY CHALLENGE</div>
          <div className="font-display text-3xl mt-1">{GAME.daily.count} mixed scenarios</div>
          <p className="text-night-300 text-sm mt-1">Same for everyone in NSW today. One ranked attempt — scored on accuracy, difficulty and speed.</p>
          <div className="mt-3 flex items-center gap-2 text-sm font-bold"><Timer className="w-4 h-4 text-night-300" /> Resets in {dayLeft}</div>
          <div className="mt-5 flex items-center gap-3">
            <GameLink href="/run/daily" tone="leaf" size="lg">{daily ? 'Practice replay' : 'Play ranked'}</GameLink>
            {daily && <span className="font-display text-xl">Score: {daily.score}</span>}
          </div>
        </div>
        <div className="card-game p-6 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-berry-500/20 blur-2xl" aria-hidden="true" />
          <div className="flex items-center gap-2 text-berry-400 font-display text-lg"><Swords className="w-6 h-6" /> WEEKLY EVENT</div>
          <div className="font-display text-3xl mt-1">{GAME.weekly.count} hard scenarios</div>
          <p className="text-night-300 text-sm mt-1">Rewards: {GAME.xp.weeklyChallenge.toLocaleString()} XP · {GAME.coins.weeklyChallenge} coins · competition points · the Weekly Warrior car.</p>
          <div className="mt-3 flex items-center gap-2 text-sm font-bold"><Timer className="w-4 h-4 text-night-300" /> WEEK ENDS IN: {weekLeft}</div>
          <div className="mt-5 flex items-center gap-3">
            <GameLink href="/run/weekly" tone="berry" size="lg">{weekly ? 'Practice replay' : 'Enter event'}</GameLink>
            {weekly && <span className="font-display text-xl">Score: {weekly.score}</span>}
          </div>
        </div>
      </div>

      <section id="minigames">
        <SectionTitle kicker="Arcade">Mini Games</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {MINIGAMES.map((g) => {
            const perfect = s.progress.counters.minigamePerfect[g.id];
            return (
              <Link key={g.id} href={`/run/minigame?game=${g.id}`} className="group card-game p-4 flex flex-col gap-2 hover:-translate-y-1 transition focus-ring" style={{ borderColor: `${g.color}44` }}>
                <span className="grid place-items-center w-12 h-12 rounded-2xl text-night-950 group-hover:rotate-6 transition" style={{ background: g.color }}>
                  <Icon name={g.icon} className="w-6 h-6" />
                </span>
                <span className="font-display text-lg leading-tight">{g.name}</span>
                <span className="text-xs text-night-300 font-bold flex-1">{g.tagline}</span>
                {perfect ? <span className="text-[10px] font-extrabold tracking-widest text-sun-400">★ PERFECTED</span> : g.timerSec ? <span className="text-[10px] font-extrabold tracking-widest text-night-400">⏱ TIMED</span> : null}
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle kicker={dayId()}>Daily Top 100</SectionTitle>
        {top ? <BoardRows rows={top} scoreLabel="pts" /> : <div className="card-game p-6 text-night-300">Loading…</div>}
      </section>
    </div>
  );
}
