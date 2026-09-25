// Shared TypeScript types for RoadQuest NSW

export type CategoryId =
  | 'general'
  | 'test-rules'
  | 'alcohol-drugs'
  | 'bicycles'
  | 'fatigue-defensive'
  | 'intersections'
  | 'roundabouts'
  | 'traffic-lights'
  | 'traffic-lanes'
  | 'negligent-driving'
  | 'pedestrians'
  | 'seatbelts'
  | 'speed-limits'
  | 'traffic-signs';

export type ChallengeType = 'multiple-choice' | 'sign' | 'traffic-light' | 'hotspot' | 'sequence';
export type VisualKind = 'sign' | 'lights' | 'scene' | 'pov' | 'custom' | 'none';
export type ConsequenceType =
  | 'near-miss'
  | 'police'
  | 'camera'
  | 'emergency-brake'
  | 'parking-fine'
  | 'roadworks'
  | 'tailgate'
  | 'drift'
  | 'hard-stop'
  | 'siren';

// Visual specs are recreated from the source diagrams (see data/questions/README.md)
export type Approach = 'N' | 'S' | 'E' | 'W';
export type Move = 'straight' | 'left' | 'right' | 'uturn';

export interface SceneVehicleSpec {
  label?: string;
  from?: Approach;
  move?: Move;
  lane?: number;
  pos?: number;
  t?: number;
  rot?: number;
  color: string;
  indicate?: 'left' | 'right';
  highlight?: boolean;
  arrow?: boolean;
  ghost?: boolean;
  crash?: boolean;
  reverse?: boolean;
  onRing?: boolean;
  side?: 'out';
}

export interface VisualSpec {
  kind: Exclude<VisualKind, 'none'>;
  // sign
  sign?: string;
  caption?: string;
  caption2?: string;
  // lights
  cols?: string[][];
  // scene
  layout?: 'cross' | 't' | 't-west' | 'road-v' | 'road-h' | 'roundabout' | 'merge';
  lanesPerArm?: number;
  controls?: Partial<Record<Approach, string>>;
  vehicles?: SceneVehicleSpec[];
  pedestrians?: { x?: number; y?: number; lane?: number; t?: number; kind?: string }[];
  zebraArms?: Approach[];
  labels?: { text: string; x: number; y: number }[];
  laneMarks?: Partial<Record<Approach, string[]>>;
  hotspots?: { id: string; lane?: number; arm?: Approach; x?: number; y?: number; w?: number; h?: number }[];
  order?: string[];
  points?: { label: string; arm?: Approach; at?: string; angle?: number }[];
  exitArrow?: Approach;
  lanes?: { dir: string; mark?: string }[];
  lines?: string[];
  arrows?: { d: string; dashed?: boolean; color?: string }[];
  measures?: { x1: number; y1: number; x2: number; y2: number; label: string }[];
  driveways?: { t: number; side: 'top' | 'bottom'; label: string; street?: boolean }[];
  moves?: string[];
  zebra?: { t: number }[];
  zigzag?: boolean;
  signs?: { id: string; side: 'left' | 'right'; t: number }[];
  crash?: { x: number; y: number };
  edgeLine?: boolean;
  // pov
  road?: string;
  env?: 'day' | 'night' | 'wet';
  lanesOurs?: number;
  laneLine?: string;
  centre?: string;
  objects?: PovObject[];
  junction?: 'left' | 'right' | 'cross';
  country?: boolean;
  city?: boolean;
  headlights?: string;
  highlight?: { lane: number; d: number };
  pedestriansFlag?: boolean;
  // custom
  name?: string;
  supervisor?: boolean;
}

export interface PovObject {
  type: string;
  lane?: number;
  d?: number;
  d0?: number;
  d1?: number;
  side?: 'left' | 'right';
  color?: string;
  oncoming?: boolean;
  lights?: string;
  state?: string;
  vehicle?: string;
  indicate?: 'left' | 'right';
  highlight?: boolean;
  label?: string;
}

