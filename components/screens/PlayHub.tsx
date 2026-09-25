'use client';
import Link from 'next/link';
import { Route, Shuffle, Brain, Gamepad2, CalendarCheck, Swords, ClipboardList, Crown, Lock, Car } from 'lucide-react';
import { useGame } from '@/lib/store';
import { finalTestUnlocked, nextLevel } from '@/lib/progression';
import { dayId, weekId } from '@/lib/time';
import { GAME } from '@/lib/config';

export function PlayHub() {
  const s = useGame((x) => x);
  const next = nextLevel(s);
  const finalOpen = finalTestUnlocked(s);
  const modes = [
    { href: `/drive?level=${next.id}`, icon: Route, title: 'Journey', sub: `Continue: ${next.name}`, color: 'from-sun-400 to-flame-500', big: true },
    { href: '/drive', icon: Car, title: 'Free Drive', sub: 'Any unlocked area', color: 'from-flame-400 to-berry-500' },
    { href: '/run/quick', icon: Shuffle, title: 'Quick Drive', sub: '8 random scenarios', color: 'from-aqua-400 to-aqua-600' },
    { href: '/run/practice', icon: Brain, title: 'Smart Practice', sub: 'Targets your weak spots', color: 'from-grape-400 to-grape-600' },
    { href: '/challenges#minigames', icon: Gamepad2, title: 'Mini Games', sub: '15 arcade challenges', color: 'from-berry-400 to-berry-600' },
    { href: '/run/daily', icon: CalendarCheck, title: 'Daily Challenge', sub: s.progress.daily[dayId()] ? '✓ Done — replay for practice' : 'Compete today', color: 'from-leaf-400 to-leaf-600' },
    { href: '/run/weekly', icon: Swords, title: 'Weekly Event', sub: s.progress.weekly[weekId()] ? '✓ Done this week' : `${GAME.weekly.count} hard scenarios`, color: 'from-sky-400 to-blue-600' },
    { href: '/run/test', icon: ClipboardList, title: 'Test Mode', sub: 'Practice assessment', color: 'from-slate-300 to-slate-500' },
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="text-xs font-extrabold tracking-[.25em] text-aqua-400">CHOOSE A MODE</div>
      <h1 className="font-display text-4xl md:text-5xl mb-6">Play</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {modes.map((m) => (
          <Link key={m.title} href={m.href} className={`group card-game p-4 md:p-5 flex flex-col gap-3 hover:-translate-y-1 hover:border-white/30 transition focus-ring ${m.big ? 'col-span-2 lg:col-span-2 lg:row-span-2 justify-end min-h-44' : ''}`}>
            <span className={`grid place-items-center ${m.big ? 'w-16 h-16' : 'w-12 h-12'} rounded-2xl bg-gradient-to-br ${m.color} text-night-950 shadow-lg group-hover:scale-110 transition`}>
              <m.icon className={m.big ? 'w-8 h-8' : 'w-6 h-6'} strokeWidth={2.5} />
            </span>
            <span>
              <span className={`block font-display leading-tight ${m.big ? 'text-4xl' : 'text-xl'}`}>{m.title}</span>
              <span className="block text-xs md:text-sm text-night-300 font-bold">{m.sub}</span>
            </span>
          </Link>
        ))}
      </div>
      <Link href={finalOpen ? '/run/final' : '/map'} className={`mt-6 block rounded-[1.75rem] p-6 border-2 transition focus-ring ${finalOpen ? 'bg-gradient-to-r from-sun-500/25 to-flame-500/20 border-sun-400 hover:brightness-110' : 'bg-white/5 border-white/10'}`}>
        <div className="flex items-center gap-4">
          <span className={`grid place-items-center w-16 h-16 rounded-2xl ${finalOpen ? 'bg-sun-400 text-night-950' : 'bg-white/5 text-night-400'}`}>{finalOpen ? <Crown className="w-8 h-8" /> : <Lock className="w-8 h-8" />}</span>
          <div>
            <div className="font-display text-2xl md:text-3xl">The Ultimate NSW Learner Test</div>
            <div className="text-sm text-night-300 font-bold">{finalOpen ? 'Unlocked! Pass it to earn your Virtual Learner Licence.' : 'Reach the TEST READY licence rank to unlock.'}</div>
            <div className="text-[11px] text-night-400 mt-1">{GAME.branding.testDisclaimer}</div>
          </div>
        </div>
      </Link>
    </div>
  );
}
