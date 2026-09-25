// XP, level, skill rating and competition-point maths.
// Pure functions: used by the browser (demo mode + instant feedback) AND by
// the server routes (authoritative grading in online mode).
import { GAME } from './config';
import { QUESTION_MAP, isCorrectOption, testSectionFor } from './questions';
import type { AnswerPayload, GameMode, GradedAnswer, SessionResult } from './types';

// ─── Levels ─────────────────────────────────────────────────────
export function xpToNext(level: number): number {
  return GAME.levels.baseXp + GAME.levels.stepXp * (level - 1);
}

export function levelFromXp(xp: number): { level: number; into: number; needed: number; progress: number } {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  while (remaining >= xpToNext(level)) {
    remaining -= xpToNext(level);
    level++;
    if (level > 10000) break;
  }
  const needed = xpToNext(level);
  return { level, into: remaining, needed, progress: remaining / needed };
}

export function levelTitle(level: number): string {
  let t = GAME.levels.titles[0].title;
  for (const row of GAME.levels.titles) if (level >= row.from) t = row.title;
  return t;
}

export function skillTier(rating: number): { name: string; color: string; next?: number } {
  const tiers = GAME.skill.tiers;
  let idx = 0;
  tiers.forEach((t, i) => {
    if (rating >= t.min) idx = i;
  });
  return { name: tiers[idx].name, color: tiers[idx].color, next: tiers[idx + 1]?.min };
}

// ─── Grading ────────────────────────────────────────────────────
export function gradeAnswer(p: AnswerPayload): boolean {
  const q = QUESTION_MAP[p.qid];
  if (!q) return false;
  if (p.kind === 'option') return isCorrectOption(q, p.value);
  if (p.kind === 'tf') {
    if (!p.shown) return false;
    const shownIsCorrect = isCorrectOption(q, p.shown);
    const isValidOption = shownIsCorrect || q.incorrectAnswers.some((o) => o.trim() === p.shown!.trim());
    if (!isValidOption) return false;
    return (p.value === 'true') === shownIsCorrect;
  }
  if (p.kind === 'pick') return p.value === q.id;
  return false;
}

export interface PlayerContext {
  skill: number;
  answeredTotal: number;
  streak: number;
  /** qid → last attempt time (ms) — used for the skill cooldown so easy questions can't be farmed */
  recent: Record<string, number>;
  /** competition points already earned today from non-ranked modes */
  nonRankedPointsToday: number;
  now: number;
}

