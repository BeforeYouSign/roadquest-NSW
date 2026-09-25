// Question bank access + selection logic (shared by browser and server).
import questionsJson from '@/data/questions/questions.json';
import { CATEGORIES, GAME, MASTERY_CATEGORIES } from './config';
import { seededRng, shuffle, weightedSample } from './random';
import type { CategoryId, MapLevel, MiniGame, Question, QuestionPool } from './types';

export const ALL_QUESTIONS = questionsJson as unknown as Question[];
export const QUESTIONS = ALL_QUESTIONS.filter((q) => q.status !== 'excluded');
export const QUESTION_MAP: Record<string, Question> = Object.fromEntries(ALL_QUESTIONS.map((q) => [q.id, q]));

export interface QStat {
  seen: number;
  correct: number;
  wrong: number;
  box: number; // Leitner box 0..3 (spaced repetition)
  last: number; // timestamp
}
export type QStats = Record<string, QStat>;

export function byCategory(cat: CategoryId | string): Question[] {
  return QUESTIONS.filter((q) => q.category === cat);
}

export function inPool(q: Question, pool: QuestionPool): boolean {
  if (pool.minDifficulty && q.difficulty < pool.minDifficulty) return false;
  if (pool.maxDifficulty && q.difficulty > pool.maxDifficulty) return false;
  if (pool.all) return true;
  const code = q.sourceCode;
  if (pool.codes?.includes(code)) return true;
  if (pool.categories?.includes(q.category)) return true;
  if (pool.tags?.some((t) => q.tags.includes(t))) return true;
  if (pool.challengeTypes?.includes(q.challengeType)) return true;
  if (pool.visualTypes?.includes(q.visualType)) return true;
  return false;
}

export function poolQuestions(pool: QuestionPool): Question[] {
  return QUESTIONS.filter((q) => inPool(q, pool));
}

// ─── Mastery (spaced repetition) ────────────────────────────────
export function questionMastery(stat?: QStat): number {
  if (!stat) return 0;
  const v = GAME.mastery.boxValue;
  return v[Math.min(stat.box, v.length - 1)] ?? 0;
}

export function categoryMastery(cat: string, stats: QStats): number {
  const qs = byCategory(cat);
  if (!qs.length) return 0;
  return qs.reduce((s, q) => s + questionMastery(stats[q.id]), 0) / qs.length;
}

export function allMastery(stats: QStats): Record<string, number> {
  return Object.fromEntries(CATEGORIES.map((c) => [c.id, categoryMastery(c.id, stats)]));
}

export function isDue(stat: QStat | undefined, now = Date.now()): boolean {
  if (!stat) return true;
  const days = GAME.mastery.reviewIntervalsDays[Math.min(stat.box, 3)] ?? 7;
  return now - stat.last >= days * 86400000;
}

/** Weight used when picking learning questions: weak categories, mistakes, unseen and due items come up more often. */
export function learningWeight(q: Question, stats: QStats, mastery: Record<string, number>, now = Date.now()): number {
  const st = stats[q.id];
  let w = 1;
  const catM = mastery[q.category] ?? 0;
  w *= 1 + (1 - catM) * 2; // weak categories x3 at most
  if (!st) w *= 1.6; // unseen
  else {
    if (st.box === 0 && st.wrong > 0) w *= 3.2; // recent mistake
    if (isDue(st, now)) w *= 2;
    else w *= 0.25;
    if (now - st.last < 10 * 60 * 1000) w *= 0.1; // just seen
  }
  return w;
}

export function pickLearning(pool: Question[], n: number, stats: QStats, rng: () => number = Math.random): Question[] {
  const mastery = allMastery(stats);
  return weightedSample(pool, (q) => learningWeight(q, stats, mastery), Math.min(n, pool.length), rng);
}

export function smartPractice(stats: QStats, n = GAME.practice.count): { questions: Question[]; focus: string[] } {
  const mastery = allMastery(stats);
  const weakest = MASTERY_CATEGORIES.map((c) => ({ id: c.id, m: mastery[c.id] ?? 0 }))
    .sort((a, b) => a.m - b.m)
    .slice(0, 3)
    .map((c) => c.id);
  const now = Date.now();
  const qs = weightedSample(
    QUESTIONS,
    (q) => {
      let w = learningWeight(q, stats, mastery, now);
      if (weakest.includes(q.category)) w *= 2.5;
      return w;
    },
    n,
  );
  return { questions: qs, focus: weakest };
}

