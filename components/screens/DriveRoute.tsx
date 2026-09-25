'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { DriveGame } from '@/components/drive/DriveGame';
import { RequireProfile } from './RequireProfile';
import { Spinner } from '@/components/ui/bits';
import { Icon } from '@/components/ui/Icon';
import { LEVELS, LEVEL_MAP } from '@/lib/config';
import { getState, useGame } from '@/lib/store';
import { isLevelUnlocked } from '@/lib/progression';
import { levelQuestions, quickDrive } from '@/lib/questions';

export function DriveRoute() {
  return (
    <RequireProfile>
      <Inner />
    </RequireProfile>
  );
}

function Inner() {
  const search = useSearchParams();
  const levelId = search?.get('level') ?? '';
  const free = search?.get('free') ?? '';
  const hydrated = useGame((s) => s.hydrated);
  const state = getState();
  const [picked, setPicked] = useState<string | null>(null);

  const setup = useMemo(() => {
    if (!hydrated) return null;
    const s = getState();
    if (levelId && LEVEL_MAP[levelId]) {
      const lvl = LEVEL_MAP[levelId];
      if (!isLevelUnlocked(s, levelId)) return { locked: true as const };
      return { mode: 'journey' as const, level: lvl, questions: levelQuestions(lvl, s.progress.qstats), exit: '/map' };
    }
    const fid = picked ?? free;
    if (fid && LEVEL_MAP[fid]) {
      const lvl = LEVEL_MAP[fid];
      return { mode: 'drive' as const, level: { ...lvl, name: `Free Drive: ${lvl.name}`, num: undefined, events: lvl.events.filter((e) => e !== 'checkpoint') }, questions: quickDrive(s.progress.qstats, 4), exit: '/drive' };
    }
    return null;
  }, [hydrated, levelId, free, picked]);

  if (!hydrated) return <Spinner />;
  if (setup && 'locked' in setup)
    return (
      <div className="max-w-md mx-auto p-6 pt-16 text-center">
        <Lock className="w-12 h-12 mx-auto text-night-400 mb-3" />
        <h1 className="font-display text-3xl mb-2">Location locked</h1>
        <p className="text-night-300 mb-4">Clear the previous location on the map to unlock this one.</p>
        <Link href="/map" className="text-sun-400 font-bold underline">Back to the map</Link>
      </div>
    );
  if (setup) return <DriveGame key={setup.level.id + setup.mode} level={setup.level} questions={setup.questions} mode={setup.mode} exitHref={setup.exit} />;

  // Free-drive picker
  return (
    <div className="min-h-dvh">
      <div className="mx-auto max-w-5xl px-4 py-6 pb-32">
        <Link href="/" className="inline-flex items-center gap-1 text-night-300 font-bold mb-4 hover:text-white"><ArrowLeft className="w-4 h-4" /> Home</Link>
        <h1 className="font-display text-4xl md:text-5xl mb-1">Free Drive</h1>
        <p className="text-night-300 mb-6">Pick any unlocked environment and practise speed limits, lights, crossings and lane changes. A few random decision points keep you sharp.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map((l) => {
            const open = isLevelUnlocked(state, l.id);
            return (
              <button key={l.id} disabled={!open} onClick={() => setPicked(l.id)} className="card-game p-5 text-left hover:border-sun-400/60 transition disabled:opacity-40 focus-ring">
                <div className="flex items-center gap-3 mb-2">
                  <span className="grid place-items-center w-12 h-12 rounded-2xl bg-white/5 text-sun-400">{open ? <Icon name={l.icon} className="w-6 h-6" /> : <Lock className="w-6 h-6" />}</span>
                  <div>
                    <div className="text-[11px] font-extrabold text-aqua-400 uppercase tracking-widest">{l.theme.env === 'night' ? 'Night' : l.theme.env === 'wet' ? 'Rain' : 'Day'} · {l.theme.speedLimit} km/h</div>
                    <div className="font-display text-xl">{l.name}</div>
                  </div>
                </div>
                <p className="text-sm text-night-300">{l.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
