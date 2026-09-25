'use client';
// Top-down road scenes rebuilt from the source diagrams as reusable, parametric SVG.
// Intersections, T-junctions, roundabouts and straight/multi-lane roads are all
// generated from a small spec, so hundreds of scenarios share one component.
import { Fragment, type ReactNode } from 'react';
import type { Approach, SceneVehicleSpec, VisualSpec } from '@/lib/types';
import { SignInline } from './Sign';
import { LabelBubble, PersonTop, VehicleTop, vehicleType } from './vehicles';

const W = 400;
const H = 300;
const C = { x: 200, y: 150 };
const ROAD = '#4b5563';
const LINE = '#f8fafc';
const KERB = '#d6d3d1';

type Vec = { x: number; y: number };
const U: Record<Approach, Vec> = { S: { x: 0, y: 1 }, N: { x: 0, y: -1 }, E: { x: 1, y: 0 }, W: { x: -1, y: 0 } };
const leftOf = (t: Vec): Vec => ({ x: t.y, y: -t.x });
const neg = (v: Vec): Vec => ({ x: -v.x, y: -v.y });
const add = (a: Vec, b: Vec, k = 1): Vec => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const angleOf = (t: Vec) => (Math.atan2(t.x, -t.y) * 180) / Math.PI;
const armFromVec = (v: Vec): Approach => (v.x === 1 ? 'E' : v.x === -1 ? 'W' : v.y === 1 ? 'S' : 'N');
const r1 = (n: number) => Math.round(n * 10) / 10;
const armLen = (a: Approach) => (a === 'N' || a === 'S' ? 150 : 200);

export interface SceneInteraction {
  pickable?: string[]; // labels (vehicles/hotspots) the player may tap
  onPick?: (label: string) => void;
  picked?: string[];
  good?: string[];
  bad?: string[];
}

interface Props {
  spec: VisualSpec;
  className?: string;
  interaction?: SceneInteraction;
  teach?: boolean; // animate the correct movements
  reducedMotion?: boolean;
  title?: string;
}

interface Placed {
  v: SceneVehicleSpec;
  x: number;
  y: number;
  rot: number;
  path?: string;
}

function tone(label: string | undefined, it?: SceneInteraction): 'default' | 'good' | 'bad' | 'picked' {
  if (!label || !it) return 'default';
  if (it.good?.includes(label)) return 'good';
  if (it.bad?.includes(label)) return 'bad';
  if (it.picked?.includes(label)) return 'picked';
  return 'default';
}

