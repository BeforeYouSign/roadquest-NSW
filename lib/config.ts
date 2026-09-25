// Central access to all editable game content in /data.
// Change the JSON files — not this file — to tune the game.
import gameConfig from '@/data/config/game.json';
import ranksJson from '@/data/config/ranks.json';
import levelsJson from '@/data/config/levels.json';
import minigamesJson from '@/data/config/minigames.json';
import categoriesJson from '@/data/categories/categories.json';
import achievementsJson from '@/data/achievements/achievements.json';
import carsJson from '@/data/cars/cars.json';
import cosmeticsJson from '@/data/cars/cosmetics.json';
import type { Achievement, CarDef, Category, MapLevel, MiniGame, Rank } from './types';

export const GAME = gameConfig;
export const RANKS = ranksJson as Rank[];
export const LEVELS = levelsJson as MapLevel[];
export const MINIGAMES = minigamesJson as MiniGame[];
export const CATEGORIES = categoriesJson as Category[];
export const ACHIEVEMENTS = achievementsJson as Achievement[];
export const CARS = carsJson as CarDef[];
export const COSMETICS = cosmeticsJson;

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
export const ACHIEVEMENT_MAP: Record<string, Achievement> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
export const CAR_MAP: Record<string, CarDef> = Object.fromEntries(CARS.map((c) => [c.id, c]));
export const LEVEL_MAP: Record<string, MapLevel> = Object.fromEntries(LEVELS.map((l) => [l.id, l]));
export const MINIGAME_MAP: Record<string, MiniGame> = Object.fromEntries(MINIGAMES.map((m) => [m.id, m]));

/** Categories that count towards mastery / licence progress. */
export const MASTERY_CATEGORIES = CATEGORIES.filter((c) => c.id !== 'test-rules');

export const RARITY_STYLE: Record<string, { label: string; color: string; glow: string }> = {
  common: { label: 'COMMON', color: '#94a3b8', glow: 'rgba(148,163,184,.35)' },
  rare: { label: 'RARE', color: '#38bdf8', glow: 'rgba(56,189,248,.45)' },
  epic: { label: 'EPIC', color: '#a78bfa', glow: 'rgba(167,139,250,.5)' },
  legendary: { label: 'LEGENDARY', color: '#fbbf24', glow: 'rgba(251,191,36,.55)' },
};

export function paintHex(id: string): string {
  return COSMETICS.paints.find((p) => p.id === id)?.hex ?? '#facc15';
}
