import { weekId } from '@/lib/time';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function statsFromRow(row: any, weekly: number) {
  return {
    xp: Number(row.xp),
    coins: Number(row.coins),
    coinsEarned: Number(row.coins_earned),
    skill: Number(row.skill_rating),
    weeklyPoints: Number(weekly),
    weekId: weekId(),
    lifetimePoints: Number(row.lifetime_points),
    answered: Number(row.questions_answered),
    correct: Number(row.questions_correct),
    streak: Number(row.current_streak),
    bestStreak: Number(row.best_streak),
  };
}
