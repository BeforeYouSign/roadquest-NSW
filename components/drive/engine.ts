// Pure game-state logic for the top-down driving simulator (no React).
import type { MapLevel } from '@/lib/types';

export const LW = 58; // lane width (logical px)
export const WORLD_W = 360;
export const KMH_TO_UNITS = 2.3; // world units per second per km/h

export type EventType = 'speed' | 'school' | 'lights' | 'crossing' | 'giveway' | 'stop' | 'merge' | 'tailgate' | 'railway' | 'checkpoint' | 'tutorial-gas' | 'tutorial-lane';

export interface GameEvent {
  id: number;
  type: EventType;
  at: number;
  len: number;
  limit?: number;
  done: boolean;
  triggered: boolean;
  // runtime
  light?: 'green' | 'yellow' | 'red';
  lightT?: number;
  pedX?: number; // 0..1 across road
  pedActive?: boolean;
  crossX?: number; // cross traffic x (logical px)
  crossActive?: boolean;
  carD?: number; // tailgate car distance
  carLane?: number;
  carSpeed?: number;
  flashing?: boolean;
  trainX?: number;
  stopped?: boolean; // player came to a stop in the zone
  qIndex?: number;
}

export interface Violation {
  kind: 'speeding' | 'red-light' | 'pedestrian' | 'giveway' | 'stop-sign' | 'roadworks' | 'tailgate' | 'railway' | 'no-signal';
  code: string; // source question explaining the rule
  consequence: 'police' | 'camera' | 'emergency-brake' | 'near-miss' | 'roadworks' | 'tailgate';
  happened: string;
}

export const VIOLATIONS: Record<Violation['kind'], Violation> = {
  speeding: { kind: 'speeding', code: 'SL007', consequence: 'police', happened: 'You drove faster than the speed limit.' },
  'red-light': { kind: 'red-light', code: 'TL002', consequence: 'camera', happened: 'You drove past the stop line on a red light.' },
  pedestrian: { kind: 'pedestrian', code: 'PD001', consequence: 'emergency-brake', happened: 'You drove onto the crossing while a pedestrian was using it.' },
  giveway: { kind: 'giveway', code: 'SI052', consequence: 'near-miss', happened: 'You entered the intersection in front of another vehicle at a GIVE WAY sign.' },
  'stop-sign': { kind: 'stop-sign', code: 'SI051', consequence: 'police', happened: 'You rolled through a STOP sign without stopping.' },
  roadworks: { kind: 'roadworks', code: 'CG119', consequence: 'roadworks', happened: 'You stayed in the closed lane at the road works.' },
  tailgate: { kind: 'tailgate', code: 'FD001', consequence: 'tailgate', happened: 'You followed the car ahead far too closely.' },
  railway: { kind: 'railway', code: 'SI027', consequence: 'near-miss', happened: 'You crossed the railway line while the red lights were flashing.' },
  'no-signal': { kind: 'no-signal', code: 'LD013', consequence: 'near-miss', happened: 'You changed lanes without using your indicator.' },
};

export interface Player {
  d: number; // distance travelled
  lane: number; // target lane (0 = kerb lane)
  x: number; // current x
  speed: number; // km/h
  indicator: 'left' | 'right' | null;
  laneChangeFrom: number | null;
}

export interface World {
  events: GameEvent[];
  length: number;
  lanes: number;
  oncoming: number;
  roadLeft: number;
  baseLimit: number;
  limit: number;
  overSpeedT: number;
  tailT: number;
  oncomingCars: { d: number; lane: number; color: string }[];
}

export function laneX(w: World, lane: number): number {
  return w.roadLeft + LW * (lane + 0.5);
}

