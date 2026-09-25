'use client';
import { useEffect, useState } from 'react';
import { Crown, MapPin, Timer, Users, Sparkles, TrendingUp, Trophy, Info } from 'lucide-react';
import { fetchBoard, fetchSuburbs, fetchWinners, type BoardTab } from '@/lib/api';
import { Tabs, useCountdown, SectionTitle } from '@/components/ui/bits';
import { msUntilWeekEnd, formatDate } from '@/lib/time';
import { useGame } from '@/lib/store';
import { GAME } from '@/lib/config';
import { IS_DEMO } from '@/lib/env';
import type { LeaderboardRow, SuburbRow } from '@/lib/types';

type Tab = BoardTab | 'suburbs';
const TABS: { id: Tab; label: string }[] = [
  { id: 'global', label: 'Global' },
  { id: 'week', label: 'This Week' },
  { id: 'skill', label: 'Skill' },
  { id: 'xp', label: 'XP' },
  { id: 'mysuburb', label: 'My Suburb' },
  { id: 'suburbs', label: 'Suburbs' },
];
const LABEL: Record<string, string> = { global: 'pts', week: 'pts', skill: 'SR', xp: 'XP', mysuburb: 'pts' };

export function Leaderboards() {
  const [tab, setTab] = useState<Tab>('week');
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [me, setMe] = useState<LeaderboardRow | null>(null);
  const [subs, setSubs] = useState<SuburbRow[] | null>(null);
  const [mySuburb, setMySuburb] = useState<string | undefined>();
  const [winners, setWinners] = useState<Awaited<ReturnType<typeof fetchWinners>>['weeks']>([]);
  const [error, setError] = useState<string | null>(null);
  const weekLeft = useCountdown(() => msUntilWeekEnd());
  const hasProfile = useGame((s) => !!s.profile);
  const hydrated = useGame((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    void fetchSuburbs().then((r) => {
      setSubs(r.rows);
      setMySuburb(r.mySuburb);
    }).catch(() => setSubs([]));
    void fetchWinners().then((r) => setWinners(r.weeks)).catch(() => setWinners([]));
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || tab === 'suburbs') return;
    setRows(null);
    setError(null);
    fetchBoard(tab)
      .then((r) => {
        setRows(r.rows);
        setMe(r.me ?? null);
      })
      .catch((e) => setError((e as Error).message));
  }, [tab, hydrated]);

  const champ = subs?.find((s) => s.official);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold tracking-[.25em] text-aqua-400">BECOME #1 IN NSW</div>
          <h1 className="font-display text-4xl md:text-5xl">Leaderboards</h1>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-2">
          <Timer className="w-5 h-5 text-sun-400" />
          <div>
            <div className="text-[10px] font-extrabold tracking-widest text-night-300">WEEK ENDS IN</div>
            <div className="font-display text-lg tabular-nums">{weekLeft}</div>
          </div>
        </div>
      </div>

      {champ && (
        <div className="relative overflow-hidden rounded-[1.75rem] p-5 md:p-7 bg-gradient-to-r from-sun-400 via-flame-500 to-berry-500 text-night-950 shadow-[0_8px_0_#9a3412]">
          <div className="absolute -right-4 -top-6 opacity-25" aria-hidden="true"><Crown className="w-40 h-40" /></div>
          <div className="text-xs font-extrabold tracking-[.3em]">NSW ROADQUEST CHAMPION SUBURB</div>
          <div className="font-display text-4xl md:text-6xl leading-none mt-1">{champ.suburb}</div>
          <div className="mt-2 font-bold text-sm">{champ.championshipScore.toLocaleString()} championship score · {champ.activePlayers} active players this week</div>
        </div>
      )}

      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {IS_DEMO && <p className="text-xs text-grape-300 font-bold flex items-center gap-1.5"><Info className="w-4 h-4" /> Demo mode: sample players and fictional suburbs. Connect Supabase for real online leaderboards.</p>}

      {tab === 'suburbs' ? (
        <SuburbBoard rows={subs} mySuburb={mySuburb} />
      ) : error ? (
        <div className="card-game p-6 text-night-300">Couldn&apos;t load the leaderboard: {error}</div>
      ) : !rows ? (
        <div className="card-game p-6 text-night-300">Loading…</div>
      ) : (
        <>
          <Podium rows={rows.slice(0, 3)} label={LABEL[tab]} />
          <BoardRows rows={rows.slice(3)} scoreLabel={LABEL[tab]} />
          {me && !rows.some((r) => r.isMe) && (
            <div className="sticky bottom-24 lg:bottom-4">
              <BoardRows rows={[me]} scoreLabel={LABEL[tab]} />
            </div>
          )}
          {!hasProfile && <p className="text-night-300 text-sm">Create a driver to appear on the leaderboards.</p>}
        </>
      )}

      {winners.length > 0 && (
        <section>
          <SectionTitle kicker="Hall of fame">Previous weekly winners</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {winners.map((w) => (
              <div key={w.week} className="card-game p-4">
                <div className="text-xs font-extrabold text-night-300">Week of {formatDate(w.week)}</div>
                {w.players.map((p, i) => (
                  <div key={p.username} className="flex items-center gap-2 mt-1.5">
                    <span className={`font-display ${i === 0 ? 'text-sun-400' : i === 1 ? 'text-slate-300' : 'text-amber-600'}`}>#{i + 1}</span>
                    <span className="font-bold truncate">{p.username}</span>
                    <span className="ml-auto text-xs text-night-300">{p.points.toLocaleString()}</span>
                  </div>
                ))}
                {w.suburb && <div className="mt-2 text-xs font-bold text-aqua-400 flex items-center gap-1"><Crown className="w-3.5 h-3.5" /> {w.suburb}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Podium({ rows, label }: { rows: LeaderboardRow[]; label: string }) {
  if (!rows.length) return <div className="card-game p-6 text-night-300">No scores yet — be the first!</div>;
  const order = [rows[1], rows[0], rows[2]].filter(Boolean);
  const h = (r: LeaderboardRow) => (r.rank === 1 ? 'h-36 md:h-44' : r.rank === 2 ? 'h-28 md:h-32' : 'h-24 md:h-28');
  const c = (r: LeaderboardRow) => (r.rank === 1 ? 'from-sun-400 to-sun-600' : r.rank === 2 ? 'from-slate-200 to-slate-400' : 'from-amber-500 to-amber-700');
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4 items-end pt-6">
      {order.map((r) => (
        <div key={r.userId} className="flex flex-col items-center text-center animate-slide-up">
          {r.rank === 1 && <Crown className="w-8 h-8 text-sun-400 mb-1 animate-float" aria-hidden="true" />}
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl grid place-items-center font-display text-xl md:text-2xl border-4 border-night-950 shadow-lg" style={{ background: r.carColor ?? '#334155', color: '#0b1022' }}>
            {r.username.slice(0, 1).toUpperCase()}
          </div>
          <div className={`font-bold mt-1.5 text-sm md:text-base truncate max-w-full ${r.isMe ? 'text-sun-400' : ''}`}>{r.username}</div>
          <div className="text-[11px] text-night-300 truncate max-w-full">{r.suburb}</div>
          <div className={`w-full mt-2 rounded-t-2xl bg-gradient-to-b ${c(r)} ${h(r)} text-night-950 flex flex-col items-center pt-2`}>
            <div className="font-display text-3xl md:text-4xl">{r.rank}</div>
            <div className="font-display text-sm md:text-base">{r.score.toLocaleString()} {label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BoardRows({ rows, scoreLabel }: { rows: LeaderboardRow[]; scoreLabel: string }) {
  if (!rows.length) return null;
  return (
    <div className="card-game overflow-hidden">
      <div className="grid grid-cols-[3rem_1fr_auto] md:grid-cols-[4rem_1fr_10rem_4rem_8rem] gap-2 px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-night-400 border-b border-white/5">
        <span>Rank</span>
        <span>Player</span>
        <span className="hidden md:block">Suburb</span>
        <span className="hidden md:block">Lvl</span>
        <span className="text-right">Score</span>
      </div>
      <ol>
        {rows.map((r) => (
          <li key={`${r.userId}-${r.rank}`} className={`grid grid-cols-[3rem_1fr_auto] md:grid-cols-[4rem_1fr_10rem_4rem_8rem] gap-2 px-4 py-3 items-center border-b border-white/5 last:border-0 ${r.isMe ? 'bg-sun-500/15 ring-2 ring-inset ring-sun-400/60' : 'hover:bg-white/5'}`} aria-current={r.isMe ? 'true' : undefined}>
            <span className="font-display text-lg text-night-300">#{r.rank}</span>
            <span className="min-w-0">
              <span className="font-bold truncate block">{r.username}{r.isMe && <span className="ml-2 text-[10px] font-extrabold text-sun-400">YOU</span>}</span>
              <span className="md:hidden text-xs text-night-400 truncate block">{r.suburb} · Lvl {r.level}</span>
            </span>
            <span className="hidden md:block text-sm text-night-300 truncate">{r.suburb}</span>
            <span className="hidden md:block font-display text-night-200">{r.level}</span>
            <span className="text-right font-display text-lg">{r.score.toLocaleString()} <span className="text-xs text-night-400">{scoreLabel}</span></span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SuburbBoard({ rows, mySuburb }: { rows: SuburbRow[] | null; mySuburb?: string }) {
  if (!rows) return <div className="card-game p-6 text-night-300">Loading…</div>;
  const official = rows.filter((r) => r.official);
  const unofficial = rows.filter((r) => !r.official);
  const mine = mySuburb?.toLowerCase();
  return (
    <div className="space-y-4">
      <div className="card-game p-4 text-sm text-night-300 flex gap-3">
        <Info className="w-5 h-5 shrink-0 text-aqua-400" />
        <p>
          <b className="text-white">Fair scoring:</b> a suburb&apos;s Championship Score is the average of its top {GAME.suburb.topN} active players&apos; weekly points (each capped at {GAME.suburb.playerCap.toLocaleString()}), plus a small participation bonus (up to +{Math.round(GAME.suburb.maxParticipationBonus * 100)}%). Big suburbs don&apos;t win just by being big. Suburbs need at least {GAME.suburb.minActivePlayers} active players this week to appear on the official ladder.
        </p>
      </div>
      <div className="card-game overflow-x-auto">
        <table className="w-full text-left min-w-[640px]">
          <thead>
            <tr className="text-[10px] font-extrabold uppercase tracking-widest text-night-400 border-b border-white/5">
              <th className="px-4 py-2">#</th>
              <th className="px-2 py-2">Suburb</th>
              <th className="px-2 py-2"><Users className="w-3.5 h-3.5 inline" /> Active</th>
              <th className="px-2 py-2"><Sparkles className="w-3.5 h-3.5 inline" /> Total XP</th>
              <th className="px-2 py-2"><TrendingUp className="w-3.5 h-3.5 inline" /> Avg skill</th>
              <th className="px-2 py-2">Weekly pts</th>
              <th className="px-4 py-2 text-right"><Trophy className="w-3.5 h-3.5 inline" /> Champ. score</th>
            </tr>
          </thead>
          <tbody>
            {official.map((r) => (
              <tr key={r.suburb} className={`border-b border-white/5 ${r.suburb.toLowerCase() === mine ? 'bg-sun-500/15' : ''}`}>
                <td className={`px-4 py-3 font-display text-xl ${r.rank === 1 ? 'text-sun-400' : r.rank === 2 ? 'text-slate-300' : r.rank === 3 ? 'text-amber-600' : 'text-night-300'}`}>{r.rank}</td>
                <td className="px-2 py-3 font-bold"><MapPin className="w-4 h-4 inline text-aqua-400 mr-1" />{r.suburb}{r.suburb.toLowerCase() === mine && <span className="ml-2 text-[10px] font-extrabold text-sun-400">YOURS</span>}</td>
                <td className="px-2 py-3">{r.activePlayers}</td>
                <td className="px-2 py-3">{r.totalXp.toLocaleString()}</td>
                <td className="px-2 py-3">{r.avgSkill.toLocaleString()}</td>
                <td className="px-2 py-3">{r.weeklyPoints.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-display text-xl text-aqua-300">{r.championshipScore.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {official.length === 0 && <p className="p-6 text-night-300">No suburb has enough active players yet this week. Recruit your mates!</p>}
      </div>
      {unofficial.length > 0 && (
        <div>
          <div className="text-xs font-extrabold uppercase tracking-widest text-night-400 mb-2">Warming up (fewer than {GAME.suburb.minActivePlayers} active players)</div>
          <div className="flex flex-wrap gap-2">
            {unofficial.slice(0, 40).map((r) => (
              <span key={r.suburb} className={`rounded-full px-3 py-1 text-sm font-bold border ${r.suburb.toLowerCase() === mine ? 'border-sun-400 text-sun-300' : 'border-white/10 text-night-300'}`}>{r.suburb} · {r.activePlayers}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
