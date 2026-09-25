'use client';
// Lightweight game-state store (no external library).
// • Persists to localStorage for instant loading (a cache in online mode,
//   the source of truth in demo mode).
// • Competitive numbers (XP, coins, skill, points) are overwritten by the
//   server's authoritative values whenever online mode is active.
import { useSyncExternalStore } from 'react';
import type { CarCustom, SessionResult } from './types';
import { QUESTION_MAP, type QStats } from './questions';
import { dayId, weekId } from './time';
import { CARS, COSMETICS } from './config';

export interface PlayerProfile {
  id: string;
  username: string;
  suburb: string;
  firstName: string; // PRIVATE — never displayed publicly
  surname: string; // PRIVATE — never displayed publicly
  createdAt: number;
}

export interface PlayerStats {
  xp: number;
  coins: number;
  skill: number;
  weeklyPoints: number;
  weekId: string;
  lifetimePoints: number;
  answered: number;
  correct: number;
  streak: number;
  bestStreak: number;
  coinsEarned: number;
}

export interface Counters {
  firstDrive: number;
  minigamesPlayed: number;
  perfectRuns: number;
  cleanDrives: number;
  fastAnswers: number;
  customised: number;
  testsTaken: number;
  testPassed: number;
  dailyCompleted: number;
  dailyStreak: number;
  lastDailyDay: string;
  weeklyCompleted: number;
  categoryCorrect: Record<string, number>;
  minigamePerfect: Record<string, number>;
}

export interface Progress {
  qstats: QStats;
  map: Record<string, { stars: number; best: number; completedAt: number }>;
  garage: {
    owned: string[];
    current: string;
    custom: Record<string, CarCustom>;
    cosmetics: string[]; // "paint:coral", "wheels:sport" ...
    background: string;
  };
  achievements: Record<string, number>;
  counters: Counters;
  daily: Record<string, { score: number; correct: number; total: number; ranked: boolean }>;
  weekly: Record<string, { score: number; correct: number; total: number; ranked: boolean }>;
  tests: { at: number; correct: number; total: number; passed: boolean; final: boolean }[];
  licence: { number: string; awardedAt: number; skill: number; accuracy: number } | null;
  finalPassed: boolean;
  nonRanked: { day: string; points: number };
  recent: Record<string, number>;
}

export interface Settings {
  sound: boolean;
  volume: number;
  reducedMotion: boolean;
}

export type ToastKind = 'xp' | 'coins' | 'achievement' | 'levelup' | 'rank' | 'info' | 'unlock';
export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  icon?: string;
  rarity?: string;
}

export interface GameState {
  hydrated: boolean;
  profile: PlayerProfile | null;
  stats: PlayerStats;
  progress: Progress;
  settings: Settings;
  onboarded: boolean;
  ranks: { global: number | null; suburb: number | null };
  toasts: Toast[];
  lastSync: number;
}

export function defaultCustom(carId: string): CarCustom {
  const car = CARS.find((c) => c.id === carId);
  return {
    paint: car?.paint ?? 'sunburst',
    wheels: 'steel',
    roof: 'none',
    decal: 'none',
    plate: 'classic',
    plateText: 'L3ARN',
    lplate: 'classic',
    interior: 'charcoal',
  };
}

export const initialStats = (): PlayerStats => ({
  xp: 0,
  coins: 0,
  skill: 1000,
  weeklyPoints: 0,
  weekId: weekId(),
  lifetimePoints: 0,
  answered: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  coinsEarned: 0,
});

export const initialProgress = (): Progress => ({
  qstats: {},
  map: {},
  garage: { owned: [], current: '', custom: {}, cosmetics: [], background: 'carport' },
  achievements: {},
  counters: {
    firstDrive: 0,
    minigamesPlayed: 0,
    perfectRuns: 0,
    cleanDrives: 0,
    fastAnswers: 0,
    customised: 0,
    testsTaken: 0,
    testPassed: 0,
    dailyCompleted: 0,
    dailyStreak: 0,
    lastDailyDay: '',
    weeklyCompleted: 0,
    categoryCorrect: {},
    minigamePerfect: {},
  },
  daily: {},
  weekly: {},
  tests: [],
  licence: null,
  finalPassed: false,
  nonRanked: { day: dayId(), points: 0 },
  recent: {},
});

const initialState = (): GameState => ({
  hydrated: false,
  profile: null,
  stats: initialStats(),
  progress: initialProgress(),
  settings: { sound: true, volume: 0.5, reducedMotion: false },
  onboarded: false,
  ranks: { global: null, suburb: null },
  toasts: [],
  lastSync: 0,
});

const KEY = 'roadquest-nsw:v1';
let state: GameState = initialState();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    const { toasts: _t, hydrated: _h, ...rest } = state;
    void _t;
    void _h;
    window.localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {
    /* storage full or blocked — the game keeps working in memory */
  }
}

export function getState(): GameState {
  return state;
}

