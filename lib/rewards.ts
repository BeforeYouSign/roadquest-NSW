'use client';
// Post-activity reward processing: level-ups, rank-ups, achievement unlocks, toasts.
import { ACHIEVEMENT_MAP } from './config';
import { currentRank, newlyEarnedAchievements } from './progression';
import { levelFromXp, levelTitle } from './scoring';
import { getState, pushToast, unlockAchievements, type GameState } from './store';
import { saveProgress, refreshRanks } from './api';
import { sfx } from './sound';

export function snapshot(): { level: number; rankIndex: number } {
  const s = getState();
  return { level: levelFromXp(s.stats.xp).level, rankIndex: currentRank(s).index };
}

/** Call after any activity that changes progress. Returns newly unlocked achievement ids. */
export function processRewards(before: { level: number; rankIndex: number }, opts: { quiet?: boolean } = {}): string[] {
  const s: GameState = getState();
  const lvl = levelFromXp(s.stats.xp).level;
  const rank = currentRank(s);
  let delay = 0;
  if (lvl > before.level) {
    pushToast({ kind: 'levelup', title: `LEVEL ${lvl}!`, body: `You're now a ${levelTitle(lvl)}. Keep driving!`, icon: 'ArrowUpCircle' });
    if (!opts.quiet) setTimeout(() => sfx.levelUp(), delay);
    delay += 500;
  }
  if (rank.index > before.rankIndex) {
    pushToast({ kind: 'rank', title: `NEW LICENCE RANK: ${rank.rank.name.toUpperCase()}`, body: rank.rank.description, icon: rank.rank.icon });
    if (!opts.quiet) setTimeout(() => sfx.achievement(), delay);
    delay += 500;
  }
  const earned = newlyEarnedAchievements(s);
  if (earned.length) {
    unlockAchievements(earned);
    earned.slice(0, 4).forEach((id, i) => {
      const a = ACHIEVEMENT_MAP[id];
      if (!a) return;
      setTimeout(() => {
        pushToast({ kind: 'achievement', title: a.name, body: a.description, icon: a.icon, rarity: a.rarity });
        if (!opts.quiet) sfx.achievement();
      }, delay + i * 700);
    });
    if (earned.length > 4) pushToast({ kind: 'info', title: `+${earned.length - 4} more achievements`, body: 'Check your profile to see them all.' });
  }
  saveProgress();
  void refreshRanks();
  return earned;
}
