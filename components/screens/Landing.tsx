'use client';
import { useEffect, useState } from 'react';
import { Car, GraduationCap, TrendingUp, Trophy, BadgeCheck, Users, MessageSquare, MapPin, CalendarCheck } from 'lucide-react';
import { GameLink } from '@/components/ui/Button';
import { Wordmark } from '@/components/layout/Logo';
import { Scene } from '@/components/art/Scene';
import { SignArt } from '@/components/art/Sign';
import { CarProfile } from '@/components/art/CarProfile';
import { fetchSiteStats } from '@/lib/api';
import { CARS } from '@/lib/config';
import { QUESTION_MAP, QUESTIONS } from '@/lib/questions';
import { defaultCustom } from '@/lib/store';

export function Landing() {
  const [stats, setStats] = useState<{ players: number; answered: number; topSuburb: string; dailyPlayers: number } | null>(null);
  useEffect(() => {
    void fetchSiteStats().then(setStats);
  }, []);
  const demoScene = QUESTION_MAP['in045']?.visual;
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 opacity-60" aria-hidden="true">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-40 md:w-64 road-bg animate-road opacity-30" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pt-10 md:pt-20 pb-12 grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-center lg:text-left animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-extrabold tracking-widest text-aqua-300 mb-5">
              <span className="w-2 h-2 rounded-full bg-leaf-400 animate-pulse" /> FOR NSW LEARNER DRIVERS
            </div>
            <h1 className="sr-only">RoadQuest NSW</h1>
            <Wordmark className="text-5xl sm:text-6xl xl:text-7xl block" />
            <p className="font-display text-2xl md:text-4xl mt-5 leading-tight">
              LEARN THE ROAD.<br />BEAT THE TEST.<br />
              <span className="bg-gradient-to-r from-sun-400 to-flame-500 bg-clip-text text-transparent">RULE YOUR SUBURB.</span>
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <GameLink href="/start" tone="sun" size="xl">Start your journey</GameLink>
              <GameLink href="/leaderboards" tone="dark" size="xl">Leaderboards</GameLink>
            </div>
            <p className="mt-4 text-xs text-night-400">Free. No password. {QUESTIONS.length}+ road-rule scenarios.</p>
          </div>
          <div className="relative animate-pop">
            <div className="absolute -inset-6 bg-gradient-to-tr from-grape-600/30 via-aqua-500/20 to-sun-500/20 blur-3xl rounded-full" aria-hidden="true" />
            <div className="relative card-game p-3 rotate-1">
              {demoScene && <Scene spec={demoScene} className="w-full h-auto rounded-2xl" teach />}
              <div className="flex items-center justify-between px-2 pt-3">
                <div>
                  <div className="text-[10px] font-extrabold tracking-widest text-aqua-400">WHO GOES FIRST?</div>
                  <div className="font-display text-lg">Both at STOP signs…</div>
                </div>
                <span className="rounded-xl bg-leaf-500 text-night-950 font-display px-3 py-1.5">CAR B ✓</span>
              </div>
            </div>
            <div className="absolute -left-4 -bottom-8 w-24 md:w-28 rotate-[-8deg] drop-shadow-2xl animate-float" aria-hidden="true">
              <SignArt id="give-way" className="w-full h-auto" />
            </div>
            <div className="absolute -right-2 -top-8 w-20 md:w-24 rotate-[10deg] drop-shadow-2xl animate-float" style={{ animationDelay: '.6s' }} aria-hidden="true">
              <SignArt id="school-zone-40" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* LIVE STATS */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <LiveStat icon={<Users className="w-5 h-5" />} label="Players" value={stats ? stats.players.toLocaleString() : '—'} />
          <LiveStat icon={<MessageSquare className="w-5 h-5" />} label="Questions answered" value={stats ? stats.answered.toLocaleString() : '—'} />
          <LiveStat icon={<MapPin className="w-5 h-5" />} label="Top suburb" value={stats?.topSuburb ?? '—'} />
          <LiveStat icon={<CalendarCheck className="w-5 h-5" />} label="Today's challenge" value={stats ? `${stats.dailyPlayers} played` : '—'} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: Car, t: 'DRIVE', b: 'Steer through NSW streets, school zones, motorways and the CBD.', c: 'from-sun-400 to-flame-500' },
            { icon: GraduationCap, t: 'LEARN', b: 'Wrong call? See what happens — then learn the rule.', c: 'from-aqua-400 to-aqua-600' },
            { icon: TrendingUp, t: 'LEVEL UP', b: 'Earn XP, coins, licence ranks and new cars.', c: 'from-grape-400 to-grape-600' },
            { icon: Trophy, t: 'COMPETE', b: 'Daily & weekly events. Carry your suburb to #1.', c: 'from-berry-400 to-berry-600' },
            { icon: BadgeCheck, t: 'PASS', b: 'Beat the Ultimate NSW Learner Test. Earn your virtual licence.', c: 'from-leaf-400 to-leaf-600' },
          ].map((s, i) => (
            <div key={s.t} className={`card-game p-5 ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
              <div className={`w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br ${s.c} text-night-950 mb-3 shadow-lg`}>
                <s.icon className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div className="font-display text-2xl">{s.t}</div>
              <p className="text-sm text-night-300 mt-1">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GAME CARDS */}
      <section className="mx-auto max-w-7xl px-4 pb-16 grid md:grid-cols-3 gap-4">
        <div className="card-game p-5 overflow-hidden">
          <div className="text-xs font-extrabold tracking-widest text-sun-400">SUBURB VS SUBURB</div>
          <div className="font-display text-2xl mb-3">NSW Suburb Championship</div>
          {['Your suburb', 'The next suburb over', 'That suburb across the bridge'].map((s, i) => (
            <div key={s} className="flex items-center gap-3 py-2 border-t border-white/5">
              <span className={`font-display text-xl w-8 ${i === 0 ? 'text-sun-400' : 'text-night-300'}`}>#{i + 1}</span>
              <span className="font-bold">{s}</span>
              <span className="ml-auto font-display text-aqua-400">{[2840, 2611, 2390][i]}</span>
            </div>
          ))}
        </div>
        <div className="card-game p-5 overflow-hidden">
          <div className="text-xs font-extrabold tracking-widest text-grape-400">GARAGE</div>
          <div className="font-display text-2xl mb-2">Unlock &amp; customise</div>
          <CarProfile car={CARS.find((c) => c.id === 'gt')!} custom={{ ...defaultCustom('gt'), wheels: 'turbine', decal: 'stripes', roof: 'none', plateText: 'RQNSW' }} className="w-full h-auto" />
          <p className="text-sm text-night-300">{CARS.length} cars, paints, wheels, decals and plates. Cosmetic only — skill wins.</p>
        </div>
        <div className="card-game p-5 overflow-hidden">
          <div className="text-xs font-extrabold tracking-widest text-leaf-400">SPOT THE HAZARD · SIGN SNAP · 13 MORE</div>
          <div className="font-display text-2xl mb-3">15 mini-games</div>
          <div className="grid grid-cols-3 gap-2">
            {['kangaroo-30km', 'roundabout-giveway', 'railway-lights'].map((s) => (
              <div key={s} className="rounded-xl bg-gradient-to-b from-sky-200 to-sky-100 p-2"><SignArt id={s} className="w-full h-20" /></div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-10 text-center">
        <GameLink href="/start" tone="sun" size="xl">Start your journey</GameLink>
      </section>
    </div>
  );
}

function LiveStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-game px-4 py-3">
      <div className="flex items-center gap-2 text-aqua-400">{icon}<span className="text-[11px] font-extrabold uppercase tracking-widest text-night-300">{label}</span></div>
      <div className="font-display text-2xl truncate mt-0.5">{value}</div>
    </div>
  );
}
