'use client';
// Driver's-eye illustrations. The source PDF used photographs for these questions;
// here each photo is re-imagined as an original stylised scene plus a caption.
import type { ReactNode } from 'react';
import type { PovObject, VisualSpec } from '@/lib/types';
import { COLOR_HEX } from './vehicles';

const VW = 400;
const VH = 260;
const HOR = 104;

export const HAZARD_TYPES = new Set(['ped', 'child', 'elderly', 'tram', 'gravel', 'refuge', 'building-corner', 'truck', 'swerve', 'queue', 'roadworks-lights']);

interface Geo {
  k: (d: number) => number;
  y: (d: number) => number;
  x: (l: number, d: number) => number;
  lanePx: number;
}

function geo(curve: number, lanePx: number): Geo {
  const k = (d: number) => Math.pow(1 - d, 2);
  const y = (d: number) => HOR + (VH - HOR) * k(d);
  const vp = (d: number) => 200 + curve * Math.pow(d, 1.6) * 150;
  const x = (l: number, d: number) => vp(d) + l * lanePx * k(d);
  return { k, y, x, lanePx };
}

function edgePath(g: Geo, l: number, d0 = 0, d1 = 0.985, steps = 24): string {
  let s = '';
  for (let i = 0; i <= steps; i++) {
    const d = d0 + ((d1 - d0) * i) / steps;
    s += `${i ? 'L' : 'M'}${g.x(l, d).toFixed(1)},${g.y(d).toFixed(1)} `;
  }
  return s;
}

function roadPoly(g: Geo, lL: number, lR: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const d = (0.985 * i) / 24;
    pts.push(`${g.x(lL, d).toFixed(1)},${g.y(d).toFixed(1)}`);
  }
  for (let i = 24; i >= 0; i--) {
    const d = (0.985 * i) / 24;
    pts.push(`${g.x(lR, d).toFixed(1)},${g.y(d).toFixed(1)}`);
  }
  return pts.join(' ');
}

function dashes(g: Geo, l: number, color = '#f8fafc', width = 3, key = ''): ReactNode[] {
  const out: ReactNode[] = [];
  for (let d = 0; d < 0.95; d += 0.07) {
    const d2 = d + 0.035;
    out.push(<path key={`${key}${d.toFixed(2)}`} d={`M${g.x(l, d)},${g.y(d)} L${g.x(l, d2)},${g.y(d2)}`} stroke={color} strokeWidth={Math.max(0.6, width * g.k(d))} strokeLinecap="butt" />);
  }
  return out;
}

function solid(g: Geo, l: number, color = '#f8fafc', width = 3, key = ''): ReactNode {
  // tapering solid line approximated with segments
  const out: ReactNode[] = [];
  for (let d = 0; d < 0.97; d += 0.05) {
    const d2 = d + 0.05;
    out.push(<path key={`${key}${d.toFixed(2)}`} d={`M${g.x(l, d)},${g.y(d)} L${g.x(l, d2)},${g.y(d2)}`} stroke={color} strokeWidth={Math.max(0.5, width * g.k(d))} />);
  }
  return <g key={key}>{out}</g>;
}