// ───────────────────────── Intersections ─────────────────────────
function intersection(spec: VisualSpec) {
  const nl = spec.lanesPerArm ?? 1;
  const lw = nl === 1 ? 24 : 20;
  const hw = lw * nl;
  const arms: Approach[] = spec.layout === 't' ? ['S', 'E', 'W'] : spec.layout === 't-west' ? ['N', 'S', 'W'] : ['N', 'S', 'E', 'W'];
  const inLane = (a: Approach, s: number, lane = 0): Vec => {
    const u = U[a];
    const t = neg(u);
    const off = lw * (nl - lane - 0.5);
    return add(add(C, u, s), leftOf(t), off);
  };
  const outLane = (a: Approach, s: number, lane = 0): Vec => {
    const u = U[a];
    const off = lw * (nl - lane - 0.5);
    return add(add(C, u, s), leftOf(u), off);
  };
  const exitArm = (a: Approach, move: string): Approach => {
    const t = neg(U[a]);
    if (move === 'straight') return armFromVec(t);
    if (move === 'left') return armFromVec(leftOf(t));
    if (move === 'right') return armFromVec(neg(leftOf(t)));
    return a;
  };
  const place = (v: SceneVehicleSpec): Placed => {
    const a = v.from ?? 'S';
    const lane = v.lane ?? (v.move === 'right' && nl > 1 ? 1 : 0);
    const s = hw + 8 + 17 + (v.pos ?? 0) * 38;
    if (v.side === 'out') {
      const p = outLane(a, s, lane);
      return { v, x: p.x, y: p.y, rot: v.rot ?? angleOf(U[a]) };
    }
    const p = inLane(a, s, lane);
    const t = neg(U[a]);
    let path: string | undefined;
    if (v.move) {
      const b = exitArm(a, v.move);
      const entry = inLane(a, hw + 2, lane);
      const exitLane = v.move === 'straight' ? lane : v.move === 'right' ? 0 : nl - 1 - 0;
      const ex = outLane(b, hw + 2, Math.min(exitLane, nl - 1));
      const end = outLane(b, armLen(b) + 30, Math.min(exitLane, nl - 1));
      const front = add(p, t, 16);
      if (v.move === 'straight') path = `M${r1(front.x)},${r1(front.y)} L${r1(end.x)},${r1(end.y)}`;
      else if (v.move === 'uturn') {
        const o = outLane(a, hw + 2, 0);
        const o2 = outLane(a, armLen(a) + 30, 0);
        path = `M${r1(front.x)},${r1(front.y)} L${r1(entry.x)},${r1(entry.y)} Q${r1(C.x)},${r1(C.y)} ${r1(o.x)},${r1(o.y)} L${r1(o2.x)},${r1(o2.y)}`;
      } else {
        const vertical = t.x === 0;
        const ctrl = vertical ? { x: entry.x, y: ex.y } : { x: ex.x, y: entry.y };
        path = `M${r1(front.x)},${r1(front.y)} L${r1(entry.x)},${r1(entry.y)} Q${r1(ctrl.x)},${r1(ctrl.y)} ${r1(ex.x)},${r1(ex.y)} L${r1(end.x)},${r1(end.y)}`;
      }
    }
    return { v, x: p.x, y: p.y, rot: v.rot ?? angleOf(t), path };
  };

  const ground: ReactNode[] = [];
  // roads
  const vTop = arms.includes('N') ? 0 : C.y - hw;
  const vBot = arms.includes('S') ? H : C.y + hw;
  const hL = arms.includes('W') ? 0 : C.x - hw;
  const hR = arms.includes('E') ? W : C.x + hw;
  ground.push(
    <g key="roads">
      <rect x={C.x - hw - 7} y={vTop} width={hw * 2 + 14} height={vBot - vTop} fill={KERB} />
      <rect x={hL} y={C.y - hw - 7} width={hR - hL} height={hw * 2 + 14} fill={KERB} />
      <rect x={C.x - hw} y={vTop} width={hw * 2} height={vBot - vTop} fill={ROAD} />
      <rect x={hL} y={C.y - hw} width={hR - hL} height={hw * 2} fill={ROAD} />
    </g>,
  );
  // markings per arm
  for (const a of arms) {
    const u = U[a];
    const L = armLen(a);
    const start = add(C, u, hw + 4);
    const end = add(C, u, L);
    const perp = leftOf(u);
    // centre line
    const cA = start;
    const cB = end;
    if (nl === 1) ground.push(<line key={`c${a}`} x1={cA.x} y1={cA.y} x2={cB.x} y2={cB.y} stroke={LINE} strokeWidth="2.2" strokeDasharray="10 9" />);
    else {
      ground.push(<line key={`c${a}`} x1={cA.x} y1={cA.y} x2={cB.x} y2={cB.y} stroke={LINE} strokeWidth="2.4" />);
      for (const side of [-1, 1]) {
        const o = add(start, perp, side * lw);
        const o2 = add(end, perp, side * lw);
        ground.push(<line key={`l${a}${side}`} x1={o.x} y1={o.y} x2={o2.x} y2={o2.y} stroke={LINE} strokeWidth="1.8" strokeDasharray="8 10" />);
      }
    }
    // controls: stop / give way line + sign / lights
    const ctl = spec.controls?.[a];
    const t = neg(u);
    const inLeftEdge = add(add(C, u, hw + 4), leftOf(t), hw);
    const inCentre = add(C, u, hw + 4);
    if (ctl) {
      const dash = ctl === 'giveway' ? '6 5' : undefined;
      ground.push(<line key={`s${a}`} x1={inLeftEdge.x} y1={inLeftEdge.y} x2={inCentre.x} y2={inCentre.y} stroke={LINE} strokeWidth={ctl === 'giveway' ? 3 : 4.5} strokeDasharray={dash} />);
    }
    // lane arrows
    const marks = spec.laneMarks?.[a];
    if (marks) marks.forEach((m, lane) => ground.push(<LaneArrow key={`m${a}${lane}`} at={inLane(a, hw + 48, lane)} rot={angleOf(t)} kind={m} />));
  }
  // zebra crossings
  for (const a of spec.zebraArms ?? []) {
    const u = U[a];
    const perp = leftOf(u);
    for (let i = -hw + 3; i < hw; i += 7) {
      const p = add(add(C, u, hw + 16), perp, i);
      ground.push(<rect key={`z${a}${i}`} x={p.x - 2.2} y={p.y - 9} width="4.4" height="18" fill={LINE} transform={`rotate(${angleOf(u)} ${p.x} ${p.y})`} />);
    }
  }
  if (spec.edgeLine) {
    // edge line continuing across the side road (LD022)
    ground.push(<line key="edge" x1={C.x - hw + 3} y1={0} x2={C.x - hw + 3} y2={H} stroke={LINE} strokeWidth="2.2" />);
  }
  // roadside furniture (signs/lights) drawn above vehicles for visibility
  const furniture: ReactNode[] = [];
  for (const a of arms) {
    const ctl = spec.controls?.[a];
    if (!ctl) continue;
    const u = U[a];
    const t = neg(u);
    const pos = add(add(C, u, hw + 26), leftOf(t), hw + 18);
    if (ctl === 'stop' || ctl === 'giveway') furniture.push(<SignInline key={`sg${a}`} id={ctl === 'stop' ? 'stop' : 'give-way'} x={pos.x} y={pos.y + 10} size={30} />);
    else if (ctl.startsWith('lights')) furniture.push(<MiniLight key={`ml${a}`} x={pos.x} y={pos.y} state={ctl.replace('lights-', '')} />);
  }
  const placed = (spec.vehicles ?? []).map(place);
  return { ground, furniture, placed, nl, lw, hw };
}