export interface Question {
  id: string;
  sourceCode: string;
  category: CategoryId;
  sourceCategory: string;
  section: string;
  subcategory: string;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  explanation: string;
  challengeType: ChallengeType;
  difficulty: 1 | 2 | 3;
  visualType: VisualKind;
  visual: VisualSpec | null;
  consequence: ConsequenceType;
  tags: string[];
  sourcePage: number;
  status: 'active' | 'review' | 'excluded';
  reviewNote?: string;
}

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  icon: string;
  color: string;
  sourceCodes: string[];
  whyItMatters: string;
}

export type GameMode =
  | 'journey'
  | 'quick'
  | 'practice'
  | 'minigame'
  | 'daily'
  | 'weekly'
  | 'test'
  | 'final'
  | 'drive'
  | 'onboarding';

/** A single answer the player gave — sent to the server for grading. */
export interface AnswerPayload {
  qid: string;
  kind: 'option' | 'tf' | 'pick';
  value: string; // chosen option text | 'true'/'false' | chosen question id
  shown?: string; // for 'tf': the statement option that was shown
  ms: number;
}

export interface GradedAnswer {
  qid: string;
  correct: boolean;
  xp: number;
  points: number;
  skillDelta: number;
  fast: boolean;
}

export interface SessionResult {
  mode: GameMode;
  graded: GradedAnswer[];
  correctCount: number;
  total: number;
  xp: number;
  coins: number;
  points: number;
  skillBefore: number;
  skillAfter: number;
  streakAfter: number;
  bestStreakInRun: number;
  perfect: boolean;
  bonuses: { label: string; xp: number; coins?: number }[];
  ranked: boolean;
  score: number; // challenge score for daily/weekly/test
  passed?: boolean;
  sectionScores?: { id: string; label: string; correct: number; total: number; passMark: number; passed: boolean }[];
}

export interface Rank {
  id: string;
  name: string;
  icon: string;
  description: string;
  requires: {
    mapLevels?: number;
    playerLevel?: number;
    answered?: number;
    categoriesAtLeast?: { count: number; min: number };
    category?: { id: CategoryId; min: number };
    allCategoriesMin?: number;
    finalTestPassed?: boolean;
  };
}

export interface MapLevel {
  id: string;
  num: number;
  name: string;
  blurb: string;
  icon: string;
  theme: { scenery: string; env: 'day' | 'night' | 'wet'; lanes: number; speedLimit: number; grass: string };
  pool: QuestionPool;
  events: string[];
  questions: number;
  map: { x: number; y: number };
}

export interface QuestionPool {
  all?: boolean;
  categories?: string[];
  tags?: string[];
  codes?: string[];
  challengeTypes?: string[];
  visualTypes?: string[];
  minDifficulty?: number;
  maxDifficulty?: number;
}

export interface MiniGame {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  mechanic: 'mcq' | 'sequence' | 'hazard' | 'sign-snap' | 'truefalse' | 'timed';
  pool: QuestionPool;
  count: number;
  timerSec?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  condition: { type: string; value?: number; param?: string };
}

export interface CarDef {
  id: string;
  name: string;
  class: string;
  body: 'hatch' | 'sedan' | 'suv' | 'wagon' | 'ute' | 'van' | 'sporthatch' | 'sports' | 'prestige';
  price: number;
  starter?: boolean;
  levelRequired?: number;
  achievement?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  paint: string;
  stats: { style: number; vibe: number };
}

export interface CarCustom {
  paint: string;
  wheels: string;
  roof: string;
  decal: string;
  plate: string;
  plateText: string;
  lplate: string;
  interior: string;
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  suburb: string;
  level: number;
  score: number;
  isMe?: boolean;
  carColor?: string;
}

export interface SuburbRow {
  rank: number;
  suburb: string;
  activePlayers: number;
  totalXp: number;
  avgSkill: number;
  weeklyPoints: number;
  championshipScore: number;
  official: boolean;
}
