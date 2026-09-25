'use client';
import Link from 'next/link';
import { CalendarCheck, Coins, Flame, Globe, MapPin, Sparkles, Trophy, Warehouse, Map as MapIcon, ChevronRight, Swords, Brain } from 'lucide-react';
import { useGame } from '@/lib/store';
import { levelFromXp, levelTitle, skillTier } from '@/lib/scoring';
import { currentRank, masteryOf, nextLevel } from '@/lib/progression';
import { ACHIEVEMENT_MAP, CAR_MAP, RARITY_STYLE } from '@/lib/config';
import { dayId, msUntilDayEnd, msUntilWeekEnd, weekId } from '@/lib/time';
import { GameLink } from '@/components/ui/Button';
import { ProgressBar, SectionTitle, useCountdown } from '@/components/ui/bits';
import { Icon } from '@/components/ui/Icon';
import { CarProfile } from '@/components/art/CarProfile';
import { defaultCustom } from '@/lib/store';

export function Dashboard() {
  const s = useGame((x) => x);
  const lvl = levelFromXp(s.stats.xp);
  const tier = skillTier(s.stats.skill);
  const mastery = masteryOf(s);
  const rank = currentRank(s, mastery);
  const next = nextLevel(s);
  const dailyDone = s.progress.daily[dayId()];
  const weeklyDone = s.progress.weekly[weekId()];
  const dayLeft = useCountdown(() => msUntilDayEnd());
  const weekLeft = useCountdown(() => msUntilWeekEnd());
  const car = CAR_MAP[s.progress.garage.current];
  const custom = s.progress.garage.custom[s.progress.garage.current] ?? defaultCustom(s.progress.garage.current);
  const latest = Object.entries(s.progress.achievements).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const allDone = Object.keys(s.progress.map).length >= 11;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10 space-y-6">
      {/* Welcome */}
      <section className="card-game p-5 md:p-7 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-grape-600/20 blur-3xl" aria-hidden="true" />
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center relative">
          <div>
            <div className="text-xs font-extrabold tracking-[.25em] text-aqua-400">WELCOME BACK,</div>
            <h1 className="font-display text-4xl md:text-5xl leading-tight break-all">{s.profile?.username}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
              <span className="inline-flex items-center gap-1 text-night-300 font-bold"><MapPin className="w-4 h-4" />{s.profile?.suburb}</span>
              <span className="rounded-full bg-sun-500/15 text-sun-300 px-2.5 py-0.5 font-extrabold text-xs uppercase inline-flex items-center gap-1"><Icon name={rank.rank.icon} className="w-3.5 h-3.5" />{rank.rank.name}</span>
            </div>
            <div className="mt-5">
              <div className="flex items-end justify-between mb-1.5">
                <div className="font-display text-xl">LEVEL {lvl.level} <span className="text-night-300 text-sm">· {levelTitle(lvl.level)}</span></div>
                <div className="text-xs font-bold text-night-300">{lvl.into} / {lvl.needed} XP</div>
              </div>
              <ProgressBar value={lvl.progress} height="h-4" color="from-aqua-400 via-grape-500 to-berry-500" label="XP to next level" />
            </div>
          </div>
          {car && (
            <Link href="/garage" className="hidden md:block w-72 focus-ring rounded-2xl" aria-label="Open garage">
              <CarProfile car={car} custom={custom} className="w-full h-auto drop-shadow-2xl animate-float" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mt-6 relative">
          <Mini icon={<Sparkles className="w-5 h-5" />} label="Skill rating" value={Math.round(s.stats.skill).toLocaleString()} sub={tier.name} color={tier.color} />
          <Mini icon={<Globe className="w-5 h-5" />} label="Global rank" value={s.ranks.global ? `#${s.ranks.global}` : '—'} color="#38bdf8" />
          <Mini icon={<MapPin className="w-5 h-5" />} label="Suburb rank" value={s.ranks.suburb ? `#${s.ranks.suburb}` : '—'} color="#2ee6d6" />
          <Mini icon={<Flame className="w-5 h-5" />} label="Current streak" value={String(s.stats.streak)} sub={`Best ${s.stats.bestStreak}`} color="#ff9a4d" />
          <Mini icon={<Coins className="w-5 h-5" />} label="Coins" value={s.stats.coins.toLocaleString()} color="#ffd84d" />
        </div>
      </section>

      {/* Continue */}
      <section className="grid md:grid-cols-[2fr_1fr] gap-4">
        <Link href={s.onboarded ? `/drive?level=${next.id}` : '/start'} className="group relative overflow-hidden rounded-[1.75rem] p-6 md:p-8 bg-gradient-to-br from-sun-400 via-flame-500 to-berry-500 text-night-950 shadow-[0_8px_0_#9a3412,0_20px_40px_rgba(255,122,26,.35)] active:translate-y-1 active:shadow-[0_3px_0_#9a3412] transition focus-ring">
          <div className="absolute right-0 top-0 bottom-0 w-40 road-bg animate-road opacity-25 rotate-12 translate-x-10" aria-hidden="true" />
          <div className="relative">
            <div className="text-xs font-extrabold tracking-[.25em] opacity-80">{s.onboarded ? (allDone ? 'REPLAY FOR 3 STARS' : `LOCATION ${next.num}`) : 'FIRST DRIVE'}</div>
            <div className="font-display text-4xl md:text-5xl leading-none mt-1">CONTINUE JOURNEY</div>
            <div className="font-bold mt-2 flex items-center gap-2"><Icon name={next.icon} className="w-5 h-5" /> {s.onboarded ? next.name : 'Learn the controls in 60 seconds'}</div>
          </div>
          <ChevronRight className="absolute right-5 bottom-5 w-10 h-10 group-hover:translate-x-1 transition" />
        </Link>
        <Link href="/run/daily" className="card-game p-5 flex flex-col justify-between hover:border-aqua-400/60 transition focus-ring">
          <div className="flex items-center gap-2 text-aqua-400 font-display text-lg"><CalendarCheck className="w-5 h-5" /> DAILY CHALLENGE</div>
          <div>
            <div className="font-display text-3xl">{dailyDone ? `${dailyDone.score} pts` : '10 scenarios'}</div>
            <div className="text-sm text-night-300 font-bold">{dailyDone ? `✓ Done today · ${dailyDone.correct}/${dailyDone.total} correct` : 'Same challenge for all of NSW'}</div>
          </div>
          <div className="text-xs text-night-400 font-bold mt-2">New challenge in {dayLeft}</div>
        </Link>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile href="/map" icon={<MapIcon className="w-7 h-7" />} title="My Map" sub={`${Object.keys(s.progress.map).length}/11 locations`} color="from-leaf-400 to-leaf-600" />
        <Tile href="/garage" icon={<Warehouse className="w-7 h-7" />} title="Garage" sub={`${s.progress.garage.owned.length} car${s.progress.garage.owned.length === 1 ? '' : 's'}`} color="from-grape-400 to-grape-600" />
        <Tile href="/leaderboards" icon={<Trophy className="w-7 h-7" />} title="Leaderboards" sub={`Week ends ${weekLeft}`} color="from-sun-400 to-sun-600" />
        <Tile href="/run/practice" icon={<Brain className="w-7 h-7" />} title="Smart Practice" sub="Fix weak spots" color="from-aqua-400 to-aqua-600" />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card-game p-5">
          <SectionTitle kicker="Weekly event" right={<Link href="/run/weekly" className="text-sun-400 font-bold text-sm">Play →</Link>}>
            <span className="inline-flex items-center gap-2"><Swords className="w-6 h-6 text-berry-400" /> Weekly Challenge</span>
          </SectionTitle>
          <p className="text-night-300 text-sm mb-3">30 hard scenarios · exclusive Weekly Warrior car · ends in <b className="text-white">{weekLeft}</b></p>
          <div className="font-display text-2xl">{weeklyDone ? `✓ ${weeklyDone.score} pts (${weeklyDone.correct}/${weeklyDone.total})` : 'Not played yet'}</div>
          <div className="mt-3 text-sm text-night-300">Your weekly points: <b className="text-aqua-400">{s.stats.weeklyPoints.toLocaleString()}</b></div>
        </div>
        <div className="card-game p-5">
          <SectionTitle kicker="Trophy cabinet" right={<Link href="/profile#achievements" className="text-sun-400 font-bold text-sm">All →</Link>}>Latest achievements</SectionTitle>
          {latest.length === 0 ? (
            <p className="text-night-300">Complete your first drive to unlock <b>FIRST DRIVE</b>.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {latest.map(([id]) => {
                const a = ACHIEVEMENT_MAP[id];
                if (!a) return null;
                const r = RARITY_STYLE[a.rarity];
                return (
                  <div key={id} className="rounded-2xl p-3 border" style={{ borderColor: `${r.color}66`, background: `${r.color}14` }}>
                    <Icon name={a.icon} className="w-6 h-6" />
                    <div className="font-display leading-tight mt-1">{a.name}</div>
                    <div className="text-[10px] font-extrabold tracking-widest" style={{ color: r.color }}>{r.label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      {!s.onboarded && (
        <div className="text-center">
          <GameLink href="/start" tone="sun" size="lg">Finish setup: first drive</GameLink>
        </div>
      )}
    </div>
  );
}

function Mini({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl bg-night-950/50 border border-white/5 px-3 py-2.5">
      <div className="flex items-center gap-1.5" style={{ color }}>{icon}<span className="text-[10px] font-extrabold uppercase tracking-widest text-night-300 truncate">{label}</span></div>
      <div className="font-display text-2xl leading-tight">{value}</div>
      {sub && <div className="text-[11px] font-bold" style={{ color }}>{sub}</div>}
    </div>
  );
}

function Tile({ href, icon, title, sub, color }: { href: string; icon: React.ReactNode; title: string; sub: string; color: string }) {
  return (
    <Link href={href} className="card-game p-4 flex items-center gap-3 hover:border-white/30 transition focus-ring">
      <span className={`grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br ${color} text-night-950 shrink-0`}>{icon}</span>
      <span className="min-w-0">
        <span className="block font-display text-lg sm:text-xl leading-tight truncate">{title}</span>
        <span className="block text-xs text-night-300 font-bold truncate">{sub}</span>
      </span>
    </Link>
  );
}
