'use client';
// One API for the whole game. In DEMO MODE everything runs locally; once
// Supabase is configured the same calls go to the server routes in /app/api.
import { IS_ONLINE } from './env';
import { ensureAnonymousSession, getAccessToken } from './supabase/client';
import { computeSession } from './scoring';
import { dailyChallengeIds, testQuestionIds, weeklyChallengeIds } from './questions';
import { dayId, weekId } from './time';
import { demoBoard, demoDailyTop, demoPastWinners, demoSiteStats, demoSuburbs, type Me } from './demo';
import { applyServerStats, getState, replaceProgress, setProfile, setRanks, setState, type PlayerStats, type Progress } from './store';
import { paintHex } from './config';
import { uid } from './random';
import type { AnswerPayload, GameMode, LeaderboardRow, SessionResult, SuburbRow } from './types';

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.message ?? body?.error ?? `Request failed (${res.status})`) as Error & { status?: number; code?: string };
    err.status = res.status;
    err.code = body?.error;
    throw err;
  }
  return body as T;
}

// ─── Registration ───────────────────────────────────────────────
export interface RegisterInput {
  firstName: string;
  surname: string;
  username: string;
  suburb: string;
  starterCar: string;
}

export async function checkUsername(username: string): Promise<{ available: boolean }> {
  if (!IS_ONLINE) return { available: !demoBoard('xp', null, 999).rows.some((r) => r.username.toLowerCase() === username.toLowerCase()) };
  return call(`/api/username?u=${encodeURIComponent(username)}`);
}

export async function registerPlayer(input: RegisterInput): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!IS_ONLINE) {
      const taken = demoBoard('xp', null, 999).rows.some((r) => r.username.toLowerCase() === input.username.toLowerCase());
      if (taken) return { ok: false, error: 'That username is already taken.' };
      setProfile({ id: uid('local-'), username: input.username, suburb: input.suburb, firstName: input.firstName, surname: input.surname, createdAt: Date.now() }, input.starterCar);
      return { ok: true };
    }
    const { userId } = await ensureAnonymousSession();
    await call('/api/register', { method: 'POST', body: JSON.stringify(input) });
    setProfile({ id: userId, username: input.username, suburb: input.suburb, firstName: input.firstName, surname: input.surname, createdAt: Date.now() }, input.starterCar);
    void saveProgressNow();
    return { ok: true };
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 409) return { ok: false, error: 'That username is already taken.' };
    return { ok: false, error: err.message || 'Something went wrong. Please try again.' };
  }
}

// ─── Sessions ───────────────────────────────────────────────────
export interface SessionMeta {
  dayKey?: string;
  weekKey?: string;
  minigameId?: string;
  levelId?: string;
}

export async function startSession(mode: GameMode, questionIds: string[], meta: SessionMeta = {}): Promise<{ sessionId: string; questionIds: string[] }> {
  if (!IS_ONLINE) {
    let ids = questionIds;
    if (mode === 'daily') ids = dailyChallengeIds(meta.dayKey ?? dayId());
    if (mode === 'weekly') ids = weeklyChallengeIds(meta.weekKey ?? weekId());
    if ((mode === 'test' || mode === 'final') && !ids.length) ids = testQuestionIds();
    return { sessionId: uid('demo-'), questionIds: ids };
  }
  return call('/api/session/start', { method: 'POST', body: JSON.stringify({ mode, questionIds, meta }) });
}

export async function submitSession(sessionId: string, mode: GameMode, answers: AnswerPayload[], meta: SessionMeta = {}): Promise<{ result: SessionResult; stats?: Partial<PlayerStats> }> {
  if (!IS_ONLINE) {
    const s = getState();
    const result = computeSession(mode, answers, {
      skill: s.stats.skill,
      answeredTotal: s.stats.answered,
      streak: s.stats.streak,
      recent: s.progress.recent,
      nonRankedPointsToday: s.progress.nonRanked.points,
      now: Date.now(),
    }, {
      firstDailyAttempt: mode === 'daily' && !s.progress.daily[meta.dayKey ?? dayId()],
      firstWeeklyAttempt: mode === 'weekly' && !s.progress.weekly[meta.weekKey ?? weekId()],
      firstOnboarding: mode === 'onboarding' && s.progress.counters.firstDrive === 0,
    });
    return { result };
  }
  return call('/api/session/submit', { method: 'POST', body: JSON.stringify({ sessionId, answers }) });
}

