'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Coins, Gamepad2, House, Map as MapIcon, Trophy, User, Volume2, VolumeX, Warehouse, Swords, Car } from 'lucide-react';
import { hydrate, updateSettings, useGame } from '@/lib/store';
import { loadMe, refreshRanks } from '@/lib/api';
import { IS_DEMO } from '@/lib/env';
import { levelFromXp } from '@/lib/scoring';
import { GAME } from '@/lib/config';
import { LogoMark, Wordmark } from './Logo';
import { Toaster } from './Toaster';

const FULLSCREEN = ['/start', '/run', '/drive'];

const DESKTOP_NAV = [
  { href: '/', label: 'Home', icon: House },
  { href: '/map', label: 'Map', icon: MapIcon },
  { href: '/drive', label: 'Drive', icon: Car },
  { href: '/challenges', label: 'Challenges', icon: Swords },
  { href: '/garage', label: 'Garage', icon: Warehouse },
  { href: '/leaderboards', label: 'Leaderboards', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const hydrated = useGame((s) => s.hydrated);
  const reduced = useGame((s) => s.settings.reducedMotion);
  const hasProfile = useGame((s) => !!s.profile);

  useEffect(() => {
    hydrate();
    void loadMe().then(() => refreshRanks());
  }, []);

  const full = FULLSCREEN.some((p) => pathname.startsWith(p));
  return (
    <div className={reduced ? 'reduce-motion' : undefined}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] bg-sun-500 text-night-950 px-3 py-2 rounded-lg font-bold">
        Skip to content
      </a>
      {!full && <TopBar pathname={pathname} showStats={hydrated && hasProfile} />}
      <main id="main" className={full ? '' : 'pb-28 md:pb-12'}>
        {children}
      </main>
      {!full && <Footer />}
      {!full && <BottomNav pathname={pathname} />}
      <Toaster />
    </div>
  );
}

function TopBar({ pathname, showStats }: { pathname: string; showStats: boolean }) {
  const xp = useGame((s) => s.stats.xp);
  const coins = useGame((s) => s.stats.coins);
  const sound = useGame((s) => s.settings.sound);
  const lvl = levelFromXp(xp);
  return (
    <header className="sticky top-0 z-40 bg-night-950/80 backdrop-blur-md border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 focus-ring rounded-lg" aria-label="RoadQuest NSW home">
          <LogoMark />
          <Wordmark className="text-lg sm:text-xl" />
        </Link>
        <nav className="hidden lg:flex items-center gap-1 ml-4" aria-label="Main">
          {DESKTOP_NAV.map((n) => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`px-3 py-2 rounded-xl font-display text-sm uppercase tracking-wide transition focus-ring ${active ? 'bg-white/10 text-sun-400' : 'text-night-300 hover:text-white hover:bg-white/5'}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {IS_DEMO && <DemoBadge />}
          {showStats && (
            <>
              <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 pl-1.5 pr-3 py-1" title="Coins">
                <Coins className="w-5 h-5 text-sun-400" aria-hidden="true" />
                <span className="font-display text-sm" aria-label={`${coins} coins`}>{coins.toLocaleString()}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/5 border border-white/10 pl-1 pr-3 py-1" title="Level">
                <span className="grid place-items-center w-7 h-7 rounded-full bg-gradient-to-b from-grape-400 to-grape-600 font-display text-xs">{lvl.level}</span>
                <div className="w-16 h-2 rounded-full bg-night-950 overflow-hidden" aria-hidden="true">
                  <div className="h-full bg-gradient-to-r from-aqua-400 to-grape-500" style={{ width: `${lvl.progress * 100}%` }} />
                </div>
              </div>
            </>
          )}
          <button onClick={() => updateSettings({ sound: !sound })} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 focus-ring" aria-label={sound ? 'Mute sound' : 'Turn sound on'}>
            {sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-night-300" />}
          </button>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  const items = [
    { href: '/', label: 'Home', icon: House },
    { href: '/map', label: 'Map', icon: MapIcon },
    { href: '/play', label: 'Play', icon: Gamepad2, center: true },
    { href: '/leaderboards', label: 'Rank', icon: Trophy },
    { href: '/profile', label: 'Profile', icon: User },
  ];
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-night-950/90 backdrop-blur-md border-t border-white/10 safe-bottom" aria-label="Main">
      <div className="mx-auto max-w-lg grid grid-cols-5 items-end px-2 pt-2">
        {items.map((it) => {
          const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href);
          const I = it.icon;
          if (it.center)
            return (
              <Link key={it.href} href={it.href} className="flex flex-col items-center -mt-7 focus-ring rounded-2xl" aria-label="Play">
                <span className="grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-b from-sun-400 to-flame-500 text-night-950 shadow-[0_5px_0_#9a3412,0_10px_24px_rgba(255,122,26,.45)] border-2 border-night-950">
                  <I className="w-8 h-8" strokeWidth={2.6} />
                </span>
                <span className="font-display text-xs mt-1 text-sun-400">PLAY</span>
              </Link>
            );
          return (
            <Link key={it.href} href={it.href} className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl focus-ring ${active ? 'text-sun-400' : 'text-night-300'}`}>
              <I className="w-6 h-6" />
              <span className="font-display text-[11px] tracking-wide uppercase">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-4 pb-32 lg:pb-10 pt-6 text-xs text-night-400">
      <div className="border-t border-white/5 pt-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <p className="max-w-3xl leading-relaxed">{GAME.branding.disclaimer}</p>
        <div className="flex gap-4 font-bold">
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

function DemoBadge() {
  return (
    <span className="shrink-0 rounded-full bg-grape-600/90 border border-grape-400 px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-white" title="Supabase is not configured — progress is saved on this device only and leaderboards show sample data.">
      <span className="sm:hidden">DEMO</span>
      <span className="hidden sm:inline">DEMO MODE</span>
    </span>
  );
}