// ── Objects ──────────────────────────────────────────────
function CarRear({ x, y, s, color, oncoming, indicate, lights }: { x: number; y: number; s: number; color: string; oncoming?: boolean; indicate?: 'left' | 'right'; lights?: string }) {
  const w = 80 * s;
  const h = 56 * s;
  const body = COLOR_HEX[color] ?? color;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={w * 0.56} ry={h * 0.1} fill="rgba(0,0,0,.35)" />
      <rect x={x - w / 2} y={y - h * 0.62} width={w} height={h * 0.5} rx={h * 0.12} fill={body} stroke="rgba(0,0,0,.45)" strokeWidth={Math.max(0.5, 1.4 * s)} />
      <path d={`M${x - w * 0.36} ${y - h * 0.62} L${x - w * 0.28} ${y - h * 0.98} L${x + w * 0.28} ${y - h * 0.98} L${x + w * 0.36} ${y - h * 0.62} Z`} fill={body} stroke="rgba(0,0,0,.45)" strokeWidth={Math.max(0.5, 1.2 * s)} />
      <path d={`M${x - w * 0.3} ${y - h * 0.64} L${x - w * 0.24} ${y - h * 0.92} L${x + w * 0.24} ${y - h * 0.92} L${x + w * 0.3} ${y - h * 0.64} Z`} fill={oncoming ? '#0f172a' : '#1e293b'} opacity=".85" />
      {oncoming ? (
        <>
          <rect x={x - w * 0.46} y={y - h * 0.5} width={w * 0.2} height={h * 0.12} rx="2" fill="#fef9c3" />
          <rect x={x + w * 0.26} y={y - h * 0.5} width={w * 0.2} height={h * 0.12} rx="2" fill="#fef9c3" />
          {lights === 'head' && (
            <>
              <circle cx={x - w * 0.36} cy={y - h * 0.44} r={w * 0.5} fill="#fef9c3" opacity=".25" />
              <circle cx={x + w * 0.36} cy={y - h * 0.44} r={w * 0.5} fill="#fef9c3" opacity=".25" />
            </>
          )}
        </>
      ) : (
        <>
          <rect x={x - w * 0.46} y={y - h * 0.5} width={w * 0.18} height={h * 0.12} rx="2" fill={lights === 'parking' ? '#ff4d4d' : '#b91c1c'} />
          <rect x={x + w * 0.28} y={y - h * 0.5} width={w * 0.18} height={h * 0.12} rx="2" fill={lights === 'parking' ? '#ff4d4d' : '#b91c1c'} />
          {lights === 'parking' && (
            <>
              <circle cx={x - w * 0.37} cy={y - h * 0.44} r={w * 0.25} fill="#ef4444" opacity=".3" />
              <circle cx={x + w * 0.37} cy={y - h * 0.44} r={w * 0.25} fill="#ef4444" opacity=".3" />
            </>
          )}
          <rect x={x - w * 0.12} y={y - h * 0.38} width={w * 0.24} height={h * 0.1} fill="#f8fafc" stroke="#111" strokeWidth=".6" />
        </>
      )}
      {indicate && (
        <g className="animate-blink">
          <circle cx={indicate === 'left' ? x - w * 0.42 : x + w * 0.42} cy={y - h * 0.44} r={w * 0.12} fill="#fb923c" />
        </g>
      )}
      <rect x={x - w * 0.46} y={y - h * 0.14} width={w * 0.16} height={h * 0.14} rx="2" fill="#111" />
      <rect x={x + w * 0.3} y={y - h * 0.14} width={w * 0.16} height={h * 0.14} rx="2" fill="#111" />
    </g>
  );
}

function TruckFront({ x, y, s }: { x: number; y: number; s: number }) {
  const w = 96 * s;
  const h = 110 * s;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={w * 0.55} ry={h * 0.05} fill="rgba(0,0,0,.35)" />
      <rect x={x - w / 2} y={y - h} width={w} height={h * 0.92} rx={4 * s} fill="#f1f5f9" stroke="#475569" strokeWidth={1.5 * s} />
      <rect x={x - w * 0.42} y={y - h * 0.9} width={w * 0.84} height={h * 0.3} rx={3 * s} fill="#1e293b" />
      <rect x={x - w * 0.4} y={y - h * 0.3} width={w * 0.8} height={h * 0.14} fill="#94a3b8" />
      <circle cx={x - w * 0.36} cy={y - h * 0.4} r={w * 0.07} fill="#fef9c3" />
      <circle cx={x + w * 0.36} cy={y - h * 0.4} r={w * 0.07} fill="#fef9c3" />
    </g>
  );
}