export function setState(updater: (s: GameState) => GameState, save = true) {
  state = updater(state);
  if (save) persist();
  emit();
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Merge a saved blob onto defaults so new fields added in updates never crash old saves. */
function mergeDeep<T>(base: T, saved: unknown): T {
  if (saved === null || saved === undefined) return base;
  if (typeof base !== 'object' || base === null || Array.isArray(base)) return (saved as T) ?? base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(saved as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = b && typeof b === 'object' && !Array.isArray(b) && v && typeof v === 'object' && !Array.isArray(v) && Object.keys(b as object).length ? mergeDeep(b, v) : v;
  }
  return out as T;
}

export function hydrate() {
  if (state.hydrated || typeof window === 'undefined') return;
  let loaded: Partial<GameState> = {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) loaded = JSON.parse(raw);
  } catch {
    loaded = {};
  }
  const base = initialState();
  state = {
    ...base,
    ...loaded,
    stats: mergeDeep(base.stats, loaded.stats),
    progress: mergeDeep(base.progress, loaded.progress),
    settings: mergeDeep(base.settings, loaded.settings),
    ranks: mergeDeep(base.ranks, loaded.ranks),
    hydrated: true,
    toasts: [],
  };
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches && !loaded.settings) {
    state.settings.reducedMotion = true;
  }
  rolloverPeriods();
  emit();
}

/** Reset weekly points when a new Sydney week starts; reset the non-ranked daily cap each day. */
export function rolloverPeriods() {
  const wk = weekId();
  const today = dayId();
  let changed = false;
  if (state.stats.weekId !== wk) {
    state = { ...state, stats: { ...state.stats, weekId: wk, weeklyPoints: 0 } };
    changed = true;
  }
  if (state.progress.nonRanked.day !== today) {
    state = { ...state, progress: { ...state.progress, nonRanked: { day: today, points: 0 } } };
    changed = true;
  }
  const cutoff = Date.now() - 86400000;
  const recent = Object.fromEntries(Object.entries(state.progress.recent).filter(([, t]) => t > cutoff));
  if (Object.keys(recent).length !== Object.keys(state.progress.recent).length) {
    state = { ...state, progress: { ...state.progress, recent } };
    changed = true;
  }
  if (changed) persist();
}

export function useGame<T>(selector: (s: GameState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(serverSnapshot),
  );
}
const serverSnapshot = initialState();

// ─── Actions ────────────────────────────────────────────────────
let toastSeq = 0;
export function pushToast(t: Omit<Toast, 'id'>) {
  const id = `t${Date.now()}-${toastSeq++}`;
  setState((s) => ({ ...s, toasts: [...s.toasts, { ...t, id }] }), false);
  return id;
}
export function dismissToast(id: string) {
  setState((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) }), false);
}

export function setProfile(profile: PlayerProfile, starterCar: string) {
  setState((s) => ({
    ...s,
    profile,
    progress: {
      ...s.progress,
      garage: {
        ...s.progress.garage,
        owned: Array.from(new Set([...s.progress.garage.owned, starterCar])),
        current: starterCar,
        custom: { ...s.progress.garage.custom, [starterCar]: s.progress.garage.custom[starterCar] ?? defaultCustom(starterCar) },
        cosmetics: Array.from(new Set([...s.progress.garage.cosmetics, ...defaultCosmetics()])),
      },
    },
  }));
}

export function defaultCosmetics(): string[] {
  const free: string[] = [];
  for (const [group, list] of Object.entries(COSMETICS) as [string, { id: string; price: number; achievement?: string }[]][]) {
    for (const item of list) if (item.price === 0 && !item.achievement) free.push(`${group}:${item.id}`);
  }
  return free;
}

export function setOnboarded(v = true) {
  setState((s) => ({ ...s, onboarded: v }));
}