export function buildWorld(level: Pick<MapLevel, 'theme' | 'events'>, questionCount: number, tutorial = false): World {
  const lanes = Math.max(1, Math.min(3, level.theme.lanes));
  const oncoming = lanes === 3 ? 0 : 1;
  const roadW = (lanes + oncoming) * LW;
  const roadLeft = (WORLD_W - roadW) / 2;
  // interleave hazards with question checkpoints
  const hazards = level.events.filter((e) => e !== 'checkpoint');
  const seq: string[] = [];
  const cps = Math.max(0, questionCount);
  const slots = hazards.length + cps;
  let h = 0;
  let c = 0;
  for (let i = 0; i < slots; i++) {
    const wantCp = c < cps && (h >= hazards.length || (i + 1) * cps / slots > c + 0.5);
    if (wantCp) {
      seq.push('checkpoint');
      c++;
    } else if (h < hazards.length) seq.push(hazards[h++]);
  }
  const events: GameEvent[] = [];
  let at = tutorial ? 350 : 500;
  let id = 0;
  let q = 0;
  for (const raw of seq) {
    const [type, arg] = raw.split(':');
    let t = type as EventType;
    if (t === 'merge' && lanes < 2) t = 'speed';
    const ev: GameEvent = { id: id++, type: t, at, len: 0, done: false, triggered: false };
    switch (t) {
      case 'speed':
        ev.limit = arg ? Number(arg) : type === 'merge' ? 40 : level.theme.speedLimit;
        ev.len = 700;
        break;
      case 'school':
        ev.limit = Number(arg || 40);
        ev.len = 1300;
        break;
      case 'lights':
        ev.light = 'green';
        ev.lightT = 0;
        ev.len = 700;
        break;
      case 'crossing':
        ev.pedX = -0.15;
        ev.len = 650;
        break;
      case 'giveway':
      case 'stop':
        ev.crossX = WORLD_W + 60;
        ev.len = 700;
        break;
      case 'merge':
        ev.len = 1300;
        break;
      case 'tailgate':
        ev.carD = at;
        ev.carLane = 0;
        ev.len = 1600;
        break;
      case 'railway':
        ev.flashing = false;
        ev.trainX = -260;
        ev.len = 750;
        break;
      case 'checkpoint':
        ev.qIndex = q++;
        ev.len = 380;
        break;
      case 'tutorial-gas':
      case 'tutorial-lane':
        ev.len = 600;
        break;
    }
    events.push(ev);
    at += ev.len;
  }
  const oncomingCars = Array.from({ length: 30 }, (_, i) => ({ d: 400 + i * 420 + (i % 3) * 90, lane: 0, color: ['#e2e8f0', '#ef4444', '#2563eb', '#f59e0b', '#16a34a', '#94a3b8'][i % 6] }));
  return { events, length: at + 500, lanes, oncoming, roadLeft, baseLimit: level.theme.speedLimit, limit: level.theme.speedLimit, overSpeedT: 0, tailT: 0, oncomingCars };
}

/** Advance simulation. Returns an event needing attention (checkpoint/violation/finish). */
export function step(
  w: World,
  p: Player,
  dt: number,
  input: { gas: boolean; brake: boolean },
  maxSpeed: number,
): { violation?: Violation; checkpoint?: GameEvent; finished?: boolean; indicatorOff?: boolean } {
  // speed
  if (input.brake) p.speed = Math.max(0, p.speed - 75 * dt);
  else if (input.gas) p.speed = Math.min(maxSpeed, p.speed + (p.speed < 40 ? 34 : 20) * dt);
  else p.speed = Math.max(0, p.speed - 5 * dt);
  const prevD = p.d;
  p.d += p.speed * KMH_TO_UNITS * dt;
  // steering (smooth)
  const tx = laneX(w, p.lane);
  p.x += (tx - p.x) * Math.min(1, dt * 6);
  let indicatorOff = false;
  if (p.laneChangeFrom !== null && Math.abs(tx - p.x) < 2) {
    p.laneChangeFrom = null;
    if (p.indicator) {
      p.indicator = null;
      indicatorOff = true;
    }
  }
  // oncoming ambient traffic
  for (const c of w.oncomingCars) {
    c.d -= 60 * KMH_TO_UNITS * dt;
    if (c.d < p.d - 500) c.d += w.oncomingCars.length * 420;
  }

  for (const ev of w.events) {
    const rel = ev.at - p.d; // distance ahead of player to event line
    if (ev.done) continue;
    switch (ev.type) {
      case 'speed':
        if (!ev.triggered && rel <= 0) {
          ev.triggered = true;
          w.limit = ev.limit ?? w.baseLimit;
          ev.done = true;
        }
        break;
      case 'school':
        if (!ev.triggered && rel <= 0) {
          ev.triggered = true;
          w.limit = ev.limit ?? 40;
        }
        if (ev.triggered && p.d > ev.at + ev.len - 150) {
          w.limit = w.baseLimit;
          ev.done = true;
        }
        break;
      case 'lights': {
        ev.lightT = (ev.lightT ?? 0) + dt;
        if (ev.light === 'green' && rel < 330 && rel > 0) {
          ev.light = 'yellow';
          ev.lightT = 0;
        } else if (ev.light === 'yellow' && (ev.lightT ?? 0) > 2.4) {
          ev.light = 'red';
          ev.lightT = 0;
        } else if (ev.light === 'red' && (ev.lightT ?? 0) > 5.5) {
          ev.light = 'green';
          ev.lightT = 0;
        }
        if (prevD < ev.at && p.d >= ev.at) {
          ev.done = true;
          if (ev.light === 'red') return { violation: VIOLATIONS['red-light'] };
        }
        break;
      }
      case 'crossing': {
        if (!ev.pedActive && rel < 300) ev.pedActive = true;
        if (ev.pedActive && (ev.pedX ?? 0) < 1.15) ev.pedX = (ev.pedX ?? 0) + dt * 0.24;
        const pedOn = (ev.pedX ?? 0) > -0.05 && (ev.pedX ?? 0) < 1.05;
        if (prevD < ev.at - 14 && p.d >= ev.at - 14) {
          ev.done = true;
          if (pedOn) return { violation: VIOLATIONS.pedestrian };
        }
        break;
      }
      case 'giveway':
      case 'stop': {
        if (rel < 320 && !ev.crossActive && ev.crossX! > WORLD_W) ev.crossActive = true;
        if (ev.crossActive) ev.crossX = (ev.crossX ?? WORLD_W) - dt * 150;
        if (ev.type === 'stop' && rel < 70 && rel > -5 && p.speed < 1.5) ev.stopped = true;
        if (prevD < ev.at && p.d >= ev.at) {
          ev.done = true;
          if (ev.type === 'stop' && !ev.stopped) return { violation: VIOLATIONS['stop-sign'] };
          const cx = ev.crossX ?? -999;
          if (cx > w.roadLeft - 80 && cx < w.roadLeft + (w.lanes + w.oncoming) * LW + 80) return { violation: VIOLATIONS.giveway };
        }
        break;
      }
      case 'merge': {
        if (p.d > ev.at && p.d < ev.at + ev.len - 200 && p.lane === 0 && !ev.triggered) {
          ev.triggered = true;
          return { violation: VIOLATIONS.roadworks };
        }
        if (p.d > ev.at + ev.len) ev.done = true;
        break;
      }
      case 'tailgate': {
        const carSpeed = Math.max(30, w.limit * 0.65);
        ev.carSpeed = carSpeed;
        if (p.d > ev.at - 700) ev.carD = (ev.carD ?? ev.at) + carSpeed * KMH_TO_UNITS * dt;
        const gapUnits = (ev.carD ?? 0) - p.d - 40;
        const sameLane = p.lane === ev.carLane;
        if (sameLane && gapUnits < 0) {
          ev.done = true;
          p.speed = Math.min(p.speed, carSpeed * 0.5);
          return { violation: VIOLATIONS.tailgate };
        }
        if (sameLane && p.speed > 5) {
          const gapSec = gapUnits / (p.speed * KMH_TO_UNITS);
          if (gapSec < 1.1) w.tailT += dt;
          else w.tailT = Math.max(0, w.tailT - dt);
          if (w.tailT > 2) {
            w.tailT = 0;
            ev.done = true;
            return { violation: VIOLATIONS.tailgate };
          }
        }
        if ((ev.carD ?? 0) > ev.at + ev.len) ev.done = true;
        break;
      }
      case 'railway': {
        if (!ev.flashing && rel < 360 && rel > 0 && (ev.trainX ?? 0) < 0) ev.flashing = true;
        if (ev.flashing) {
          ev.trainX = (ev.trainX ?? -260) + dt * 170;
          if ((ev.trainX ?? 0) > WORLD_W + 300) ev.flashing = false;
        }
        if (prevD < ev.at && p.d >= ev.at) {
          ev.done = true;
          if (ev.flashing) return { violation: VIOLATIONS.railway };
        }
        break;
      }
      case 'checkpoint':
        if (rel <= 0) {
          ev.done = true;
          return { checkpoint: ev };
        }
        break;
      default:
        if (rel <= -ev.len * 0.5) ev.done = true;
    }
  }
  // speeding (small tolerance; must persist a moment)
  if (p.speed > w.limit + 4) w.overSpeedT += dt;
  else w.overSpeedT = Math.max(0, w.overSpeedT - dt * 2);
  if (w.overSpeedT > 1.6) {
    w.overSpeedT = 0;
    p.speed = w.limit - 5;
    return { violation: w.limit <= 40 ? { ...VIOLATIONS.speeding, code: 'SL032', happened: 'You drove faster than the reduced speed limit.' } : VIOLATIONS.speeding };
  }
  if (p.d >= w.length) return { finished: true, indicatorOff };
  return { indicatorOff };
}