export function computeSession(mode: GameMode, answers: AnswerPayload[], ctx: PlayerContext, opts: { firstDailyAttempt?: boolean; firstWeeklyAttempt?: boolean; firstOnboarding?: boolean } = {}): SessionResult {
  const X = GAME.xp;
  const S = GAME.skill;
  const P = GAME.points;
  const skillMult = (S.modeMultiplier as Record<string, number>)[mode] ?? 0.5;
  const pointMult = (P.modeMultiplier as Record<string, number>)[mode] ?? 0.1;
  const rankedMode = mode === 'daily' ? !!opts.firstDailyAttempt : mode === 'weekly' ? !!opts.firstWeeklyAttempt : false;
  const competitiveMode = (P.rankedModes as string[]).includes(mode);

  let skill = ctx.skill;
  let streak = ctx.streak;
  let bestStreakInRun = 0;
  let xp = 0;
  let coins = 0;
  let points = 0;
  let score = 0;
  const bonuses: SessionResult['bonuses'] = [];
  const graded: GradedAnswer[] = [];
  let answered = ctx.answeredTotal;

  for (const a of answers) {
    const q = QUESTION_MAP[a.qid];
    if (!q) continue;
    const correct = gradeAnswer(a);
    const fast = correct && a.ms <= X.fastThresholdMs;
    let qxp = 0;
    let qpts = 0;
    if (correct) {
      qxp = q.difficulty >= X.hardFromDifficulty ? X.correctHard : X.correctStandard;
      if (fast) qxp += X.fastBonus;
      coins += GAME.coins.perCorrect;
      streak++;
      bestStreakInRun = Math.max(bestStreakInRun, streak);
      if (streak > 0 && streak % 10 === 0) {
        qxp += X.streak10;
        bonuses.push({ label: `${streak} streak!`, xp: X.streak10 });
      } else if (streak > 0 && streak % 5 === 0) {
        qxp += X.streak5;
        bonuses.push({ label: `${streak} streak!`, xp: X.streak5 });
      }
      const base = (P.perCorrectByDifficulty as Record<string, number>)[String(q.difficulty)] ?? 10;
      const speed = Math.max(0, Math.round(P.speedBonusMax * (1 - Math.min(1, a.ms / 15000))));
      qpts = base + speed;
      score += base + speed;
    } else {
      streak = 0;
    }

    // Elo-style skill: harder questions matter more; easy wins barely move a strong player.
    let dSkill = 0;
    const last = ctx.recent[q.id];
    const onCooldown = last !== undefined && ctx.now - last < S.repeatCooldownHours * 3600000;
    if (!onCooldown && skillMult > 0) {
      const qr = (S.questionRating as Record<string, number>)[String(q.difficulty)] ?? 1200;
      const expected = 1 / (1 + Math.pow(10, (qr - skill) / 400));
      const k = (answered < S.settledAfter ? S.kNew : S.kSettled) * skillMult * (fast ? S.fastMultiplier : 1);
      dSkill = k * ((correct ? 1 : 0) - expected);
      skill = Math.max(S.floor, skill + dSkill);
    }
    answered++;
    xp += qxp;
    graded.push({ qid: q.id, correct, xp: qxp, points: qpts, skillDelta: Math.round(dSkill * 10) / 10, fast });
  }

  const correctCount = graded.filter((g) => g.correct).length;
  const perfect = graded.length >= 3 && correctCount === graded.length;
  if (perfect && mode !== 'test' && mode !== 'final') {
    xp += X.perfectRound;
    coins += GAME.coins.perfectRound;
    score += P.perfectRound;
    bonuses.push({ label: 'Perfect round', xp: X.perfectRound, coins: GAME.coins.perfectRound });
  }
  if (mode === 'daily' && rankedMode && graded.length) {
    xp += X.dailyChallenge;
    coins += GAME.coins.dailyChallenge;
    bonuses.push({ label: 'Daily challenge', xp: X.dailyChallenge, coins: GAME.coins.dailyChallenge });
  }
  if (mode === 'weekly' && rankedMode && graded.length) {
    xp += X.weeklyChallenge;
    coins += GAME.coins.weeklyChallenge;
    bonuses.push({ label: 'Weekly challenge', xp: X.weeklyChallenge, coins: GAME.coins.weeklyChallenge });
  }

  if (mode === 'journey' && graded.length && correctCount / graded.length >= 0.6) {
    xp += X.levelComplete;
    coins += GAME.coins.levelComplete;
    bonuses.push({ label: 'Location cleared', xp: X.levelComplete, coins: GAME.coins.levelComplete });
  }
  if (mode === 'onboarding' && opts.firstOnboarding) {
    xp += X.firstDrive;
    coins += GAME.coins.firstDrive;
    bonuses.push({ label: 'First drive!', xp: X.firstDrive, coins: GAME.coins.firstDrive });
  }

  // Test sections
  let passed: boolean | undefined;
  let sectionScores: SessionResult['sectionScores'];
  if (mode === 'test' || mode === 'final') {
    sectionScores = GAME.test.sections.map((sec) => {
      const inSec = graded.filter((g) => testSectionFor(QUESTION_MAP[g.qid]) === sec.id);
      const c = inSec.filter((g) => g.correct).length;
      return { id: sec.id, label: sec.label, correct: c, total: inSec.length, passMark: sec.passMark, passed: c >= sec.passMark };
    });
    const expectedTotal = GAME.test.sections.reduce((s, x) => s + x.count, 0);
    passed = graded.length >= expectedTotal && sectionScores.every((s) => s.passed);
    xp += X.practiceTestComplete;
    bonuses.push({ label: 'Test complete', xp: X.practiceTestComplete });
    if (mode === 'final' && passed) {
      xp += X.finalTestPass;
      coins += GAME.coins.finalTestPass;
      bonuses.push({ label: 'Ultimate test passed!', xp: X.finalTestPass, coins: GAME.coins.finalTestPass });
    }
  }

  // Competition points
  const rawPoints = graded.reduce((s, g) => s + g.points, 0) + (perfect ? P.perfectRound : 0);
  if (competitiveMode) {
    points = rankedMode ? rawPoints : Math.round(rawPoints * 0.1);
  } else {
    points = Math.round(rawPoints * pointMult);
    const room = Math.max(0, P.nonRankedDailyCap - ctx.nonRankedPointsToday);
    points = Math.min(points, room);
  }

  return {
    mode,
    graded,
    correctCount,
    total: graded.length,
    xp,
    coins,
    points,
    skillBefore: Math.round(ctx.skill),
    skillAfter: Math.round(skill),
    streakAfter: streak,
    bestStreakInRun,
    perfect,
    bonuses,
    ranked: rankedMode,
    score,
    passed,
    sectionScores,
  };
}