export function updateSettings(patch: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

/** Apply a graded session (from the server in online mode, or computed locally in demo mode). */
export function applySessionResult(result: SessionResult, opts: { dayKey?: string; weekKey?: string; minigameId?: string } = {}) {
  setState((s) => {
    const now = Date.now();
    const qstats = { ...s.progress.qstats };
    const recent = { ...s.progress.recent };
    const categoryCorrect = { ...s.progress.counters.categoryCorrect };
    let fastAnswers = s.progress.counters.fastAnswers;
    for (const g of result.graded) {
      const prev = qstats[g.qid] ?? { seen: 0, correct: 0, wrong: 0, box: 0, last: 0 };
      qstats[g.qid] = {
        seen: prev.seen + 1,
        correct: prev.correct + (g.correct ? 1 : 0),
        wrong: prev.wrong + (g.correct ? 0 : 1),
        box: g.correct ? Math.min(3, prev.box + 1) : 0,
        last: now,
      };
      recent[g.qid] = now;
      if (g.correct) {
        const cat = categoryFromId(g.qid);
        categoryCorrect[cat] = (categoryCorrect[cat] ?? 0) + 1;
        if (g.fast) fastAnswers++;
      }
    }
    const counters = { ...s.progress.counters, categoryCorrect, fastAnswers };
    if (result.perfect) counters.perfectRuns++;
    if (result.mode === 'minigame') {
      counters.minigamesPlayed++;
      if (result.perfect && opts.minigameId) counters.minigamePerfect = { ...counters.minigamePerfect, [opts.minigameId]: 1 };
    }
    const daily = { ...s.progress.daily };
    if (result.mode === 'daily' && opts.dayKey) {
      const already = daily[opts.dayKey];
      if (!already || !already.ranked) {
        daily[opts.dayKey] = { score: result.score, correct: result.correctCount, total: result.total, ranked: result.ranked || !already };
        counters.dailyCompleted++;
        const yesterday = new Date(Date.now() - 86400000);
        counters.dailyStreak = counters.lastDailyDay === dayId(yesterday) ? counters.dailyStreak + 1 : 1;
        counters.lastDailyDay = opts.dayKey;
      }
    }
    const weekly = { ...s.progress.weekly };
    if (result.mode === 'weekly' && opts.weekKey && !weekly[opts.weekKey]) {
      weekly[opts.weekKey] = { score: result.score, correct: result.correctCount, total: result.total, ranked: true };
      counters.weeklyCompleted++;
    }
    let tests = s.progress.tests;
    let finalPassed = s.progress.finalPassed;
    if (result.mode === 'test' || result.mode === 'final') {
      counters.testsTaken++;
      if (result.passed) counters.testPassed = 1;
      tests = [...tests, { at: now, correct: result.correctCount, total: result.total, passed: !!result.passed, final: result.mode === 'final' }].slice(-20);
      if (result.mode === 'final' && result.passed) finalPassed = true;
    }
    const isRankedPoints = result.mode === 'daily' || result.mode === 'weekly';
    const nonRanked = isRankedPoints ? s.progress.nonRanked : { day: s.progress.nonRanked.day, points: s.progress.nonRanked.points + result.points };
    const correct = s.stats.correct + result.correctCount;
    return {
      ...s,
      stats: {
        ...s.stats,
        xp: s.stats.xp + result.xp,
        coins: s.stats.coins + result.coins,
        coinsEarned: s.stats.coinsEarned + result.coins,
        skill: result.skillAfter,
        weeklyPoints: s.stats.weeklyPoints + result.points,
        lifetimePoints: s.stats.lifetimePoints + result.points,
        answered: s.stats.answered + result.total,
        correct,
        streak: result.streakAfter,
        bestStreak: Math.max(s.stats.bestStreak, result.bestStreakInRun),
      },
      progress: { ...s.progress, qstats, recent, counters, daily, weekly, tests, finalPassed, nonRanked },
    };
  });
}

function categoryFromId(qid: string): string {
  return QUESTION_MAP[qid]?.category ?? 'general';
}

/** Overwrite competitive numbers with the server's authoritative copy. */
export function applyServerStats(server: Partial<PlayerStats>) {
  setState((s) => ({ ...s, stats: { ...s.stats, ...server } }));
}

export function completeLevel(levelId: string, stars: number, score: number) {
  setState((s) => {
    const prev = s.progress.map[levelId];
    return {
      ...s,
      progress: {
        ...s.progress,
        map: {
          ...s.progress.map,
          [levelId]: { stars: Math.max(prev?.stars ?? 0, stars), best: Math.max(prev?.best ?? 0, score), completedAt: prev?.completedAt ?? Date.now() },
        },
      },
    };
  });
}

export function bumpCounter(key: 'firstDrive' | 'cleanDrives' | 'customised', by = 1) {
  setState((s) => ({ ...s, progress: { ...s.progress, counters: { ...s.progress.counters, [key]: (s.progress.counters[key] as number) + by } } }));
}

export function unlockAchievements(ids: string[]) {
  if (!ids.length) return;
  setState((s) => {
    const a = { ...s.progress.achievements };
    for (const id of ids) if (!a[id]) a[id] = Date.now();
    return { ...s, progress: { ...s.progress, achievements: a } };
  });
}

export function setGarage(patch: Partial<Progress['garage']>) {
  setState((s) => ({ ...s, progress: { ...s.progress, garage: { ...s.progress.garage, ...patch } } }));
}

export function spendCoins(amount: number): boolean {
  if (state.stats.coins < amount) return false;
  setState((s) => ({ ...s, stats: { ...s.stats, coins: s.stats.coins - amount } }));
  return true;
}

export function awardLocal(xp: number, coins: number) {
  setState((s) => ({ ...s, stats: { ...s.stats, xp: s.stats.xp + xp, coins: s.stats.coins + coins, coinsEarned: s.stats.coinsEarned + coins } }));
}

export function setLicence(licence: Progress['licence']) {
  setState((s) => ({ ...s, progress: { ...s.progress, licence } }));
}

export function setRanks(ranks: GameState['ranks']) {
  setState((s) => ({ ...s, ranks }), true);
}

export function replaceProgress(progress: Progress) {
  setState((s) => ({ ...s, progress: mergeDeep(initialProgress(), progress) }));
}

export function resetAll() {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
  state = { ...initialState(), hydrated: true };
  emit();
}
