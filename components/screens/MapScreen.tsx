'use client';
import { useState } from 'react';
import { Lock, Star, Check, Car } from 'lucide-react';
import { LEVELS, RANKS, CATEGORY_MAP } from '@/lib/config';
import { useGame } from '@/lib/store';
import { currentRank, isLevelUnlocked, masteryOf, meetsRank } from '@/lib/progression';
import { poolQuestions } from '@/lib/questions';
import { Modal, SectionTitle } from '@/components/ui/bits';
import { GameLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import type { MapLevel } from '@/lib/types';

const NSW = '60,40 470,40 520,22 578,42 566,120 556,200 532,280 516,360 496,440 480,520 468,600 400,562 330,534 262,522 200,502 150,484 100,472 60,462';

export function MapScreen() {
  const s = useGame((x) => x);
  const [open, setOpen] = useState<MapLevel | null>(null);
  const mastery = masteryOf(s);
  const rank = currentRank(s, mastery);
  const current = LEVELS.find((l) => !s.progress.map[l.id]);
  const path = LEVELS.map((l, i) => `${i ? 'L' : 'M'}${l.map.x},${l.map.y}`).join(' ');

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <div className="text-xs font-extrabold tracking-[.25em] text-aqua-400">NSW JOURNEY</div>
          <h1 className="font-display text-4xl md:text-5xl">The Map</h1>
        </div>
        <div className="font-display text-xl">{Object.keys(s.progress.map).length}/{LEVELS.length} <span className="text-night-300 text-sm">locations cleared</span></div>
      </div>
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
        <div className="card-game p-2 md:p-4 overflow-hidden">
          <svg viewBox="0 0 640 620" className="w-full h-auto" role="group" aria-label="Map of NSW journey locations">
            <defs>
              <linearGradient id="sea" x1="0" x2="1">
                <stop offset="0" stopColor="#0c4a6e" />
                <stop offset="1" stopColor="#0369a1" />
              </linearGradient>
              <linearGradient id="land" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#a16207" />
                <stop offset=".45" stopColor="#65a30d" />
                <stop offset="1" stopColor="#15803d" />
              </linearGradient>
            </defs>
            <rect width="640" height="620" fill="#0b1a33" rx="18" />
            <rect x="470" width="170" height="620" fill="url(#sea)" opacity=".7" />
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d={`M${560 + (i % 3) * 22} ${40 + i * 48} q8 -6 16 0 t16 0`} stroke="#7dd3fc" strokeWidth="2" fill="none" opacity=".35" />
            ))}
            <text x="600" y="330" textAnchor="middle" fill="#7dd3fc" opacity=".6" fontSize="12" fontWeight="700" transform="rotate(90 600 330)" letterSpacing="6">PACIFIC OCEAN</text>
            <polygon points={NSW} fill="url(#land)" stroke="#fde68a" strokeWidth="3" strokeLinejoin="round" />
            <polygon points={NSW} fill="none" stroke="#0b1a33" strokeWidth="1" opacity=".4" transform="translate(4 5)" />
            {/* scenery */}
            {[[120, 120], [150, 300], [260, 180], [340, 420], [200, 400], [400, 120], [100, 380]].map(([x, y], i) => (
              <g key={i} opacity=".55">
                <circle cx={x} cy={y} r="10" fill="#14532d" />
                <circle cx={x + 12} cy={y + 4} r="8" fill="#166534" />
              </g>
            ))}
            <path d="M380 250 l18 -26 l14 18 l12 -14 l20 26 Z" fill="#475569" opacity=".6" />
            <text x="412" y="268" textAnchor="middle" fill="#e2e8f0" opacity=".6" fontSize="9" fontWeight="700">BLUE MOUNTAINS</text>
            <text x="120" y="80" fill="#fef3c7" opacity=".5" fontSize="10" fontWeight="700">OUTBACK</text>
            {/* route */}
            <path d={path} stroke="#0b1a33" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".6" />
            <path d={path} stroke="#374151" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={path} stroke="#fde68a" strokeWidth="2" fill="none" strokeDasharray="8 8" strokeLinecap="round" />
            {LEVELS.map((l) => {
              const done = s.progress.map[l.id];
              const unlocked = isLevelUnlocked(s, l.id);
              const isCurrent = current?.id === l.id;
              return (
                <g key={l.id} transform={`translate(${l.map.x} ${l.map.y})`} onClick={() => setOpen(l)} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={`${l.num}. ${l.name}${done ? `, cleared with ${done.stars} stars` : unlocked ? ', unlocked' : ', locked'}`} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(l)}>
                  {isCurrent && <circle r="34" fill="#ffd84d" opacity=".25" className="animate-pulse-ring" />}
                  <circle r="25" fill={done ? '#22c55e' : unlocked ? '#ffc93c' : '#334155'} stroke="#0b1a33" strokeWidth="4" />
                  <circle r="25" fill="none" stroke="#fff" strokeWidth="2" opacity=".35" />
                  <text y="7" textAnchor="middle" fontSize="20" fontWeight="900" fill={unlocked ? '#0b1a33' : '#94a3b8'} fontFamily="var(--font-display), Arial">{unlocked ? l.num : '🔒'}</text>
                  {done && (
                    <g transform="translate(0 38)">
                      {[0, 1, 2].map((i) => (
                        <text key={i} x={(i - 1) * 14} y="0" textAnchor="middle" fontSize="14" fill={i < done.stars ? '#ffd84d' : '#475569'}>★</text>
                      ))}
                    </g>
                  )}
                  <g transform={`translate(0 ${done ? 56 : 42})`}>
                    <rect x={-l.name.length * 3.4 - 6} y="-11" width={l.name.length * 6.8 + 12} height="17" rx="8" fill="#0b1a33" opacity=".85" />
                    <text textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" y="1.5">{l.name}</text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-4">
          <div className="card-game p-5">
            <SectionTitle kicker="Licence journey">Your rank: {rank.rank.name}</SectionTitle>
            <ol className="space-y-2">
              {RANKS.map((r, i) => {
                const got = i <= rank.index;
                const nextUp = i === rank.index + 1;
                return (
                  <li key={r.id} className={`flex items-center gap-3 rounded-2xl px-3 py-2 border ${got ? 'bg-leaf-600/15 border-leaf-500/40' : nextUp ? 'bg-sun-500/10 border-sun-400/50' : 'border-white/5 opacity-60'}`}>
                    <span className={`grid place-items-center w-9 h-9 rounded-xl ${got ? 'bg-leaf-500 text-night-950' : 'bg-white/5'}`}>{got ? <Check className="w-5 h-5" strokeWidth={3} /> : <Icon name={r.icon} className="w-5 h-5" />}</span>
                    <div className="min-w-0">
                      <div className="font-display leading-tight">{i + 1}. {r.name}</div>
                      {(nextUp || !got) && <div className="text-xs text-night-300">{r.description}</div>}
                    </div>
                    {nextUp && <span className="ml-auto text-[10px] font-extrabold text-sun-400 shrink-0">{meetsRank(r, s, mastery) ? 'READY' : 'NEXT'}</span>}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${open.num}. ${open.name}` : ''}>
        {open && <LevelDetail l={open} />}
      </Modal>
    </div>
  );
}

function LevelDetail({ l }: { l: MapLevel }) {
  const s = useGame((x) => x);
  const unlocked = isLevelUnlocked(s, l.id);
  const done = s.progress.map[l.id];
  const cats = Array.from(new Set(poolQuestions(l.pool).map((q) => q.category))).slice(0, 6);
  return (
    <div>
      <p className="text-night-200 mb-4">{l.blurb}</p>
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="rounded-xl bg-white/5 p-2"><div className="font-display text-xl">{l.theme.speedLimit}</div><div className="text-[10px] font-bold text-night-300">KM/H ZONE</div></div>
        <div className="rounded-xl bg-white/5 p-2"><div className="font-display text-xl">{l.questions}</div><div className="text-[10px] font-bold text-night-300">DECISIONS</div></div>
        <div className="rounded-xl bg-white/5 p-2"><div className="font-display text-xl capitalize">{l.theme.env === 'wet' ? 'Rain' : l.theme.env}</div><div className="text-[10px] font-bold text-night-300">CONDITIONS</div></div>
      </div>
      <div className="text-xs font-extrabold uppercase tracking-widest text-night-300 mb-2">Road rules in this area</div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {cats.map((c) => <span key={c} className="rounded-full px-2.5 py-1 text-xs font-extrabold" style={{ background: `${CATEGORY_MAP[c]?.color}22`, color: CATEGORY_MAP[c]?.color }}>{CATEGORY_MAP[c]?.short}</span>)}
      </div>
      {done && <div className="mb-4 flex items-center gap-1 text-sun-400">{[0, 1, 2].map((i) => <Star key={i} className={`w-6 h-6 ${i < done.stars ? 'fill-sun-400' : 'text-night-600'}`} />)} <span className="ml-2 text-sm font-bold text-night-300">Best {done.best}%</span></div>}
      {unlocked ? (
        <GameLink href={`/drive?level=${l.id}`} tone="sun" size="lg" full><Car className="w-5 h-5" /> {done ? 'Drive again' : 'Start drive'}</GameLink>
      ) : (
        <div className="rounded-2xl bg-white/5 p-4 flex items-center gap-3 text-night-300"><Lock className="w-5 h-5" /> Clear location {l.num - 1} to unlock.</div>
      )}
    </div>
  );
}