function LaneArrow({ at, rot, kind }: { at: Vec; rot: number; kind: string }) {
  const parts = kind.split('-');
  return (
    <g transform={`translate(${at.x} ${at.y}) rotate(${rot})`} stroke={LINE} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".9">
      <path d="M0 10 L0 -2" />
      {parts.includes('straight') && <path d="M0 -2 L0 -10 M-3.5 -6 L0 -10.5 L3.5 -6" />}
      {parts.includes('left') && <path d="M0 -1 Q0 -6 -6 -6 M-3 -9 L-7 -6 L-3 -3" />}
      {parts.includes('right') && <path d="M0 -1 Q0 -6 6 -6 M3 -9 L7 -6 L3 -3" />}
    </g>
  );
}

function MiniLight({ x, y, state }: { x: number; y: number; state: string }) {
  const on = (s: string) => (state === s ? (s === 'red' ? '#ef4444' : s === 'yellow' ? '#fbbf24' : '#22c55e') : '#1f2937');
  return (
    <g>
      <rect x={x - 1.5} y={y} width="3" height="16" fill="#6b7280" />
      <rect x={x - 6} y={y - 26} width="12" height="28" rx="3" fill="#111827" stroke="#e5e7eb" strokeWidth="1" />
      <circle cx={x} cy={y - 20} r="3.4" fill={on('red')} />
      <circle cx={x} cy={y - 12} r="3.4" fill={on('yellow')} />
      <circle cx={x} cy={y - 4} r="3.4" fill={on('green')} />
    </g>
  );
}

