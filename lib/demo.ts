// DEMO MODE data — clearly fictional players and fictional suburbs.
// Used only when Supabase has not been configured.
import { GAME } from './config';
import { seededRng } from './random';
import { levelFromXp } from './scoring';
import type { LeaderboardRow, SuburbRow } from './types';
import { weekId } from './time';

export const DEMO_SUBURBS = ['Wattle Creek', 'Kookaburra Heights', 'Gumtree Gully', 'Banksia Bay', 'Lorikeet Park', 'Waratah Vale', 'Echidna Flats', 'Bottlebrush Hill', 'Jacaranda Downs', 'Wombat Ridge'];

const NAMES = [
  'LaneLegend', 'GiveWayGuru', 'RoadRunner21', 'SignalKing', 'HazardHunter', 'RoundaboutQueen', 'SafeDriver88', 'RoadAce', 'LearnerLegend', 'TrafficBoss',
  'MergeMaster', 'ZebraCrossing', 'BlinkerBoss', 'GapKeeper', 'StopSignSam', 'KeepLeftKate', 'AmberAlert', 'CruiseControl', 'ParkPerfect', 'DipTheLights',
  'NightOwl_NSW', 'RainRider', 'CountryCruiser', 'LollipopLane', 'SpeedZoneSteph', 'MirrorCheckMia', 'ShoulderCheck', 'TwoSecondTom', 'ThreeSecondTia', 'HumpHopper',
  'CrestCaptain', 'MedianMax', 'TransitT2', 'BusLaneBen', 'RailwayRay', 'BoomGateBella', 'CyclistSafe', 'PedPatrol', 'SchoolZoneZac', 'GreenArrowGia',
];

export interface DemoPlayer {
  id: string;
  username: string;
  suburb: string;
  xp: number;
  skill: number;
  lifetimePoints: number;
  weeklyPoints: number;
  carColor: string;
}

let cache: { week: string; players: DemoPlayer[] } | null = null;

export function demoPlayers(): DemoPlayer[] {
  const wk = weekId();
  if (cache?.week === wk) return cache.players;
  const colors = ['#facc15', '#2563eb', '#ef4444', '#16a34a', '#a21caf', '#f97316', '#14b8a6', '#f8fafc'];
  const players = NAMES.map((username, i) => {
    const r = seededRng(`demo:${username}`);
    const rw = seededRng(`demo:${username}:${wk}`);
    const strength = 1 - i / NAMES.length;
    const xp = Math.round(800 + strength * 38000 * (0.6 + r() * 0.8));
    return {
      id: `demo-${i}`,
      username,
      suburb: DEMO_SUBURBS[Math.floor(r() * DEMO_SUBURBS.length)],
      xp,
      skill: Math.round(950 + strength * 780 * (0.7 + r() * 0.5)),
      lifetimePoints: Math.round(xp * (0.5 + r() * 0.4)),
      weeklyPoints: Math.round(rw() * 2600 * (0.3 + strength)),
      carColor: colors[i % colors.length],
    };
  });
  cache = { week: wk, players };
  return players;
}

export interface Me {
  id: string;
  username: string;
  suburb: string;
  xp: number;
  skill: number;
  lifetimePoints: number;
  weeklyPoints: number;
  carColor: string;
}

type Tab = 'global' | 'week' | 'skill' | 'xp' | 'mysuburb';

export function demoBoard(tab: Tab, me: Me | null, limit = 100): { rows: LeaderboardRow[]; myRank: number | null } {
  let all = [...demoPlayers()];
  if (me) all = [...all.filter((p) => p.username !== me.username), me];
  if (tab === 'mysuburb' && me) all = all.filter((p) => p.suburb.toLowerCase() === me.suburb.toLowerCase());
  const score = (p: DemoPlayer) => (tab === 'week' ? p.weeklyPoints : tab === 'skill' ? p.skill : tab === 'xp' ? p.xp : p.lifetimePoints);
  all.sort((a, b) => score(b) - score(a));
  const rows = all.map((p, i) => ({
    rank: i + 1,
    userId: p.id,
    username: p.username,
    suburb: p.suburb,
    level: levelFromXp(p.xp).level,
    score: Math.round(score(p)),
    isMe: me ? p.id === me.id : false,
    carColor: p.carColor,
  }));
  const myRank = me ? rows.find((r) => r.isMe)?.rank ?? null : null;
  return { rows: rows.slice(0, limit), myRank };
}

