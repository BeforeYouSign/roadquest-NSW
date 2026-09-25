// Licence ranks, map unlocks, achievements and licence eligibility.
import { ACHIEVEMENTS, GAME, LEVELS, MASTERY_CATEGORIES, RANKS } from './config';
import { allMastery } from './questions';
import { levelFromXp } from './scoring';
import { IS_DEMO } from './env';
import type { GameState } from './store';
import type { Rank } from './types';

export function masteryOf(s: GameState): Record<string, number> {
  return allMastery(s.progress.qstats);
}

export function mapLevelsCleared(s: GameState): number {
  return LEVELS.filter((l) => s.progress.map[l.id]).length;
}

export function isLevelUnlocked(s: GameState, levelId: string): boolean {
  const idx = LEVELS.findIndex((l) => l.id === levelId);
  if (idx <= 0) return true;
  return !!s.progress.map[LEVELS[idx - 1].id];
}

export function nextLevel(s: GameState) {
  return LEVELS.find((l) => !s.progress.map[l.id]) ?? LEVELS[LEVELS.length - 1];
}

export function meetsRank(rank: Rank, s: GameState, mastery = masteryOf(s)): boolean {
  const r = rank.requires;
  const lvl = levelFromXp(s.stats.xp).level;
  if (r.mapLevels && mapLevelsCleared(s) < r.mapLevels) return false;
  if (r.playerLevel && lvl < r.playerLevel) return false;
  if (r.answered && s.stats.answered < r.answered) return false;
  if (r.categoriesAtLeast) {
    const n = MASTERY_CATEGORIES.filter((c) => (mastery[c.id] ?? 0) >= r.categoriesAtLeast!.min).length;
    if (n < r.categoriesAtLeast.count) return false;
  }
  if (r.category && (mastery[r.category.id] ?? 0) < r.category.min) return false;
  if (r.allCategoriesMin !== undefined && MASTERY_CATEGORIES.some((c) => (mastery[c.id] ?? 0) < r.allCategoriesMin!)) return false;
  if (r.finalTestPassed && !s.progress.finalPassed) return false;
  return true;
}

/** Highest rank achieved — ranks must be earned in order. */
export function currentRank(s: GameState, mastery = masteryOf(s)): { rank: Rank; index: number; next?: Rank } {
  let index = 0;
  for (let i = 1; i < RANKS.length; i++) {
    if (meetsRank(RANKS[i], s, mastery)) index = i;
    else break;
  }
  return { rank: RANKS[index], index, next: RANKS[index + 1] };
}

export function finalTestUnlocked(s: GameState, mastery = masteryOf(s)): boolean {
  const idx = RANKS.findIndex((r) => r.id === GAME.licence.requiredRank);
  return currentRank(s, mastery).index >= idx;
}

export function licenceEligible(s: GameState, mastery = masteryOf(s)): boolean {
  return (
    s.progress.finalPassed &&
    finalTestUnlocked(s, mastery) &&
    MASTERY_CATEGORIES.every((c) => (mastery[c.id] ?? 0) >= GAME.licence.requiredCategoryMastery)
  );
}

export function accuracy(s: GameState): number {
  return s.stats.answered ? s.stats.correct / s.stats.answered : 0;
}

// ─── Achievements ───────────────────────────────────────────────
export function achievementProgress(id: string, s: GameState, mastery = masteryOf(s)): { done: boolean; current: number; target: number } {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return { done: false, current: 0, target: 1 };
  const c = a.condition;
  const v = c.value ?? 1;
  const C = s.progress.counters;
  const val = (cur: number, target = v) => ({ done: cur >= target, current: Math.min(cur, target), target });
  const bool = (b: boolean) => ({ done: b, current: b ? 1 : 0, target: 1 });
  switch (c.type) {
    case 'firstDrive': return bool(C.firstDrive > 0);
    case 'answered': return val(s.stats.answered);
    case 'correctTotal': return val(s.stats.correct);
    case 'streak': return val(Math.max(s.stats.bestStreak, s.stats.streak));
    case 'level': return val(levelFromXp(s.stats.xp).level);
    case 'skill': return val(Math.round(s.stats.skill));
    case 'xp': return val(s.stats.xp);
    case 'coinsEarned': return val(s.stats.coinsEarned);
    case 'mapLevel': return bool(!!s.progress.map[c.param!]);
    case 'mapLevelStars': return val(s.progress.map[c.param!]?.stars ?? 0);
    case 'categoryMastery': {
      const m = mastery[c.param!] ?? 0;
      return { done: m >= v - 1e-9, current: Math.round(m * 100), target: Math.round(v * 100) };
    }
    case 'categoryCorrect': return val(C.categoryCorrect[c.param!] ?? 0);
    case 'minigamePerfect': return bool(!!C.minigamePerfect[c.param!]);
    case 'minigamesPlayed': return val(C.minigamesPlayed);
    case 'dailyCompleted': return val(C.dailyCompleted);
    case 'dailyStreak': return val(C.dailyStreak);
    case 'weeklyCompleted': return val(C.weeklyCompleted);
    case 'testsTaken': return val(C.testsTaken);
    case 'testPassed': return bool(C.testPassed > 0);
    case 'finalPassed': return bool(s.progress.finalPassed);
    case 'licence': return bool(!!s.progress.licence);
    case 'carsOwned': return val(s.progress.garage.owned.length);
    case 'customised': return val(C.customised);
    case 'perfectRuns': return val(C.perfectRuns);
    case 'cleanDrives': return val(C.cleanDrives);
    case 'fastAnswers': return val(C.fastAnswers);
    case 'rank': {
      const idx = RANKS.findIndex((r) => r.id === c.param);
      return bool(currentRank(s, mastery).index >= idx);
    }
    // Rank achievements only count against real online leaderboards (not demo data).
    case 'globalRank': return bool(!IS_DEMO && s.ranks.global !== null && s.ranks.global <= v && s.stats.lifetimePoints > 0);
    case 'suburbRank': return bool(!IS_DEMO && s.ranks.suburb !== null && s.ranks.suburb <= v && s.stats.weeklyPoints >= 500);
    default: return { done: false, current: 0, target: 1 };
  }
}

export function newlyEarnedAchievements(s: GameState): string[] {
  const mastery = masteryOf(s);
  return ACHIEVEMENTS.filter((a) => !s.progress.achievements[a.id] && achievementProgress(a.id, s, mastery).done).map((a) => a.id);
}

export function licenceNumber(userId: string): string {
  let h = 0;
  for (const ch of userId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const n = String(h % 100000000).padStart(8, '0');
  return `${GAME.licence.numberPrefix}-${n.slice(0, 4)}-${n.slice(4)}`;
}