export function currentObjective(w: World, p: Player): string {
  const next = w.events.find((e) => !e.done && e.at + 30 > p.d);
  if (!next) return 'Cruise to the finish line';
  const dist = next.at - p.d;
  const far = dist > 520;
  switch (next.type) {
    case 'tutorial-gas':
      return 'Hold GAS (↑ / W) to drive forward';
    case 'tutorial-lane':
      return w.lanes > 1 ? 'Indicate RIGHT (E), then steer right (→ / D)' : 'Steer with ← → (A / D)';
    case 'speed':
      return far ? `Keep to the ${w.limit} km/h limit` : `Speed limit changes to ${next.limit} km/h ahead`;
    case 'school':
      return far ? `Keep to the ${w.limit} km/h limit` : 'SCHOOL ZONE ahead — 40 km/h';
    case 'lights':
      return far ? 'Traffic lights ahead' : next.light === 'red' ? 'RED — stop behind the line' : next.light === 'yellow' ? 'YELLOW — stop if you safely can' : 'Traffic lights ahead';
    case 'crossing':
      return far ? 'Pedestrian crossing ahead' : 'Watch the crossing — give way to pedestrians';
    case 'giveway':
      return far ? 'Intersection ahead' : 'GIVE WAY — let the cross traffic pass';
    case 'stop':
      return far ? 'Intersection ahead' : 'STOP sign — come to a complete stop';
    case 'merge':
      return far && dist > 0 ? 'Road works ahead' : 'Left lane closed — indicate and merge right';
    case 'tailgate':
      return 'Keep a 3-second gap from the car ahead';
    case 'railway':
      return far ? 'Railway level crossing ahead' : next.flashing ? 'Lights flashing — STOP and wait' : 'Look both ways at the railway crossing';
    case 'checkpoint':
      return 'Decision point ahead';
  }
  return 'Drive safely';
}