// ─── Profile / progress sync (online) ───────────────────────────
export async function loadMe(): Promise<void> {
  if (!IS_ONLINE) return;
  const token = await getAccessToken();
  if (!token) return;
  try {
    const me = await call<{ profile: { id: string; username: string; suburb: string; firstName: string; surname: string; createdAt: string } | null; stats: Partial<PlayerStats>; progress: Progress | null; ranks: { global: number | null; suburb: number | null } }>('/api/me');
    if (!me.profile) return;
    const local = getState();
    setState((s) => ({
      ...s,
      profile: { id: me.profile!.id, username: me.profile!.username, suburb: me.profile!.suburb, firstName: me.profile!.firstName, surname: me.profile!.surname, createdAt: Date.parse(me.profile!.createdAt) || Date.now() },
      onboarded: s.onboarded || !!me.progress,
    }));
    if (me.progress && Object.keys(me.progress).length) {
      // keep whichever copy has seen more questions (e.g. offline play on this device)
      const remoteSeen = Object.keys(me.progress.qstats ?? {}).length;
      const localSeen = Object.keys(local.progress.qstats).length;
      if (remoteSeen >= localSeen || local.profile?.id !== me.profile.id) replaceProgress(me.progress);
    }
    applyServerStats(me.stats);
    setRanks(me.ranks);
  } catch {
    /* offline — keep cached state */
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function saveProgress() {
  if (!IS_ONLINE) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void saveProgressNow(), 2500);
}

export async function saveProgressNow(): Promise<void> {
  if (!IS_ONLINE) return;
  const s = getState();
  if (!s.profile) return;
  const car = s.progress.garage.current;
  const paint = s.progress.garage.custom[car]?.paint;
  try {
    await call('/api/progress', { method: 'PUT', body: JSON.stringify({ progress: s.progress, selectedCarId: car, carColor: paint ? paintHex(paint) : null }) });
  } catch {
    /* retried on next save */
  }
}

// ─── Garage ─────────────────────────────────────────────────────
export async function buyItem(kind: 'car' | 'cosmetic', id: string): Promise<{ ok: boolean; coins?: number; error?: string }> {
  if (!IS_ONLINE) return { ok: true };
  try {
    const r = await call<{ coins: number }>('/api/garage', { method: 'POST', body: JSON.stringify({ kind, id }) });
    applyServerStats({ coins: r.coins });
    return { ok: true, coins: r.coins };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Leaderboards ───────────────────────────────────────────────
export type BoardTab = 'global' | 'week' | 'skill' | 'xp' | 'mysuburb';

function meForDemo(): (Me & { dailyScore?: number }) | null {
  const s = getState();
  if (!s.profile) return null;
  const car = s.progress.garage.current;
  const daily = s.progress.daily[dayId()];
  return {
    id: s.profile.id,
    username: s.profile.username,
    suburb: s.profile.suburb,
    xp: s.stats.xp,
    skill: s.stats.skill,
    lifetimePoints: s.stats.lifetimePoints,
    weeklyPoints: s.stats.weeklyPoints,
    carColor: paintHex(s.progress.garage.custom[car]?.paint ?? 'sunburst'),
    dailyScore: daily?.ranked ? daily.score : undefined,
  };
}

export async function fetchBoard(tab: BoardTab): Promise<{ rows: LeaderboardRow[]; myRank: number | null; me?: LeaderboardRow | null }> {
  if (!IS_ONLINE) {
    const me = meForDemo();
    const r = demoBoard(tab, me);
    return { ...r, me: r.rows.find((x) => x.isMe) ?? null };
  }
  return call(`/api/leaderboard?tab=${tab}`);
}

export async function fetchSuburbs(): Promise<{ rows: SuburbRow[]; mySuburb?: string }> {
  if (!IS_ONLINE) return { rows: demoSuburbs(meForDemo()), mySuburb: getState().profile?.suburb };
  return call('/api/leaderboard?tab=suburbs');
}

export async function fetchDailyTop(): Promise<{ rows: LeaderboardRow[] }> {
  if (!IS_ONLINE) return { rows: demoDailyTop(meForDemo()).slice(0, 100) };
  return call('/api/leaderboard?tab=daily');
}

export async function fetchWinners(): Promise<{ weeks: { week: string; players: { username: string; suburb: string; points: number }[]; suburb: string }[] }> {
  if (!IS_ONLINE) return { weeks: demoPastWinners() };
  return call('/api/leaderboard?tab=winners');
}

export async function fetchSiteStats(): Promise<{ players: number; answered: number; topSuburb: string; dailyPlayers: number }> {
  if (!IS_ONLINE) return demoSiteStats(getState().profile ? { answered: getState().stats.answered } : null);
  try {
    return await call('/api/stats');
  } catch {
    return { players: 0, answered: 0, topSuburb: '—', dailyPlayers: 0 };
  }
}

export async function refreshRanks(): Promise<void> {
  if (!IS_ONLINE) {
    const me = meForDemo();
    if (!me) return;
    const g = demoBoard('global', me, 9999).myRank;
    const sub = demoBoard('mysuburb', me, 9999).myRank;
    setRanks({ global: g, suburb: sub });
    return;
  }
  try {
    const r = await call<{ global: number | null; suburb: number | null }>('/api/ranks');
    setRanks(r);
  } catch {
    /* ignore */
  }
}