/** Fair suburb score: average of the top-N active players' capped weekly points, with a small participation bonus. */
export function suburbChampionship(players: { suburb: string; weeklyPoints: number; xp: number; skill: number }[]): SuburbRow[] {
  const cfg = GAME.suburb;
  const groups = new Map<string, typeof players>();
  for (const p of players) {
    const key = p.suburb.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const rows: SuburbRow[] = [];
  for (const [, list] of groups) {
    const active = list.filter((p) => p.weeklyPoints > 0);
    const top = [...active].sort((a, b) => b.weeklyPoints - a.weeklyPoints).slice(0, cfg.topN);
    const avg = top.length ? top.reduce((s, p) => s + Math.min(cfg.playerCap, p.weeklyPoints), 0) / top.length : 0;
    const bonus = Math.min(cfg.maxParticipationBonus, cfg.participationBonusPerPlayer * Math.min(active.length, cfg.topN));
    rows.push({
      rank: 0,
      suburb: list[0].suburb,
      activePlayers: active.length,
      totalXp: list.reduce((s, p) => s + p.xp, 0),
      avgSkill: Math.round(list.reduce((s, p) => s + p.skill, 0) / list.length),
      weeklyPoints: list.reduce((s, p) => s + p.weeklyPoints, 0),
      championshipScore: Math.round(avg * (1 + bonus)),
      official: active.length >= cfg.minActivePlayers,
    });
  }
  rows.sort((a, b) => Number(b.official) - Number(a.official) || b.championshipScore - a.championshipScore);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

export function demoSuburbs(me: Me | null): SuburbRow[] {
  const all = [...demoPlayers(), ...(me ? [me] : [])];
  return suburbChampionship(all);
}

export function demoDailyTop(me: (Me & { dailyScore?: number }) | null): LeaderboardRow[] {
  const players = demoPlayers();
  const rows: LeaderboardRow[] = players.slice(0, 30).map((p, i) => {
    const r = seededRng(`daily:${p.username}:${new Date().toDateString()}`);
    return { rank: 0, userId: p.id, username: p.username, suburb: p.suburb, level: levelFromXp(p.xp).level, score: Math.round(60 + r() * 220 - i * 2), carColor: p.carColor };
  });
  if (me && me.dailyScore !== undefined) rows.push({ rank: 0, userId: me.id, username: me.username, suburb: me.suburb, level: levelFromXp(me.xp).level, score: me.dailyScore, isMe: true, carColor: me.carColor });
  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

export function demoPastWinners(): { week: string; players: { username: string; suburb: string; points: number }[]; suburb: string }[] {
  const out = [];
  let wk = weekId();
  for (let w = 0; w < 4; w++) {
    const [y, m, d] = wk.split('-').map(Number);
    const prev = new Date(Date.UTC(y, m - 1, d) - 7 * 86400000);
    wk = prev.toISOString().slice(0, 10);
    const r = seededRng(`winners:${wk}`);
    const names = [...NAMES].sort(() => r() - 0.5).slice(0, 3);
    out.push({
      week: wk,
      players: names.map((n, i) => ({ username: n, suburb: DEMO_SUBURBS[Math.floor(r() * DEMO_SUBURBS.length)], points: Math.round(3200 - i * 400 - r() * 300) })),
      suburb: DEMO_SUBURBS[Math.floor(r() * DEMO_SUBURBS.length)],
    });
  }
  return out;
}

export function demoSiteStats(me: { answered: number } | null) {
  const players = demoPlayers();
  const subs = demoSuburbs(null);
  return {
    players: players.length + (me ? 1 : 0),
    answered: 48213 + (me?.answered ?? 0),
    topSuburb: subs[0]?.suburb ?? '—',
    dailyPlayers: 27,
  };
}