export function levelQuestions(level: MapLevel, stats: QStats): Question[] {
  let pool = poolQuestions(level.pool);
  if (pool.length < level.questions) pool = QUESTIONS;
  return pickLearning(pool, level.questions, stats);
}

export function minigameQuestions(game: MiniGame, stats: QStats, count = game.count): Question[] {
  let pool = poolQuestions(game.pool);
  if (game.mechanic === 'sequence') {
    const seq = pool.filter((q) => q.challengeType === 'sequence');
    const rest = pool.filter((q) => q.challengeType !== 'sequence' && q.visual);
    return [...shuffle(seq), ...pickLearning(rest, Math.max(0, count - seq.length), stats)].slice(0, count);
  }
  if (game.mechanic === 'sign-snap') pool = pool.filter((q) => q.visualType === 'sign');
  if (pool.length === 0) pool = QUESTIONS;
  return pickLearning(pool, count, stats);
}

export function quickDrive(stats: QStats, n = GAME.quick.count): Question[] {
  return pickLearning(QUESTIONS.filter((q) => q.category !== 'test-rules'), n, stats);
}

// ─── Shared challenges (identical for every player) ─────────────
export function dailyChallengeIds(day: string): string[] {
  const rng = seededRng('daily:' + day);
  const cfg = GAME.daily;
  const order = shuffle(QUESTIONS.filter((q) => q.category !== 'test-rules'), rng);
  const picked: Question[] = [];
  const perCat: Record<string, number> = {};
  const hard = order.filter((q) => q.difficulty >= 2);
  for (const q of hard) {
    if (picked.length >= cfg.minHard) break;
    if ((perCat[q.category] ?? 0) >= cfg.maxPerCategory) continue;
    picked.push(q);
    perCat[q.category] = (perCat[q.category] ?? 0) + 1;
  }
  for (const q of order) {
    if (picked.length >= cfg.count) break;
    if (picked.includes(q) || (perCat[q.category] ?? 0) >= cfg.maxPerCategory) continue;
    picked.push(q);
    perCat[q.category] = (perCat[q.category] ?? 0) + 1;
  }
  return shuffle(picked, rng).map((q) => q.id);
}

export function weeklyChallengeIds(week: string): string[] {
  const rng = seededRng('weekly:' + week);
  const cfg = GAME.weekly;
  const hard = shuffle(QUESTIONS.filter((q) => q.difficulty >= cfg.minDifficulty && q.category !== 'test-rules'), rng);
  const easy = shuffle(QUESTIONS.filter((q) => q.difficulty < cfg.minDifficulty && q.category !== 'test-rules'), rng);
  const nHard = Math.min(hard.length, Math.round(cfg.count * 0.75));
  return shuffle([...hard.slice(0, nHard), ...easy.slice(0, cfg.count - nHard)], rng).map((q) => q.id);
}

/** Practice/final test: questions drawn per section, mirroring the configured test format. */
export function testQuestionIds(seed?: string): string[] {
  const rng = seed ? seededRng('test:' + seed) : Math.random;
  const ids: string[] = [];
  for (const sec of GAME.test.sections) {
    const pool = QUESTIONS.filter((q) => sec.sourceSections.includes(q.section) && q.category !== 'test-rules');
    ids.push(...shuffle(pool, rng).slice(0, sec.count).map((q) => q.id));
  }
  return ids;
}

export function testSectionFor(q: Question): string {
  return GAME.test.sections.find((s) => s.sourceSections.includes(q.section))?.id ?? GAME.test.sections[0].id;
}

// ─── Presentation helpers ───────────────────────────────────────
/** Answer order is ALWAYS randomised — source data order is never shown. */
export function shuffledOptions(q: Question, rng: () => number = Math.random): string[] {
  return shuffle([q.correctAnswer, ...q.incorrectAnswers], rng);
}

export function isCorrectOption(q: Question, value: string): boolean {
  return q.correctAnswer.trim() === value.trim();
}

/** Match an option like "Vehicle P." / "Lane A." / "B" to a scene label. */
export function optionLabel(option: string): string | null {
  const m = option.match(/^(?:Vehicle|Car|Lane|Mirror|Position)?\s*([A-Z])\b\.?/);
  if (!m) return null;
  if (option.length > 14 && !option.startsWith('Position')) return null;
  return m[1];
}