// ───────────────────────── Roundabout ─────────────────────────
function roundabout(spec: VisualSpec) {
  const nl = 2;
  const lw = 20;
  const hw = lw * nl;
  const R = 84;
  const island = 32;
  const laneR = [72, 50];
  const arms: Approach[] = ['N', 'S', 'E', 'W'];
  const theta = (a: Approach) => (Math.atan2(U[a].y, U[a].x) * 180) / Math.PI;
  const P = (deg: number, r: number): Vec => ({ x: C.x + r * Math.cos((deg * Math.PI) / 180), y: C.y + r * Math.sin((deg * Math.PI) / 180) });
  const inLane = (a: Approach, s: number, lane: number): Vec => add(add(C, U[a], s), leftOf(neg(U[a])), lw * (nl - lane - 0.5));
  const outLane = (a: Approach, s: number, lane: number): Vec => add(add(C, U[a], s), leftOf(U[a]), lw * (nl - lane - 0.5));
  const turns: Record<string, number> = { left: 90, straight: 180, right: 270, uturn: 360 };

  const ringPath = (a: Approach, lane: number, move: string, startAngle?: number) => {
    const r = laneR[lane];
    const off = lw * (nl - lane - 0.5);
    const d = (Math.asin(Math.min(1, off / r)) * 180) / Math.PI;
    const entryAng = startAngle ?? theta(a) + d;
    const exitArmAng = theta(a) + turns[move];
    let target = exitArmAng - d;
    while (target <= entryAng + 1) target += 360;
    const exitArm = arms.find((x) => Math.abs((((theta(x) - exitArmAng) % 360) + 360) % 360) < 1) ?? a;
    const e1 = P(entryAng, r);
    const e2 = P(target, r);
    const far = outLane(exitArm, armLen(exitArm) + 30, lane);
    const large = target - entryAng > 180 ? 1 : 0;
    return { d: `L${r1(e1.x)},${r1(e1.y)} A${r} ${r} 0 ${large} 1 ${r1(e2.x)},${r1(e2.y)} L${r1(far.x)},${r1(far.y)}`, entryAng, target, r };
  };

  const place = (v: SceneVehicleSpec): Placed => {
    const a = v.from ?? 'S';
    const lane = v.lane ?? 0;
    if (v.onRing) {
      const r = laneR[lane];
      const offR = lw * (nl - lane - 0.5);
      const ang = theta(a) + (Math.asin(Math.min(1, offR / r)) * 180) / Math.PI + 22;
      const p = P(ang, r);
      const tan = { x: -Math.sin((ang * Math.PI) / 180), y: Math.cos((ang * Math.PI) / 180) };
      let path: string | undefined;
      if (v.move) {
        const rp = ringPath(a, lane, v.move, ang + 12);
        path = `M${r1(p.x)},${r1(p.y)} ${rp.d}`;
      }
      return { v, x: p.x, y: p.y, rot: angleOf(tan), path };
    }
    const s = R + 20 + (v.pos ?? 0) * 34;
    const p = inLane(a, s, lane);
    const t = neg(U[a]);
    let path: string | undefined;
    if (v.move) {
      const front = add(p, t, 16);
      path = `M${r1(front.x)},${r1(front.y)} ${ringPath(a, lane, v.move).d}`;
    }
    return { v, x: p.x, y: p.y, rot: v.rot ?? angleOf(t), path };
  };

  const ground: ReactNode[] = [];
  ground.push(
    <g key="rb">
      <rect x={C.x - hw - 7} y={0} width={hw * 2 + 14} height={H} fill={KERB} />
      <rect x={0} y={C.y - hw - 7} width={W} height={hw * 2 + 14} fill={KERB} />
      <circle cx={C.x} cy={C.y} r={R + 7} fill={KERB} />
      <rect x={C.x - hw} y={0} width={hw * 2} height={H} fill={ROAD} />
      <rect x={0} y={C.y - hw} width={W} height={hw * 2} fill={ROAD} />
      <circle cx={C.x} cy={C.y} r={R} fill={ROAD} />
      <circle cx={C.x} cy={C.y} r={(laneR[0] + laneR[1]) / 2} fill="none" stroke={LINE} strokeWidth="1.6" strokeDasharray="7 9" opacity=".8" />
      <circle cx={C.x} cy={C.y} r={island + 4} fill="#e7e5e4" />
      <circle cx={C.x} cy={C.y} r={island} fill="#65a30d" />
      <circle cx={C.x - 8} cy={C.y - 6} r="9" fill="#3f6212" />
      <circle cx={C.x + 9} cy={C.y + 5} r="11" fill="#4d7c0f" />
    </g>,
  );
  for (const a of arms) {
    const u = U[a];
    const perp = leftOf(u);
    // splitter island
    const base = add(C, u, R + 6);
    const tip = add(C, u, R + 34);
    const l = add(base, perp, 5);
    const r = add(base, perp, -5);
    ground.push(<path key={`sp${a}`} d={`M${l.x},${l.y} L${tip.x},${tip.y} L${r.x},${r.y} Z`} fill="#e7e5e4" stroke={LINE} strokeWidth="1" />);
    // lane line + give way line
    for (const side of [-1, 1]) {
      const o = add(add(C, u, R + 10), perp, side * (lw + 10));
      const o2 = add(add(C, u, armLen(a)), perp, side * (lw + 10));
      ground.push(<line key={`ln${a}${side}`} x1={o.x} y1={o.y} x2={o2.x} y2={o2.y} stroke={LINE} strokeWidth="1.8" strokeDasharray="8 10" />);
    }
    const t = neg(u);
    const g1 = add(add(C, u, R + 3), leftOf(t), 9);
    const g2 = add(add(C, u, R + 3), leftOf(t), hw + 2);
    ground.push(<line key={`gw${a}`} x1={g1.x} y1={g1.y} x2={g2.x} y2={g2.y} stroke={LINE} strokeWidth="3" strokeDasharray="5 4" />);
    const marks = spec.laneMarks?.[a];
    if (marks) marks.forEach((m, lane) => ground.push(<LaneArrow key={`m${a}${lane}`} at={inLane(a, R + 50, lane)} rot={angleOf(t)} kind={m} />));
  }
  const furniture: ReactNode[] = [];
  for (const pt of spec.points ?? []) {
    let p: Vec;
    if (pt.arm) p = inLane(pt.arm, R + 14, 1);
    else p = P(pt.angle ?? 0, laneR[1] + 4);
    furniture.push(
      <g key={`pt${pt.label}`}>
        <circle cx={p.x} cy={p.y} r="4" fill="#fde047" stroke="#0f172a" strokeWidth="1.5" />
        <LabelBubble x={p.x + (pt.arm ? 22 : -16)} y={p.y - 4} text={pt.label} />
      </g>,
    );
  }
  if (spec.exitArrow) {
    const a = spec.exitArrow;
    const p1 = outLane(a, R + 16, 0);
    const p2 = outLane(a, R + 70, 0);
    furniture.push(<path key="exit" d={`M${p1.x},${p1.y} L${p2.x},${p2.y}`} stroke="#22c55e" strokeWidth="7" markerEnd="url(#arrowGreen)" />);
  }
  const hotspots = (spec.hotspots ?? []).map((h) => {
    const a = h.arm ?? 'S';
    const lane = h.lane ?? 0;
    const p1 = inLane(a, R + 10, lane);
    const p2 = inLane(a, R + 76, lane);
    return { id: h.id, x: Math.min(p1.x, p2.x) - lw / 2 + 1, y: Math.min(p1.y, p2.y), w: lw - 2 + Math.abs(p1.x - p2.x), h: Math.abs(p2.y - p1.y) + (p1.y === p2.y ? lw - 2 : 0) };
  });
  const placed = (spec.vehicles ?? []).map(place);
  return { ground, furniture, placed, hotspots };
}

