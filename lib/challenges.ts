// Turns a list of source questions into playable challenge items for each mechanic.
import type { ChallengeItem } from '@/components/game/QuestionEngine';
import { QUESTIONS } from './questions';
import { shuffle } from './random';
import type { MiniGame, Question } from './types';

const HAZARDY = new Set(['ped', 'child', 'elderly', 'tram', 'gravel', 'refuge', 'building-corner', 'truck', 'swerve', 'queue', 'roadworks-lights']);

export function buildItems(questions: Question[], mechanic: MiniGame['mechanic'] | 'standard' = 'standard'): ChallengeItem[] {
  switch (mechanic) {
    case 'truefalse':
      return questions.map((q) => {
        const showCorrect = Math.random() < 0.5;
        const shown = showCorrect ? q.correctAnswer : shuffle(q.incorrectAnswers)[0];
        return { kind: 'tf', q, shown };
      });
    case 'sign-snap': {
      const signs = questions.filter((q) => q.visualType === 'sign');
      const items: ChallengeItem[] = [];
      const allSigns = QUESTIONS.filter((q) => q.visualType === 'sign');
      let i = 0;
      while (i < signs.length) {
        if (items.length % 2 === 0 && i + 3 <= signs.length) {
          // avoid two identical sign graphics in the same match round
          const group: Question[] = [];
          while (group.length < 3 && i < signs.length) {
            const s = signs[i++];
            if (!group.some((g) => g.visual?.sign === s.visual?.sign)) group.push(s);
          }
          if (group.length === 3) items.push({ kind: 'match', qs: group });
          else group.forEach((q) => items.push({ kind: 'mcq', q }));
        } else {
          const q = signs[i++];
          const others = shuffle(allSigns.filter((s) => s.id !== q.id && s.visual?.sign !== q.visual?.sign)).slice(0, 2);
          items.push({ kind: 'pick-sign', q, choices: [q, ...others] });
        }
      }
      return items;
    }
    case 'sequence':
      return questions.map((q) => (q.visual?.order ? { kind: 'sequence', q } : { kind: 'mcq', q }));
    case 'hazard':
      return questions.map((q) => (q.visualType === 'pov' && (q.visual?.objects ?? []).some((o) => HAZARDY.has(o.type) || o.indicate) ? { kind: 'hazard', q } : { kind: 'mcq', q }));
    default:
      return questions.map((q) => ({ kind: 'mcq', q }));
  }
}

export function itemCount(items: ChallengeItem[]): number {
  return items.reduce((n, it) => n + (it.kind === 'match' ? it.qs.length : 1), 0);
}