function TramFront({ x, y, s }: { x: number; y: number; s: number }) {
  const w = 120 * s;
  const h = 130 * s;
  return (
    <g>
      <rect x={x - w / 2} y={y - h} width={w} height={h} rx={10 * s} fill="#f59e0b" stroke="#92400e" strokeWidth={2 * s} />
      <rect x={x - w * 0.42} y={y - h * 0.9} width={w * 0.84} height={h * 0.42} rx={6 * s} fill="#1e293b" />
      <rect x={x - w * 0.3} y={y - h * 0.97} width={w * 0.6} height={h * 0.06} fill="#111" />
      <text x={x} y={y - h * 0.935} textAnchor="middle" dominantBaseline="middle" fontSize={7 * s} fill="#fbbf24" fontFamily="Arial">LIGHT RAIL</text>
      <circle cx={x - w * 0.34} cy={y - h * 0.3} r={w * 0.05} fill="#fef9c3" />
      <circle cx={x + w * 0.34} cy={y - h * 0.3} r={w * 0.05} fill="#fef9c3" />
      <rect x={x - w * 0.5} y={y - h * 0.12} width={w} height={h * 0.12} fill="#374151" />
    </g>
  );
}

function Pedestrian({ x, y, s, kind = 'adult' }: { x: number; y: number; s: number; kind?: string }) {
  const sc = kind === 'child' ? 0.68 : 1;
  const h = 70 * s * sc;
  const shirt = kind === 'child' ? '#ec4899' : kind === 'elderly' ? '#7c3aed' : '#0ea5e9';
  return (
    <g>
      <ellipse cx={x} cy={y} rx={h * 0.22} ry={h * 0.05} fill="rgba(0,0,0,.3)" />
      <rect x={x - h * 0.1} y={y - h * 0.48} width={h * 0.08} height={h * 0.48} fill="#1e293b" />
      <rect x={x + h * 0.02} y={y - h * 0.48} width={h * 0.08} height={h * 0.48} fill="#1e293b" />
      <rect x={x - h * 0.14} y={y - h * 0.84} width={h * 0.28} height={h * 0.4} rx={h * 0.06} fill={shirt} />
      <circle cx={x} cy={y - h * 0.92} r={h * 0.1} fill="#c68642" />
      {kind === 'elderly' && <path d={`M${x + h * 0.16} ${y - h * 0.6} L${x + h * 0.2} ${y}`} stroke="#78350f" strokeWidth={h * 0.03} />}
      {kind === 'elderly' && <path d={`M${x - h * 0.1} ${y - h * 0.98} Q${x} ${y - h * 1.08} ${x + h * 0.1} ${y - h * 0.98}`} fill="#e5e7eb" />}
    </g>
  );
}

const DS = 0.8; // pulls objects a little closer to the viewer