// ───────────────────────── Straight roads ─────────────────────────
const laneWidth = (dir: string) => (dir === 'park' ? 26 : dir === 'angle-park' ? 44 : dir === 'median' ? 26 : 30);

function straight(spec: VisualSpec) {
  const vertical = spec.layout !== 'road-h';
  const merge = spec.layout === 'merge';
  const lanes = merge ? [{ dir: 'up' }, { dir: 'up' }] : spec.lanes ?? [{ dir: 'up' }, { dir: 'down' }];
  const widths = lanes.map((l) => laneWidth(l.dir));
  const total = widths.reduce((a, b) => a + b, 0);
  const cross = vertical ? C.x : C.y;
  const start0 = cross - total / 2;
  const starts = widths.map((_, i) => start0 + widths.slice(0, i).reduce((a, b) => a + b, 0));
  const centreOf = (lanePos: number) => {
    const i = Math.max(0, Math.min(lanes.length - 1, Math.floor(lanePos)));
    const frac = lanePos - Math.floor(lanePos);
    return Number.isInteger(lanePos) ? starts[i] + widths[i] / 2 : starts[i] + widths[i] * frac;
  };
  const along = (t: number) => (vertical ? 20 + t * 260 : 20 + t * 360);
  const pt = (lanePos: number, t: number): Vec => (vertical ? { x: centreOf(lanePos), y: along(t) } : { x: along(t), y: centreOf(lanePos) });
  const defaultRot = (dir: string) => (vertical ? (dir === 'down' ? 180 : 0) : dir === 'left' ? 270 : 90);

  const ground: ReactNode[] = [];
  const len = vertical ? H : W;
  const rect = (a: number, b: number, fill: string, key: string) =>
    vertical ? <rect key={key} x={a} y={0} width={b} height={len} fill={fill} /> : <rect key={key} x={0} y={a} width={len} height={b} fill={fill} />;
  ground.push(rect(start0 - 9, total + 18, KERB, 'kerb'));
  ground.push(rect(start0, total, ROAD, 'road'));
  if (merge) {
    // right lane ends: taper the right edge
    const x1 = start0 + total;
    ground.push(<path key="taper" d={`M${x1 + 10},0 L${x1 + 10},${H} L${x1},${H} L${x1},180 L${x1 - widths[1]},60 L${x1 - widths[1]},0 Z`} fill="#6aa84f" />);
    ground.push(<path key="taperk" d={`M${x1},180 L${x1 - widths[1]},60`} stroke={KERB} strokeWidth="6" />);
    ground.push(<line key="mline" x1={starts[1]} y1={300} x2={starts[1]} y2={150} stroke={LINE} strokeWidth="2" strokeDasharray="10 10" />);
  }
  lanes.forEach((l, i) => {
    if (l.dir === 'park' || l.dir === 'angle-park') ground.push(rect(starts[i], widths[i], '#57606b', `p${i}`));
    if (l.dir === 'angle-park') {
      for (let k = 0; k < 7; k++) {
        const y = 30 + k * 38;
        ground.push(<line key={`ap${k}`} x1={starts[i]} y1={y} x2={starts[i] + widths[i]} y2={y - 22} stroke={LINE} strokeWidth="2" />);
      }
    }
    if (l.dir === 'median') {
      for (let k = 0; k < 12; k++) {
        const y = k * 26;
        ground.push(<path key={`md${k}`} d={`M${starts[i] + 3},${y} L${starts[i] + widths[i] - 3},${y + 14}`} stroke={LINE} strokeWidth="1.5" opacity=".7" />);
      }
    }
    if (l.mark) ground.push(<LaneArrow key={`lm${i}`} at={pt(i, 0.18)} rot={0} kind={l.mark} />);
  });
  // dividers
  (spec.lines ?? []).forEach((kind, i) => {
    const pos = starts[i + 1];
    const line = (off: number, dash: string | undefined, key: string, from = 0, to = len) =>
      vertical ? (
        <line key={key} x1={pos + off} y1={from} x2={pos + off} y2={to} stroke={LINE} strokeWidth="2.2" strokeDasharray={dash} />
      ) : (
        <line key={key} x1={from} y1={pos + off} x2={to} y2={pos + off} stroke={LINE} strokeWidth="2.2" strokeDasharray={dash} />
      );
    if (kind === 'broken') ground.push(line(0, '12 10', `d${i}`));
    else if (kind === 'solid') ground.push(line(0, undefined, `d${i}`));
    else if (kind === 'double') {
      ground.push(line(-2.5, undefined, `d${i}a`));
      ground.push(line(2.5, undefined, `d${i}b`));
    } else if (kind === 'double-solid-first') {
      ground.push(line(-2.5, undefined, `d${i}a`));
      ground.push(line(2.5, '10 8', `d${i}b`));
    } else if (kind === 'broken-then-double') {
      ground.push(line(0, '12 10', `d${i}a`, 150, 300));
      ground.push(line(-2.5, undefined, `d${i}b`, 0, 150));
      ground.push(line(2.5, undefined, `d${i}c`, 0, 150));
    }
  });
  // zebra
  for (const z of spec.zebra ?? []) {
    const a = along(z.t);
    for (let k = start0 + 3; k < start0 + total - 3; k += 8) {
      ground.push(vertical ? <rect key={`zb${k}`} x={k} y={a - 10} width="5" height="20" fill={LINE} /> : <rect key={`zb${k}`} x={a - 10} y={k} width="20" height="5" fill={LINE} />);
    }
  }
  if (spec.zigzag && vertical) {
    for (const edge of [start0 + 4, start0 + total - 4, starts[1]]) {
      let d = `M${edge},${along(0.35)}`;
      for (let k = 1; k <= 10; k++) d += ` L${edge + (k % 2 ? 5 : -5)},${along(0.35 + k * 0.05)}`;
      ground.push(<path key={`zz${edge}`} d={d} stroke={LINE} strokeWidth="2" fill="none" />);
    }
  }
  // driveways / side streets (road-h, bottom side)
  const furniture: ReactNode[] = [];
  for (const dw of spec.driveways ?? []) {
    const x = along(dw.t);
    const y = start0 + total;
    const w = dw.street ? 44 : 26;
    ground.push(<rect key={`dw${dw.label}`} x={x - w / 2} y={y} width={w} height={H - y} fill={dw.street ? ROAD : '#a8a29e'} />);
    if (!dw.street) ground.push(<rect key={`dwh${dw.label}`} x={x - 22} y={H - 34} width="44" height="30" fill="#fde68a" stroke="#92400e" strokeWidth="2" rx="2" />);
  }
  for (const s of spec.signs ?? []) {
    const p = pt(0, s.t);
    const x = s.side === 'left' ? start0 - 22 : start0 + total + 22;
    furniture.push(<SignInline key={`sg${s.id}${s.t}`} id={s.id} x={vertical ? x : p.x} y={vertical ? p.y : start0 - 10} size={30} />);
  }
  for (const m of spec.measures ?? []) {
    furniture.push(
      <g key={`ms${m.x1}`}>
        <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="#fde047" strokeWidth="2.5" markerStart="url(#arrowYellow)" markerEnd="url(#arrowYellow)" />
        <rect x={(m.x1 + m.x2) / 2 - 18} y={m.y1 - 22} width="36" height="16" rx="4" fill="#0f172a" />
        <text x={(m.x1 + m.x2) / 2} y={m.y1 - 13.5} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" fill="#fde047" fontFamily="Arial, sans-serif">{m.label}</text>
      </g>,
    );
  }

  const placed: Placed[] = (spec.vehicles ?? []).map((v) => {
    const lane = v.lane ?? 0;
    const p = pt(lane, v.t ?? 0.5);
    return { v, x: p.x, y: p.y, rot: v.rot ?? defaultRot(lanes[Math.min(lane, lanes.length - 1)]?.dir ?? 'up') };
  });
  // movement options (LD002–LD004): O, P, Q from the first vehicle
  const moveArrows: { label: string; d: string; lx: number; ly: number }[] = [];
  if (spec.moves && !vertical) {
    const car = placed[0];
    const ahead = placed[1];
    const yLane = car.y;
    const yOther = centreOf(1);
    const bottom = start0 + total;
    for (const label of spec.moves) {
      const dw = spec.driveways?.find((d) => d.label === label);
      if (dw) {
        const x = along(dw.t);
        moveArrows.push({ label, d: `M${car.x + 18},${yLane} L${x - 24},${yLane} Q${x},${yLane} ${x},${bottom + 12}`, lx: x + 14, ly: bottom + 8 });
      } else if (ahead) {
        moveArrows.push({ label, d: `M${car.x + 18},${yLane} L${ahead.x - 70},${yLane} Q${ahead.x - 40},${yOther} ${ahead.x},${yOther} Q${ahead.x + 40},${yOther} ${ahead.x + 56},${yLane}`, lx: ahead.x + 64, ly: yLane - 14 });
      }
    }
  }
  const peds = (spec.pedestrians ?? []).map((p, i) => {
    const q = p.lane !== undefined ? pt(p.lane, p.t ?? 0.5) : { x: p.x ?? 0, y: p.y ?? 0 };
    return <PersonTop key={`pd${i}`} x={q.x} y={q.y} kind={p.kind} rot={vertical ? 90 : 0} />;
  });
  return { ground, furniture, placed, moveArrows, peds };
}

