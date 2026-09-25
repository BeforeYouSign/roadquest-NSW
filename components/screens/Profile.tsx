'use client';
import Link from 'next/link';
import { useState } from 'react';
import { MapPin, Lock, Settings, Volume2, Eye, Trash2 } from 'lucide-react';
import { useGame, updateSettings, resetAll } from '@/lib/store';
import { levelFromXp, levelTitle, skillTier } from '@/lib/scoring';
import { accuracy, achievementProgress, currentRank, masteryOf } from '@/lib/progression';
import { ACHIEVEMENTS, CAR_MAP, MASTERY_CATEGORIES, RARITY_STYLE, GAME } from '@/lib/config';
import { dayId, weekId } from '@/lib/time';
import { ProgressBar, SectionTitle, Tabs, Modal } from '@/components/ui/bits';
import { Icon } from '@/components/ui/Icon';
import { GameButton, GameLink } from '@/components/ui/Button';
import { CarProfile } from '@/components/art/CarProfile';
import { defaultCustom } from '@/lib/store';
import { IS_DEMO } from '@/lib/env';

export function Profile() {
  const s = useGame((x) => x);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [confirmReset, setConfirmReset] = useState(false);
  const lvl = levelFromXp(s.stats.xp);
  const tier = skillTier(s.stats.skill);
  const mastery = masteryOf(s);
  const rank = currentRank(s, mastery);
  const mastered = MASTERY_CATEGORIES.filter((c) => (mastery[c.id] ?? 0) >= GAME.mastery.masteredThreshold).length;
  const car = CAR_MAP[s.progress.garage.current];
  const unlockedCount = Object.keys(s.progress.achievements).length;
  const achList = ACHIEVEMENTS.filter((a) => (filter === 'all' ? true : filter === 'unlocked' ? !!s.progress.achievements[a.id] : !s.progress.achievements[a.id]));

  const stats: [string, string][] = [
    ['Level', `${lvl.level} · ${levelTitle(lvl.level)}`],
    ['XP', s.stats.xp.toLocaleString()],
    ['Skill rating', `${Math.round(s.stats.skill).toLocaleString()} · ${tier.name}`],
    ['Weekly comp. points', s.stats.weeklyPoints.toLocaleString()],
    ['Lifetime points', s.stats.lifetimePoints.toLocaleString()],
    ['Questions answered', s.stats.answered.toLocaleString()],
    ['Accuracy', `${Math.round(accuracy(s) * 100)}%`],
    ['Current streak', String(s.stats.streak)],
    ['Best streak', String(s.stats.bestStreak)],
    ['Achievements', `${unlockedCount}/${ACHIEVEMENTS.length}`],
    ['Cars owned', String(s.progress.garage.owned.length)],
    ['Categories mastered', `${mastered}/${MASTERY_CATEGORIES.length}`],
    ['Licence rank', rank.rank.name],
    ['Daily challenge', s.progress.daily[dayId()] ? '✓ Done today' : 'Not yet today'],
    ['Weekly challenge', s.progress.weekly[weekId()] ? '✓ Done this week' : 'Not yet'],
    ['Global rank', s.ranks.global ? `#${s.ranks.global}` : '—'],
    ['Suburb rank', s.ranks.suburb ? `#${s.ranks.suburb}` : '—'],
    ['Coins', s.stats.coins.toLocaleString()],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10 space-y-6">
      {/* Header */}
      <section className="card-game p-5 md:p-7 grid md:grid-cols-[auto_1fr_auto] gap-5 items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(600px 200px at 0% 0%, ${tier.color}55, transparent)` }} aria-hidden="true" />
        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl grid place-items-center font-display text-5xl text-night-950 border-4 border-night-950 shadow-2xl" style={{ background: `linear-gradient(135deg, ${tier.color}, #ffffff55)` }}>
          {s.profile?.username.slice(0, 1).toUpperCase()}
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-grape-600 text-white text-xs font-display px-2.5 py-0.5 border-2 border-night-950">LV {lvl.level}</span>
        </div>
        <div className="relative min-w-0">
          <h1 className="font-display text-4xl md:text-5xl break-all">{s.profile?.username}</h1>
          <div className="flex flex-wrap gap-2 mt-1 items-center">
            <span className="text-night-300 font-bold inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {s.profile?.suburb}</span>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-extrabold" style={{ background: `${tier.color}22`, color: tier.color }}>{tier.name.toUpperCase()} · {Math.round(s.stats.skill)}</span>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-extrabold bg-sun-500/15 text-sun-300 inline-flex items-center gap-1"><Icon name={rank.rank.icon} className="w-3.5 h-3.5" /> {rank.rank.name}</span>
          </div>
          <div className="mt-3 max-w-md"><ProgressBar value={lvl.progress} label="Level progress" color="from-aqua-400 to-grape-500" /></div>
          <p className="mt-3 text-xs text-night-400 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Private (only you see this): {s.profile?.firstName} {s.profile?.surname}</p>
        </div>
        {car && (
          <Link href="/garage" className="relative hidden md:block w-60 focus-ring rounded-2xl" aria-label="Garage">
            <CarProfile car={car} custom={s.progress.garage.custom[car.id] ?? defaultCustom(car.id)} className="w-full h-auto" />
          </Link>
        )}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {stats.map(([k, v]) => (
          <div key={k} className="card-game px-3 py-2.5">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-night-400">{k}</div>
            <div className="font-display text-lg leading-tight truncate">{v}</div>
          </div>
        ))}
      </section>

      {/* Mastery */}
      <section className="card-game p-5">
        <SectionTitle kicker="Road-rule categories" right={<GameLink href="/run/practice" tone="aqua" size="sm">Smart Practice</GameLink>}>Mastery</SectionTitle>
        <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-center">
          <MasteryWheel values={MASTERY_CATEGORIES.map((c) => ({ color: c.color, v: mastery[c.id] ?? 0, label: c.short }))} />
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {MASTERY_CATEGORIES.map((c) => {
              const v = mastery[c.id] ?? 0;
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-sm font-bold mb-1">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: c.color }} aria-hidden="true" />{c.name}</span>
                    <span className="font-display">{Math.round(v * 100)}%{v >= GAME.mastery.masteredThreshold ? ' ★' : ''}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-night-950 overflow-hidden" role="progressbar" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.name} mastery`}>
                    <div className="h-full rounded-full" style={{ width: `${v * 100}%`, background: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-night-400 mt-4">Mastery grows each time you answer a question correctly, and resets for that question when you get it wrong — so revisit your mistakes. Weak categories appear more often in practice.</p>
      </section>

      {/* Achievements */}
      <section id="achievements" className="card-game p-5">
        <SectionTitle kicker={`${unlockedCount} of ${ACHIEVEMENTS.length} unlocked`}>Achievements</SectionTitle>
        <Tabs tabs={[{ id: 'all', label: 'All' }, { id: 'unlocked', label: 'Unlocked' }, { id: 'locked', label: 'Locked' }]} value={filter} onChange={setFilter} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-4">
          {achList.map((a) => {
            const got = !!s.progress.achievements[a.id];
            const r = RARITY_STYLE[a.rarity];
            const p = got ? null : achievementProgress(a.id, s, mastery);
            return (
              <div key={a.id} className={`rounded-2xl p-3 border ${got ? '' : 'opacity-60'}`} style={{ borderColor: got ? `${r.color}88` : 'rgba(255,255,255,.08)', background: got ? `${r.color}14` : 'rgba(255,255,255,.02)', boxShadow: got && a.rarity !== 'common' ? `0 0 18px ${r.glow}` : undefined }}>
                <div className="flex items-center justify-between">
                  <span style={{ color: got ? r.color : '#64748b' }}><Icon name={a.icon} className="w-6 h-6" /></span>
                  <span className="text-[9px] font-extrabold tracking-widest" style={{ color: r.color }}>{r.label}</span>
                </div>
                <div className="font-display leading-tight mt-1.5">{a.name}</div>
                <div className="text-[11px] text-night-300 leading-snug">{a.description}</div>
                {p && p.target > 1 && <div className="mt-2"><ProgressBar value={p.current / p.target} height="h-1.5" color="from-night-400 to-night-300" label={`${a.name} progress`} /></div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Settings */}
      <section className="card-game p-5">
        <SectionTitle kicker="Preferences"><span className="inline-flex items-center gap-2"><Settings className="w-6 h-6" /> Settings</span></SectionTitle>
        <div className="grid md:grid-cols-3 gap-4">
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-4">
            <span className="font-bold flex items-center gap-2"><Volume2 className="w-5 h-5" /> Sound effects</span>
            <input type="checkbox" className="w-6 h-6 accent-sun-500" checked={s.settings.sound} onChange={(e) => updateSettings({ sound: e.target.checked })} />
          </label>
          <label className="rounded-2xl bg-white/5 p-4">
            <span className="font-bold block mb-2">Volume</span>
            <input type="range" min={0} max={1} step={0.05} value={s.settings.volume} onChange={(e) => updateSettings({ volume: Number(e.target.value) })} className="w-full accent-sun-500" aria-label="Volume" />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-4">
            <span className="font-bold flex items-center gap-2"><Eye className="w-5 h-5" /> Reduce motion</span>
            <input type="checkbox" className="w-6 h-6 accent-sun-500" checked={s.settings.reducedMotion} onChange={(e) => updateSettings({ reducedMotion: e.target.checked })} />
          </label>
        </div>
        <div className="mt-4 text-xs text-night-400">
          {IS_DEMO ? 'Demo mode: your progress is stored only in this browser.' : 'Your account is linked to this browser/device (no password). Clearing your browser data will sign you out of this profile.'}
        </div>
        {IS_DEMO && (
          <button onClick={() => setConfirmReset(true)} className="mt-3 text-sm font-bold text-danger-400 inline-flex items-center gap-1.5 focus-ring rounded"><Trash2 className="w-4 h-4" /> Reset demo profile</button>
        )}
      </section>
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo profile?">
        <p className="text-night-300 mb-4">This deletes all progress stored in this browser.</p>
        <div className="flex gap-2">
          <GameButton tone="danger" onClick={() => { resetAll(); window.location.href = '/'; }}>Reset</GameButton>
          <GameButton tone="dark" onClick={() => setConfirmReset(false)}>Cancel</GameButton>
        </div>
      </Modal>
    </div>
  );
}

function MasteryWheel({ values }: { values: { color: string; v: number; label: string }[] }) {
  const n = values.length;
  const cx = 130;
  const cy = 130;
  const R = 110;
  const r0 = 34;
  const avg = values.reduce((s, x) => s + x.v, 0) / n;
  return (
    <svg viewBox="0 0 260 260" className="w-full max-w-[260px] mx-auto" role="img" aria-label={`Mastery wheel. Average ${Math.round(avg * 100)} percent`}>
      {values.map((x, i) => {
        const a0 = (i / n) * Math.PI * 2 - Math.PI / 2 + 0.02;
        const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2 - 0.02;
        const arc = (r: number) => `${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 0 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}`;
        const rr = r0 + (R - r0) * Math.max(0.03, x.v);
        return (
          <g key={i}>
            <path d={`M${cx + r0 * Math.cos(a0)},${cy + r0 * Math.sin(a0)} L${arc(R)} L${cx + r0 * Math.cos(a1)},${cy + r0 * Math.sin(a1)} Z`} fill={x.color} opacity=".12" />
            <path d={`M${cx + r0 * Math.cos(a0)},${cy + r0 * Math.sin(a0)} L${arc(rr)} L${cx + r0 * Math.cos(a1)},${cy + r0 * Math.sin(a1)} Z`} fill={x.color} opacity=".9" />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r0 - 2} fill="#0a1022" />
      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="20" fontWeight="900">{Math.round(avg * 100)}%</text>
    </svg>
  );
}