function Obj({ o, g, lanesOurs }: { o: PovObject; g: Geo; lanesOurs: number }): ReactNode {
  const d = (o.d ?? 0.5) * DS;
  const k = g.k(d);
  const s = k * (g.lanePx / 150);
  let lane = o.lane ?? -0.5;
  if (o.side === 'left') lane = -lanesOurs - 0.62;
  if (o.side === 'right') lane = 1.62;
  const x = g.x(lane, d);
  const y = g.y(d);
  switch (o.type) {
    case 'car':
    case 'parked-car':
      return <CarRear x={x} y={y} s={s * 1.25} color={o.color ?? 'silver'} oncoming={o.oncoming} indicate={o.indicate} lights={o.lights} />;
    case 'truck':
      return <TruckFront x={x} y={y} s={s * 1.2} />;
    case 'tram':
      return <TramFront x={x} y={y} s={s * 1.3} />;
    case 'ped':
    case 'child':
    case 'elderly':
      return <Pedestrian x={x} y={y} s={s * 1.4} kind={o.type === 'ped' ? 'adult' : o.type} />;
    case 'gravel':
      return (
        <g>
          <ellipse cx={x} cy={y} rx={g.lanePx * k * 0.7} ry={14 * k + 2} fill="#a16207" opacity=".55" />
          {Array.from({ length: 26 }, (_, i) => (
            <circle key={i} cx={x + Math.sin(i * 7.3) * g.lanePx * k * 0.6} cy={y + Math.cos(i * 3.1) * (10 * k + 1)} r={1.6 * k + 0.4} fill="#78350f" />
          ))}
        </g>
      );
    case 'refuge':
      return (
        <g>
          <path d={`M${g.x(-0.25, d + 0.04)},${g.y(d + 0.04)} L${g.x(0.25, d + 0.04)},${g.y(d + 0.04)} L${g.x(0.25, d - 0.04)},${g.y(d - 0.04)} L${g.x(-0.25, d - 0.04)},${g.y(d - 0.04)} Z`} fill="#e7e5e4" stroke="#facc15" strokeWidth="2" />
          <rect x={x - 2} y={y - 36 * k} width="4" height={34 * k} fill="#9ca3af" />
          <rect x={x - 9 * k} y={y - 48 * k} width={18 * k} height={16 * k} fill="#facc15" stroke="#111" strokeWidth="1" />
        </g>
      );
    case 'zebra': {
      const out: ReactNode[] = [];
      const lFrom = o.side === 'left' ? -lanesOurs - 1.2 : -lanesOurs;
      const lTo = o.side === 'left' ? -lanesOurs - 0.1 : 2;
      for (let l = lFrom; l < lTo; l += 0.3) {
        out.push(<path key={l} d={`M${g.x(l, d)},${g.y(d)} L${g.x(l + 0.16, d)},${g.y(d)} L${g.x(l + 0.16, d + 0.05)},${g.y(d + 0.05)} L${g.x(l, d + 0.05)},${g.y(d + 0.05)} Z`} fill="#f8fafc" />);
      }
      return <g>{out}</g>;
    }
    case 'light': {
      const lx = o.side === 'left' ? g.x(-lanesOurs - 0.4, d) : g.x(2.3, d);
      const hh = 150 * k;
      const col = (c: string) => (o.state === c ? (c === 'red' ? '#ef4444' : c === 'yellow' ? '#fbbf24' : '#22c55e') : '#1f2937');
      return (
        <g>
          <rect x={lx - 2.5 * k} y={y - hh} width={5 * k} height={hh} fill="#6b7280" />
          <rect x={lx - 11 * k} y={y - hh - 44 * k} width={22 * k} height={48 * k} rx={4 * k} fill="#111827" stroke="#e5e7eb" strokeWidth={1.2 * k} />
          {['red', 'yellow', 'green'].map((c, i) => (
            <circle key={c} cx={lx} cy={y - hh - 34 * k + i * 14 * k} r={5.5 * k} fill={col(c)} />
          ))}
          {o.state && <circle cx={lx} cy={y - hh - 34 * k + ['red', 'yellow', 'green'].indexOf(o.state) * 14 * k} r={11 * k} fill={col(o.state)} opacity=".3" />}
        </g>
      );
    }
    case 'roadworks-lights':
      return (
        <g>
          <rect x={x - 26 * s} y={y - 18 * s} width={52 * s} height={16 * s} rx={3 * s} fill="#f97316" />
          <circle cx={x - 16 * s} cy={y} r={5 * s} fill="#111" />
          <circle cx={x + 16 * s} cy={y} r={5 * s} fill="#111" />
          <rect x={x - 3 * s} y={y - 90 * s} width={6 * s} height={74 * s} fill="#6b7280" />
          <rect x={x - 10 * s} y={y - 118 * s} width={20 * s} height={34 * s} rx={3 * s} fill="#111827" />
          <circle cx={x} cy={y - 109 * s} r={5 * s} fill="#ef4444" />
          <circle cx={x} cy={y - 95 * s} r={5 * s} fill="#1f2937" />
          <rect x={x + 18 * s} y={y - 64 * s} width={34 * s} height={30 * s} fill="#fff" stroke="#111" strokeWidth={s} />
          <text x={x + 35 * s} y={y - 54 * s} textAnchor="middle" fontSize={7 * s} fontWeight="700" fontFamily="Arial">STOP HERE</text>
          <text x={x + 35 * s} y={y - 44 * s} textAnchor="middle" fontSize={6 * s} fontWeight="700" fontFamily="Arial">ON RED</text>
          <text x={x + 35 * s} y={y - 37 * s} textAnchor="middle" fontSize={6 * s} fontWeight="700" fontFamily="Arial">SIGNAL</text>
        </g>
      );
    case 'cones':
      return (
        <g>
          {[-0.9, -0.6, -0.3, 0].map((l, i) => {
            const dd = d - i * 0.03;
            const cx = g.x(l, dd);
            const cy = g.y(dd);
            const kk = g.k(dd);
            return <path key={l} d={`M${cx - 7 * kk} ${cy} L${cx} ${cy - 22 * kk} L${cx + 7 * kk} ${cy} Z`} fill="#f97316" stroke="#fff" strokeWidth={kk * 1.5} />;
          })}
        </g>
      );
    case 'building-corner':
      return (
        <g>
          <rect x={g.x(1.5, d)} y={y - 170 * k} width={200 * k} height={170 * k} fill="#fca5a5" stroke="#7f1d1d" strokeWidth="1.5" />
          <path d={`M${g.x(1.5, d) - 10 * k} ${y - 170 * k} L${g.x(1.5, d) + 100 * k} ${y - 230 * k} L${g.x(1.5, d) + 210 * k} ${y - 170 * k} Z`} fill="#b91c1c" />
          {[0, 1].map((i) => <rect key={i} x={g.x(1.5, d) + (30 + i * 90) * k} y={y - 130 * k} width={50 * k} height={50 * k} fill="#e0f2fe" stroke="#fff" strokeWidth={3 * k} />)}
        </g>
      );
    case 'overpass':
      return (
        <g>
          <rect x="0" y={y - 40 * k - 10} width={VW} height={20 * k + 8} fill="#9ca3af" />
          <rect x="0" y={y - 40 * k + 10 * k} width={VW} height={4} fill="#6b7280" />
        </g>
      );
    case 'queue':
      return (
        <g>
          {[0.1, 0.05, 0].map((dd, i) => (
            <CarRear key={i} x={g.x(lane, d + dd)} y={g.y(d + dd)} s={g.k(d + dd) * (g.lanePx / 150) * 1.25} color={['red', 'white', 'blue'][i]} />
          ))}
        </g>
      );
    case 'gap': {
      const x0 = g.x(lane, (o.d0 ?? 0.02) * DS);
      const y0 = g.y((o.d0 ?? 0.02) * DS);
      const y1 = g.y((o.d1 ?? 0.4) * DS);
      const x1 = g.x(lane, (o.d1 ?? 0.4) * DS);
      return (
        <g>
          <path d={`M${x0},${y0} L${x1},${y1}`} stroke="#fde047" strokeWidth="4" markerStart="url(#povArrow)" markerEnd="url(#povArrow)" />
          <rect x={(x0 + x1) / 2 + 12} y={(y0 + y1) / 2 - 12} width="54" height="22" rx="6" fill="#0f172a" />
          <text x={(x0 + x1) / 2 + 39} y={(y0 + y1) / 2 + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="800" fill="#fde047" fontFamily="Arial">? sec</text>
        </g>
      );
    }
    case 'swerve':
      return <path d={`M${g.x(-1.5, 0.02)},${g.y(0.02)} C${g.x(-1.5, 0.25)},${g.y(0.25)} ${g.x(-0.5, 0.25)},${g.y(0.3)} ${g.x(-0.5, 0.5)},${g.y(0.5)}`} stroke="#fde047" strokeWidth="6" fill="none" markerEnd="url(#povArrow)" opacity=".9" />;
    default:
      return null;
  }
}

function Mirror({ vehicle }: { vehicle?: string }) {
  return (
    <g>
      <rect x="250" y="6" width="140" height="44" rx="18" fill="#0f172a" stroke="#475569" strokeWidth="3" />
      <rect x="258" y="12" width="124" height="32" rx="14" fill="#7dd3fc" />
      <path d="M258 44 L382 44 L340 22 L300 22 Z" fill="#6b7280" />
      {vehicle === 'ambulance' && (
        <g>
          <rect x="304" y="18" width="32" height="22" rx="4" fill="#f8fafc" stroke="#111" />
          <rect x="310" y="15" width="20" height="4" fill="#ef4444" className="animate-blink" />
          <rect x="318" y="24" width="4" height="12" fill="#dc2626" />
          <rect x="314" y="28" width="12" height="4" fill="#dc2626" />
        </g>
      )}
      <text x="320" y="60" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="Arial" stroke="#0f172a" strokeWidth="3" paintOrder="stroke">REAR VIEW</text>
    </g>
  );
}

export function Pov({ spec, className, hazardMode, onHazard, found }: { spec: VisualSpec; className?: string; hazardMode?: boolean; onHazard?: (i: number) => void; found?: number[] }) {
  const road = spec.road ?? 'two-way';
  const env = spec.env ?? 'day';
  const curve = road === 'curve-left' ? -1 : road === 'curve-right' ? 1 : 0;
  const multi = road === 'multi' || road === 'freeway';
  const lanesOurs = multi ? spec.lanesOurs ?? 2 : 1;
  const lanesOnc = road === 'freeway' ? 0 : multi ? 2 : 1;
  const lanePx = multi ? 118 : road === 'bridge' ? 120 : 150;
  const g = geo(curve, lanePx);
  const sky = env === 'night' ? ['#020617', '#1e293b'] : env === 'wet' ? ['#64748b', '#cbd5e1'] : ['#38bdf8', '#e0f2fe'];
  const grass = env === 'night' ? '#14281c' : spec.country ? '#a3a355' : spec.city ? '#9ca3af' : '#5ea34e';
  const leftEdge = -lanesOurs - (spec.city ? 0.9 : 0.25);
  const rightEdge = road === 'freeway' ? 0.35 : lanesOnc + (spec.city ? 0.9 : 0.25);
  const objs = spec.objects ?? [];
  const sorted = objs.map((o, i) => ({ o, i })).sort((a, b) => (b.o.d ?? 0.5) - (a.o.d ?? 0.5));

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className={className} role="img" aria-label={spec.caption ?? 'Driving scene'}>
      <title>{spec.caption ?? 'Driving scene'}</title>
      <defs>
        <linearGradient id="povSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
        <linearGradient id="povRoad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={env === 'night' ? '#1f2937' : '#6b7280'} />
          <stop offset="1" stopColor={env === 'night' ? '#111827' : env === 'wet' ? '#374151' : '#4b5563'} />
        </linearGradient>
        <marker id="povArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#fde047" />
        </marker>
      </defs>
      <rect width={VW} height={HOR + 2} fill="url(#povSky)" />
      {env === 'night' && Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 137) % 400} cy={(i * 53) % 90} r={i % 3 ? 0.8 : 1.3} fill="#fff" opacity=".7" />)}
      {env !== 'night' && !spec.city && (
        <g>
          <path d={`M0 ${HOR} Q60 ${HOR - 30} 130 ${HOR - 8} T260 ${HOR - 14} T400 ${HOR - 6} L400 ${HOR} Z`} fill={spec.country ? '#7c8f3a' : '#4d8a3f'} opacity=".7" />
          <circle cx="330" cy="30" r="16" fill="#fde68a" opacity={env === 'wet' ? 0 : 0.9} />
        </g>
      )}
      <rect y={HOR} width={VW} height={VH - HOR} fill={grass} />
      {spec.city && (
        <g>
          {[-4, -3.2, -2.5, 2.3, 3.1, 4].map((l, i) => {
            const d = 0.15 + (i % 3) * 0.22;
            const x = g.x(l, d);
            const h = 220 * g.k(d) + 40;
            const w = 70 * g.k(d) + 30;
            return (
              <g key={i}>
                <rect x={x - w / 2} y={g.y(d) - h} width={w} height={h} fill={['#94a3b8', '#cbd5e1', '#64748b'][i % 3]} stroke="#475569" />
                {Array.from({ length: 4 }, (_, r) => <rect key={r} x={x - w / 3} y={g.y(d) - h + 10 + r * (h / 5)} width={w * 0.66} height={h / 12} fill={env === 'night' ? '#fde68a' : '#e0f2fe'} opacity=".8" />)}
              </g>
            );
          })}
        </g>
      )}
      {!spec.city &&
        [-3.2, -2.4, 2.4, 3.2, -4.2, 4.2].map((l, i) => {
          const d = 0.1 + ((i * 0.23) % 0.8);
          const x = g.x(l + (l < 0 ? -lanesOurs + 1 : lanesOnc - 1), d);
          const y = g.y(d);
          const k = g.k(d);
          return spec.country || i % 2 ? (
            <g key={i}>
              <rect x={x - 3 * k - 1} y={y - 90 * k} width={6 * k + 2} height={90 * k} fill="#e7e5e4" />
              <ellipse cx={x} cy={y - 100 * k} rx={40 * k + 4} ry={30 * k + 3} fill={env === 'night' ? '#0f2417' : '#3f7d3a'} />
              <ellipse cx={x - 16 * k} cy={y - 112 * k} rx={22 * k + 2} ry={16 * k + 2} fill={env === 'night' ? '#15301f' : '#5a9e4b'} />
            </g>
          ) : (
            <g key={i}>
              <rect x={x - 40 * k} y={y - 60 * k} width={80 * k} height={60 * k} fill="#fef3c7" stroke="#a16207" />
              <path d={`M${x - 46 * k} ${y - 60 * k} L${x} ${y - 92 * k} L${x + 46 * k} ${y - 60 * k} Z`} fill="#b91c1c" />
              <rect x={x - 10 * k} y={y - 30 * k} width={20 * k} height={30 * k} fill="#78350f" />
            </g>
          );
        })}
      {/* road */}
      <polygon points={roadPoly(g, leftEdge - 0.12, rightEdge + 0.12)} fill={spec.city ? '#d6d3d1' : '#a8a29e'} />
      <polygon points={roadPoly(g, leftEdge, rightEdge)} fill="url(#povRoad)" />
      {road === 'freeway' && <polygon points={roadPoly(g, 0.35, 3)} fill={env === 'night' ? '#14281c' : '#65a30d'} />}
      {spec.junction && (
        <g>
          {(spec.junction === 'cross' || spec.junction === 'left') && <polygon points={`0,${g.y(0.52)} ${g.x(leftEdge, 0.52)},${g.y(0.52)} ${g.x(leftEdge, 0.4)},${g.y(0.4)} 0,${g.y(0.4) + 6}`} fill="url(#povRoad)" />}
          {(spec.junction === 'cross' || spec.junction === 'right') && <polygon points={`${VW},${g.y(0.52)} ${g.x(rightEdge, 0.52)},${g.y(0.52)} ${g.x(rightEdge, 0.4)},${g.y(0.4)} ${VW},${g.y(0.4) + 6}`} fill="url(#povRoad)" />}
        </g>
      )}
      {env === 'wet' && <polygon points={roadPoly(g, leftEdge, rightEdge)} fill="#cbd5e1" opacity=".12" />}
      {/* lines */}
      {road !== 'freeway' &&
        (spec.centre === 'double' || multi ? (
          <g>
            {solid(g, -0.035, '#f8fafc', 2.6, 'c1')}
            {solid(g, 0.035, '#f8fafc', 2.6, 'c2')}
          </g>
        ) : spec.centre === 'solid' ? (
          solid(g, 0, '#f8fafc', 3, 'c')
        ) : (
          dashes(g, 0, '#f8fafc', 3.2, 'c')
        ))}
      {Array.from({ length: lanesOurs - 1 }, (_, i) => (spec.laneLine === 'solid' ? solid(g, -(i + 1), '#f8fafc', 2.6, `ll${i}`) : <g key={`ll${i}`}>{dashes(g, -(i + 1), '#f8fafc', 2.6, `ll${i}`)}</g>))}
      {multi && road !== 'freeway' && <g>{dashes(g, 1, '#f8fafc', 2.6, 'on')}</g>}
      {road === 'freeway' && <g>{solid(g, 0.3, '#fde047', 2.4, 'fe')}</g>}
      {solid(g, leftEdge + 0.05, '#f8fafc', 2, 'el')}
      {road === 'bridge' && (
        <g>
          {[leftEdge - 0.05, rightEdge + 0.05].map((l, i) => (
            <g key={i}>
              <path d={edgePath(g, l, 0.25, 0.9)} stroke="#e5e7eb" strokeWidth="6" fill="none" />
              {Array.from({ length: 10 }, (_, j) => {
                const d = 0.25 + j * 0.065;
                return <rect key={j} x={g.x(l, d) - 2} y={g.y(d) - 26 * g.k(d)} width="3" height={26 * g.k(d)} fill="#9ca3af" />;
              })}
            </g>
          ))}
        </g>
      )}
      {/* night headlights */}
      {env === 'night' && (
        <polygon points={`${g.x(-1.1, 0)},${VH} ${g.x(0.5, 0)},${VH} ${g.x(0.6, spec.headlights === 'high' ? 0.8 : 0.55)},${g.y(spec.headlights === 'high' ? 0.8 : 0.55)} ${g.x(-1.3, spec.headlights === 'high' ? 0.8 : 0.55)},${g.y(spec.headlights === 'high' ? 0.8 : 0.55)}`} fill="#fef9c3" opacity=".16" />
      )}
      {/* objects far → near */}
      {sorted.map(({ o, i }) => {
        const node = <Obj o={o} g={g} lanesOurs={lanesOurs} />;
        const isHazard = HAZARD_TYPES.has(o.type) || !!o.indicate || !!o.highlight;
        if (hazardMode && isHazard) {
          const d = (o.d ?? 0.5) * DS;
          let lane = o.lane ?? -0.5;
          if (o.side === 'left') lane = -lanesOurs - 0.62;
          const cx = o.type === 'building-corner' ? g.x(2.2, d) : g.x(lane, d);
          const cy = g.y(d) - 30 * g.k(d) - 8;
          const isFound = found?.includes(i);
          return (
            <g key={i} onClick={() => onHazard?.(i)} style={{ cursor: 'pointer' }} role="button" aria-label={`Hazard: ${o.type}`}>
              {node}
              <circle cx={cx} cy={cy} r={Math.max(18, 60 * g.k(d))} fill="transparent" />
              {isFound && <circle cx={cx} cy={cy} r={Math.max(16, 46 * g.k(d))} fill="none" stroke="#22c55e" strokeWidth="4" />}
            </g>
          );
        }
        return <g key={i}>{node}</g>;
      })}
      {spec.highlight && <ellipse cx={g.x(spec.highlight.lane, spec.highlight.d * DS)} cy={g.y(spec.highlight.d * DS) - 18} rx="40" ry="24" fill="none" stroke="#fde047" strokeWidth="3" />}
      {objs.filter((o) => o.type === 'mirror').map((o, i) => <Mirror key={`m${i}`} vehicle={o.vehicle} />)}
      {objs.filter((o) => o.label).map((o, i) => <text key={`lb${i}`} x={g.x(o.lane ?? 0, (o.d ?? 0.5) * DS)} y={g.y((o.d ?? 0.5) * DS) - 44 * g.k((o.d ?? 0.5) * DS) - 6} textAnchor="middle" fontSize="16" fontWeight="900" fill="#fde047" stroke="#0f172a" strokeWidth="3" paintOrder="stroke" fontFamily="Arial">{o.label}</text>)}
      {env === 'wet' && (
        <g opacity=".45">
          {Array.from({ length: 60 }, (_, i) => (
            <line key={i} x1={(i * 71) % 400} y1={(i * 37) % 260} x2={((i * 71) % 400) - 4} y2={((i * 37) % 260) + 12} stroke="#e2e8f0" strokeWidth="1.2" />
          ))}
        </g>
      )}
      {/* bonnet */}
      <path d={`M0 ${VH} L0 ${VH - 14} Q200 ${VH - 34} 400 ${VH - 14} L400 ${VH} Z`} fill={env === 'night' ? '#0b1220' : '#1e3a8a'} />
      <path d={`M60 ${VH - 18} Q200 ${VH - 32} 340 ${VH - 18}`} stroke="rgba(255,255,255,.25)" strokeWidth="2" fill="none" />
    </svg>
  );
}