// ───────────────────────── Component ─────────────────────────
export function Scene({ spec, className, interaction, teach, reducedMotion, title }: Props) {
  const layout = spec.layout ?? 'cross';
  let ground: ReactNode[] = [];
  let furniture: ReactNode[] = [];
  let placed: Placed[] = [];
  let hotspots: { id: string; x: number; y: number; w: number; h: number }[] = [];
  let moveArrows: { label: string; d: string; lx: number; ly: number }[] = [];
  let peds: ReactNode[] = [];
  let pedsInt: ReactNode[] = [];
  if (layout === 'roundabout') ({ ground, furniture, placed, hotspots } = roundabout(spec));
  else if (layout === 'road-v' || layout === 'road-h' || layout === 'merge') ({ ground, furniture, placed, moveArrows, peds } = straight(spec));
  else {
    const r = intersection(spec);
    ground = r.ground;
    furniture = r.furniture;
    placed = r.placed;
    pedsInt = (spec.pedestrians ?? []).map((p, i) => <PersonTop key={`pi${i}`} x={p.x ?? 0} y={p.y ?? 0} kind={p.kind} />);
  }
  const order = spec.order ?? [];
  const animate = teach && !reducedMotion;
  const moving = placed.filter((p) => p.path && !p.v.ghost);
  // animation timing: vehicles in `order` go one after another; others move together first
  const slot = (p: Placed) => {
    const lbl = p.v.label ?? '';
    const i = order.indexOf(lbl);
    return i >= 0 ? i : 0;
  };
  const slots = Math.max(1, ...moving.map((p) => slot(p) + 1));
  const SLOT = 1.9;
  const TOTAL = slots * SLOT + 1.4;
  const pickable = new Set(interaction?.pickable ?? []);
  const scenery = <Scenery layout={layout} />;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={title ?? spec.caption ?? 'Road diagram'}>
      <title>{title ?? spec.caption ?? 'Road diagram'}</title>
      <defs>
        <marker id="arrowBlue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#1d4ed8" />
        </marker>
        <marker id="arrowGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill="#22c55e" />
        </marker>
        <marker id="arrowYellow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#fde047" />
        </marker>
        <marker id="arrowOrange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#f97316" />
        </marker>
      </defs>
      <rect width={W} height={H} fill={spec.env === 'night' ? '#1c3325' : '#6aa84f'} />
      {scenery}
      {ground}
      {spec.caption && <rect x="0" y={H - 1} width="0" height="0" />}
      {/* movement arrows */}
      {!animate &&
        placed
          .filter((p) => p.path && p.v.arrow !== false)
          .map((p, i) => <path key={`ar${i}`} d={p.path} stroke="#1d4ed8" strokeWidth="5" fill="none" opacity={p.v.ghost ? 0.5 : 0.85} strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arrowBlue)" />)}
      {moveArrows.map((m) => (
        <g key={`mv${m.label}`}>
          <path d={m.d} stroke="#1d4ed8" strokeWidth="3.5" fill="none" markerEnd="url(#arrowBlue)" opacity=".9" />
          <LabelBubble x={m.lx} y={m.ly} text={m.label} />
        </g>
      ))}
      {(spec.arrows ?? []).map((a, i) => (
        <path key={`xa${i}`} d={a.d} stroke={a.color ?? '#1d4ed8'} strokeWidth="4" fill="none" strokeDasharray={a.dashed ? '8 6' : undefined} markerEnd={a.color === '#f97316' ? 'url(#arrowOrange)' : 'url(#arrowBlue)'} opacity=".9" />
      ))}
      {peds}
      {pedsInt}
      {/* hotspots */}
      {hotspots.map((h) => {
        const tn = tone(h.id, interaction);
        const canPick = pickable.has(h.id);
        return (
          <g key={`hs${h.id}`} onClick={canPick ? () => interaction?.onPick?.(h.id) : undefined} style={{ cursor: canPick ? 'pointer' : undefined }} role={canPick ? 'button' : undefined} aria-label={canPick ? `Choose ${h.id}` : undefined}>
            <rect x={h.x} y={h.y} width={h.w} height={h.h} rx="6" fill={tn === 'good' ? 'rgba(34,197,94,.35)' : tn === 'bad' ? 'rgba(239,68,68,.35)' : tn === 'picked' ? 'rgba(37,99,235,.35)' : 'rgba(253,224,71,.12)'} stroke="#fde047" strokeWidth="2" strokeDasharray="6 4" />
            <LabelBubble x={h.x + h.w / 2} y={h.y + h.h + 12} text={h.id.length > 2 ? h.id.split(' ')[0][0] : h.id} tone={tn} />
          </g>
        );
      })}
      {/* vehicles */}
      {placed.map((p, i) => {
        const label = p.v.label;
        const tn = tone(label, interaction);
        const canPick = !!label && pickable.has(label);
        const vehicle = <VehicleTop color={p.v.color} indicate={p.v.indicate} highlight={p.v.highlight || (canPick && tn === 'default')} />;
        const isTruck = ['truck', 'bus', 'tram', 'fire'].includes(vehicleType(p.v.color));
        const labelOffset = isTruck ? 40 : 26;
        const onClick = canPick ? () => interaction?.onPick?.(label!) : undefined;
        if (animate && p.path && !p.v.ghost) {
          const s = slot(p);
          const k0 = r1((s * SLOT) / TOTAL);
          const k1 = r1(((s + 1) * SLOT - 0.2) / TOTAL);
          const keyTimes = `0;${Math.max(0.001, k0)};${Math.min(0.999, Math.max(k0 + 0.01, k1))};1`;
          return (
            <g key={`v${i}`}>
              <g>
                <g transform="rotate(90)">
                  {vehicle}
                </g>
                <animateMotion dur={`${TOTAL}s`} repeatCount="indefinite" path={p.path} rotate="auto" keyPoints="0;0;1;1" keyTimes={keyTimes} calcMode="linear" />
              </g>
            </g>
          );
        }
        return (
          <g key={`v${i}`} onClick={onClick} style={{ cursor: canPick ? 'pointer' : undefined }} role={canPick ? 'button' : undefined} aria-label={canPick ? `Choose vehicle ${label}` : undefined} opacity={p.v.ghost ? 0.5 : 1}>
            {canPick && <circle cx={p.x} cy={p.y} r="26" fill="transparent" />}
            <g transform={`translate(${r1(p.x)} ${r1(p.y)}) rotate(${r1(p.rot)})`}>{vehicle}</g>
            {label && <LabelBubble x={p.x + (p.rot % 180 === 0 ? ((layout === 'road-v' || layout === 'merge') && p.x < C.x - 1) || (layout !== 'road-v' && layout !== 'merge' && Math.round(p.rot) === 180) ? -21 : 21 : 0)} y={p.y - (p.rot % 180 === 0 ? 0 : labelOffset - 6)} text={label} tone={tn} />}
          </g>
        );
      })}
      {animate &&
        placed
          .filter((p) => p.v.label && p.path)
          .map((p, i) => <Fragment key={`al${i}`}><LabelBubble x={p.x + 20} y={p.y} text={p.v.label!} /></Fragment>)}
      {spec.crash && <Crash x={spec.crash.x} y={spec.crash.y} />}
      {furniture}
      {(spec.labels ?? []).map((l) => (
        <LabelBubble key={`lb${l.text}`} x={l.x} y={l.y} text={l.text} />
      ))}
    </svg>
  );
}

function Crash({ x, y }: { x: number; y: number }) {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 ? 9 : 20;
    const a = (i / 16) * Math.PI * 2;
    return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <g>
      <polygon points={pts} fill="#fde047" stroke="#f97316" strokeWidth="2.5" />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="900" fill="#b91c1c" fontFamily="Arial, sans-serif">
        !
      </text>
    </g>
  );
}

/** Gum trees, houses and footpath flavour in the grass corners. */
function Scenery({ layout }: { layout: string }) {
  const spots: [number, number, 'tree' | 'house'][] =
    layout === 'road-v' || layout === 'merge'
      ? [[40, 50, 'tree'], [60, 200, 'house'], [345, 70, 'house'], [360, 240, 'tree']]
      : layout === 'road-h'
        ? [[60, 30, 'tree'], [330, 30, 'house']]
        : [[45, 45, 'house'], [355, 40, 'tree'], [40, 255, 'tree'], [355, 255, 'house']];
  return (
    <g>
      {spots.map(([x, y, kind]) =>
        kind === 'tree' ? (
          <g key={`${x}${y}`}>
            <circle cx={x + 3} cy={y + 4} r="18" fill="rgba(0,0,0,.15)" />
            <circle cx={x} cy={y} r="17" fill="#3f7d3a" />
            <circle cx={x - 7} cy={y - 5} r="9" fill="#5a9e4b" />
            <circle cx={x + 6} cy={y + 4} r="8" fill="#2f6b2d" />
          </g>
        ) : (
          <g key={`${x}${y}`}>
            <rect x={x - 22} y={y - 16} width="44" height="32" fill="#fef3c7" stroke="#a16207" strokeWidth="1.5" />
            <path d={`M${x - 26},${y - 16} L${x},${y - 30} L${x + 26},${y - 16} Z`} fill="#b91c1c" transform={`translate(0 14) scale(1 1)`} opacity="0" />
            <rect x={x - 22} y={y - 16} width="44" height="16" fill="#b45309" />
            <rect x={x - 22} y={y} width="44" height="16" fill="#92400e" />
            <line x1={x - 22} y1={y} x2={x + 22} y2={y} stroke="#78350f" strokeWidth="1.5" />
          </g>
        ),
      )}
    </g>
  );
}
