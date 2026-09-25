// Original SVG recreations of road signs referenced by the question bank.
// These are stylised game artwork (not official sign files).
import type { ReactNode } from 'react';
import { Arrow, Bicycle, BusIcon, CarIcon, Cow, Kangaroo, Person, Sheep, Truck, Wheelchair, Worker } from './pictograms';

const Y = '#ffd200';
const INK = '#111';
const RED = '#d71920';
const GREEN = '#00703c';
const BLUE = '#0b5cad';
const F = 'Arial, Helvetica, sans-serif';

type SignDef = { w: number; h: number; post?: boolean; render: () => ReactNode; label: string };

const T = (x: number, y: number, s: number, text: string, fill = INK, weight = 700, anchor: 'middle' | 'start' = 'middle', ls = 0) => (
  <text key={`${text}-${x}-${y}`} x={x} y={y} fontSize={s} fontFamily={F} fontWeight={weight} fill={fill} textAnchor={anchor} letterSpacing={ls} dominantBaseline="middle">
    {text}
  </text>
);

function Diamond({ children, plate }: { children?: ReactNode; plate?: ReactNode }) {
  return (
    <g>
      <rect x="18" y="18" width="84" height="84" rx="7" transform="rotate(45 60 60)" fill={Y} stroke={INK} strokeWidth="3" />
      <rect x="23" y="23" width="74" height="74" rx="5" transform="rotate(45 60 60)" fill="none" stroke={INK} strokeWidth="2.2" />
      {children}
      {plate}
    </g>
  );
}

function Plate({ y = 124, lines, w = 56 }: { y?: number; lines: string[]; w?: number }) {
  const h = 10 + lines.length * 12;
  return (
    <g>
      <rect x={60 - w / 2} y={y} width={w} height={h} rx="4" fill={Y} stroke={INK} strokeWidth="2.5" />
      {lines.map((l, i) => T(60, y + 11 + i * 12, 11, l))}
    </g>
  );
}

function Panel({ w, h, fill = '#fff', stroke = INK, children, rx = 7 }: { w: number; h: number; fill?: string; stroke?: string; children?: ReactNode; rx?: number }) {
  return (
    <g>
      <rect x="2" y="2" width={w - 4} height={h - 4} rx={rx} fill={fill} stroke={stroke} strokeWidth="3" />
      <rect x="6" y="6" width={w - 12} height={h - 12} rx={rx - 2} fill="none" stroke={stroke} strokeWidth="2" opacity={fill === '#fff' ? 1 : 0.9} />
      {children}
    </g>
  );
}

function SpeedRing({ cx, cy, r, n }: { cx: number; cy: number; r: number; n: number | string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={RED} strokeWidth={r * 0.2} />
      {T(cx, cy + 1, String(n).length > 2 ? r * 0.82 : r * 1.0, String(n), INK, 700, 'middle', -1)}
    </g>
  );
}

function Octagon({ cx, cy, r, children, fill = RED }: { cx: number; cy: number; r: number; children?: ReactNode; fill?: string }) {
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 8) * (2 * i + 1);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
  const pts2 = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 8) * (2 * i + 1);
    return `${cx + r * 0.9 * Math.cos(a)},${cy + r * 0.9 * Math.sin(a)}`;
  }).join(' ');
  return (
    <g>
      <polygon points={pts} fill={fill} stroke="#fff" strokeWidth="1" />
      <polygon points={pts2} fill="none" stroke="#fff" strokeWidth={r * 0.06} />
      {children}
    </g>
  );
}

function GiveWayTriangle({ cx, top, w, text = true, children }: { cx: number; top: number; w: number; text?: boolean; children?: ReactNode }) {
  const h = w * 0.87;
  return (
    <g>
      <path d={`M${cx - w / 2} ${top} L${cx + w / 2} ${top} L${cx} ${top + h} Z`} fill={RED} strokeLinejoin="round" stroke={RED} strokeWidth="4" />
      <path d={`M${cx - w / 2 + w * 0.2} ${top + w * 0.11} L${cx + w / 2 - w * 0.2} ${top + w * 0.11} L${cx} ${top + h - w * 0.24} Z`} fill="#fff" />
      {text && (
        <>
          {T(cx, top + w * 0.22, w * 0.15, 'GIVE')}
          {T(cx, top + w * 0.38, w * 0.15, 'WAY')}
        </>
      )}
      {children}
    </g>
  );
}

function Crossbuck({ cx, cy, s = 1, tracks = false }: { cx: number; cy: number; s?: number; tracks?: boolean }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {[35, -35].map((r) => (
        <g key={r} transform={`rotate(${r})`}>
          <rect x="-44" y="-8" width="88" height="16" fill="#fff" stroke={INK} strokeWidth="2" />
          {T(0, 1, 10, r > 0 ? 'RAILWAY' : 'CROSSING', INK, 700, 'middle', 1)}
        </g>
      ))}
      {tracks && (
        <g>
          <rect x="-15" y="16" width="30" height="16" fill="#fff" stroke={INK} strokeWidth="1.5" />
          {T(0, 21, 7, '2')}
          {T(0, 28, 6, 'TRACKS')}
        </g>
      )}
    </g>
  );
}

function Lights({ cx, y }: { cx: number; y: number }) {
  return (
    <g>
      <rect x={cx - 38} y={y - 3} width="76" height="6" fill={INK} />
      <circle cx={cx - 30} cy={y} r="10" fill={INK} />
      <circle cx={cx - 30} cy={y} r="7" fill={RED} />
      <circle cx={cx + 30} cy={y} r="10" fill={INK} />
      <circle cx={cx + 30} cy={y} r="7" fill="#3b0d0d" />
    </g>
  );
}

const SIGNS: Record<string, SignDef> = {
  'give-way': { w: 120, h: 130, post: true, label: 'Give Way sign', render: () => <GiveWayTriangle cx={60} top={8} w={108} /> },
  stop: { w: 120, h: 130, post: true, label: 'Stop sign', render: () => <Octagon cx={60} cy={60} r={56}>{T(60, 62, 30, 'STOP', '#fff', 800)}</Octagon> },
  'taxi-zone-left': {
    w: 90, h: 130, post: true, label: 'Taxi Zone sign with arrow',
    render: () => (
      <Panel w={90} h={130}>
        <rect x="12" y="14" width="66" height="44" rx="3" fill={RED} />
        {T(45, 27, 16, 'TAXI', '#fff')}
        {T(45, 46, 16, 'ZONE', '#fff')}
        <Arrow d="M70 100 L24 100" color={RED} width={5} head={9} />
      </Panel>
    ),
  },
  'give-way-to-buses': {
    w: 120, h: 130, label: 'Give way to buses sign (displayed on the rear of a bus)',
    render: () => (
      <Panel w={120} h={130} stroke={GREEN}>
        <path d="M24 70 C40 50 70 44 86 30" stroke={GREEN} strokeWidth="12" fill="none" />
        <path d="M78 18 L102 22 L90 44 Z" fill={GREEN} />
        <rect x="16" y="76" width="36" height="40" rx="4" fill={GREEN} />
        {[20, 29, 38].map((x) => <rect key={x} x={x} y="81" width="7" height="8" fill="#fff" />)}
        <circle cx="24" cy="112" r="4" fill="#fff" />
        <circle cx="44" cy="112" r="4" fill="#fff" />
        {T(86, 62, 15, 'GIVE', RED)}
        {T(86, 79, 15, 'WAY', RED)}
        <CarIcon x={86} y={102} s={0.9} color={RED} />
      </Panel>
    ),
  },
  'bus-lane': {
    w: 90, h: 120, post: true, label: 'Bus Lane sign',
    render: () => (
      <Panel w={90} h={120}>
        <rect x="12" y="14" width="18" height="18" rx="3" fill={RED} />
        {T(21, 24, 14, 'B', '#fff')}
        <BusIcon x={58} y={23} s={0.62} />
        {T(45, 52, 20, 'LANE')}
        <Arrow d="M34 76 L56 98" width={5} head={9} />
      </Panel>
    ),
  },
  'farm-animals-5km': {
    w: 140, h: 110, label: 'Farm animals sign with 5 KM',
    render: () => (
      <Panel w={140} h={110} fill={Y}>
        {T(70, 26, 22, '5 KM')}
        <Cow x={54} y={70} s={1.5} />
        <Sheep x={104} y={76} s={1.15} />
      </Panel>
    ),
  },
  motorway: {
    w: 90, h: 130, post: true, label: 'Motorway sign',
    render: () => (
      <Panel w={90} h={130} fill={GREEN} stroke="#fff">
        <path d="M22 118 L38 30 L52 30 L68 118 Z" fill="#fff" />
        <path d="M43 118 L45 30 L47 30 L47 118 Z" fill={GREEN} />
        <rect x="16" y="44" width="58" height="10" fill="#fff" />
        <rect x="16" y="41" width="58" height="3" fill={GREEN} />
      </Panel>
    ),
  },
  workers: {
    w: 140, h: 100, label: 'Workers ahead sign',
    render: () => (
      <Panel w={140} h={100} fill={Y}>
        <Worker x={52} y={56} s={1.6} />
      </Panel>
    ),
  },
  'lane-ends-left': {
    w: 150, h: 90, label: 'Left lane ends sign',
    render: () => (
      <Panel w={150} h={90} fill={Y}>
        <path d="M24 26 L58 26 L58 34 L45 34 L45 72 L37 72 L37 34 L24 34 Z" fill={INK} />
        <Arrow d="M86 74 L86 34" width={9} head={10} />
        <Arrow d="M122 74 L122 34" width={9} head={10} />
      </Panel>
    ),
  },
  'railway-stop': {
    w: 120, h: 170, post: true, label: 'Railway crossing sign with STOP sign',
    render: () => (
      <g>
        <Crossbuck cx={60} cy={40} s={1.1} />
        <Octagon cx={60} cy={122} r={32}>{T(60, 123, 17, 'STOP', '#fff', 800)}</Octagon>
      </g>
    ),
  },
  'railway-giveway': {
    w: 120, h: 170, post: true, label: 'Railway crossing sign (2 tracks) with Give Way triangle',
    render: () => (
      <g>
        <Crossbuck cx={60} cy={40} s={1.1} tracks />
        <GiveWayTriangle cx={60} top={104} w={50} text={false} />
      </g>
    ),
  },
  'railway-lights': {
    w: 120, h: 170, post: true, label: 'Railway crossing with flashing lights and STOP ON RED SIGNAL sign',
    render: () => (
      <g>
        <Crossbuck cx={60} cy={34} s={1.05} tracks />
        <Lights cx={60} y={100} />
        <rect x="42" y="118" width="36" height="34" fill={RED} />
        {T(60, 128, 10, 'STOP', '#fff')}
        {T(60, 139, 6, 'ON RED', '#fff')}
        {T(60, 146, 6, 'SIGNAL', '#fff')}
      </g>
    ),
  },
  'transit-t2': { w: 100, h: 130, post: true, label: 'T2 Transit Lane sign', render: () => <Transit n="T2" /> },
  'transit-t3': { w: 100, h: 130, post: true, label: 'T3 Transit Lane sign', render: () => <Transit n="T3" /> },
  'local-traffic-40': {
    w: 100, h: 150, post: true, label: 'Local Traffic Area 40 sign',
    render: () => (
      <g>
        <rect x="4" y="4" width="92" height="74" rx="5" fill={BLUE} stroke="#fff" strokeWidth="3" />
        <path d="M22 44 L50 22 L78 44 L72 44 L72 58 L28 58 L28 44 Z" fill="#fff" />
        <rect x="44" y="44" width="12" height="14" fill={BLUE} />
        {T(50, 66, 10, 'LOCAL TRAFFIC', '#fff')}
        {T(50, 74, 7, 'AREA', '#fff')}
        <rect x="4" y="80" width="92" height="66" rx="5" fill="#fff" stroke={INK} strokeWidth="3" />
        <SpeedRing cx={50} cy={113} r={27} n={40} />
      </g>
    ),
  },
  'shared-zone-10': {
    w: 100, h: 150, post: true, label: 'Shared Zone sign with 10 km/h limit',
    render: () => (
      <g>
        <rect x="4" y="4" width="92" height="96" rx="7" fill={BLUE} stroke="#fff" strokeWidth="3" />
        <Person x={40} y={50} s={1.2} color="#fff" />
        <Person x={60} y={54} s={1.0} color="#fff" child />
        <CarIcon x={50} y={82} s={1.2} color="#fff" />
        <rect x="14" y="104" width="72" height="42" rx="5" fill="#fff" stroke={INK} strokeWidth="3" />
        <SpeedRing cx={50} cy={125} r={17} n={10} />
      </g>
    ),
  },
  'school-zone-40': {
    w: 130, h: 150, post: true, label: 'School Zone 40 sign with times',
    render: () => (
      <g>
        <rect x="3" y="3" width="124" height="144" rx="7" fill="#fff" stroke={INK} strokeWidth="3" />
        <rect x="8" y="8" width="114" height="40" rx="4" fill={Y} />
        {T(65, 20, 15, 'SCHOOL')}
        {T(65, 38, 15, 'ZONE')}
        {T(36, 66, 13, '8 - 9:30')}
        {T(36, 80, 9, 'AM')}
        {T(36, 98, 13, '2:30 - 4')}
        {T(36, 112, 9, 'PM')}
        {T(36, 132, 12, 'MON - FRI')}
        <SpeedRing cx={96} cy={96} r={24} n={40} />
      </g>
    ),
  },
  'speed-50': { w: 90, h: 120, post: true, label: '50 km/h speed limit sign', render: () => <Panel w={90} h={120}><SpeedRing cx={45} cy={60} r={36} n={50} /></Panel> },
  'speed-60': { w: 90, h: 120, post: true, label: '60 km/h speed limit sign', render: () => <Panel w={90} h={120}><SpeedRing cx={45} cy={60} r={36} n={60} /></Panel> },
  'speed-100': { w: 90, h: 120, post: true, label: '100 km/h speed limit sign', render: () => <Panel w={90} h={120}><SpeedRing cx={45} cy={60} r={36} n={100} /></Panel> },
  'speed-40': { w: 90, h: 120, post: true, label: '40 km/h speed limit sign', render: () => <Panel w={90} h={120}><SpeedRing cx={45} cy={60} r={36} n={40} /></Panel> },
  'speed-80': { w: 90, h: 120, post: true, label: '80 km/h speed limit sign', render: () => <Panel w={90} h={120}><SpeedRing cx={45} cy={60} r={36} n={80} /></Panel> },
  'no-entry': {
    w: 90, h: 130, post: true, label: 'No Entry sign',
    render: () => (
      <Panel w={90} h={130}>
        <circle cx="45" cy="46" r="32" fill={RED} />
        <rect x="21" y="40" width="48" height="12" rx="2" fill="#fff" />
        {T(45, 94, 18, 'NO')}
        {T(45, 112, 18, 'ENTRY')}
      </Panel>
    ),
  },
  'keep-left': {
    w: 90, h: 120, post: true, label: 'Keep Left sign',
    render: () => (
      <Panel w={90} h={120}>
        {T(45, 24, 18, 'KEEP')}
        {T(45, 44, 18, 'LEFT')}
        <path d="M70 62 L32 98" stroke={INK} strokeWidth="9" />
        <path d="M20 110 L24 84 L46 106 Z" fill={INK} />
      </Panel>
    ),
  },
  'right-lane-must-turn-right': {
    w: 90, h: 130, post: true, label: 'Right Lane Must Turn Right sign',
    render: () => (
      <Panel w={90} h={130}>
        {['RIGHT', 'LANE', 'MUST', 'TURN', 'RIGHT'].map((w, i) => T(45, 22 + i * 21, 16, w))}
      </Panel>
    ),
  },
  'two-way': {
    w: 90, h: 120, post: true, label: 'Two Way sign',
    render: () => (
      <Panel w={90} h={120}>
        <Arrow d="M32 62 L32 22" width={8} head={10} />
        <Arrow d="M58 20 L58 60" width={8} head={10} />
        {T(45, 82, 17, 'TWO')}
        {T(45, 102, 17, 'WAY')}
      </Panel>
    ),
  },
  'no-right-turn': { w: 90, h: 130, post: true, label: 'No Right Turn sign', render: () => <NoTurn dir="right" /> },
  'no-left-turn': { w: 90, h: 130, post: true, label: 'No Left Turn sign', render: () => <NoTurn dir="left" /> },
  'left-only': {
    w: 100, h: 110, label: 'Left turn ONLY sign',
    render: () => (
      <Panel w={100} h={110}>
        <path d="M62 78 L62 50 C62 36 54 30 42 30" stroke={INK} strokeWidth="10" fill="none" />
        <path d="M26 30 L46 16 L46 44 Z" fill={INK} />
        {T(50, 94, 18, 'ONLY')}
      </Panel>
    ),
  },
  'one-way-left': {
    w: 100, h: 110, post: true, label: 'One Way sign (arrow left)',
    render: () => (
      <Panel w={100} h={110}>
        {T(50, 26, 20, 'ONE')}
        {T(50, 50, 20, 'WAY')}
        <Arrow d="M82 82 L28 82" width={7} head={10} />
      </Panel>
    ),
  },
  'kangaroo-30km': { w: 120, h: 160, post: true, label: 'Kangaroo warning sign, NEXT 30 km', render: () => <Diamond plate={<Plate y={122} lines={['NEXT', '30 km']} w={44} />}><Kangaroo x={62} y={60} s={1.25} /></Diamond> },
  't-junction': { w: 120, h: 130, post: true, label: 'T-intersection ahead sign', render: () => <Diamond><path d="M32 40 L88 40 L88 54 L67 54 L67 90 L53 90 L53 54 L32 54 Z" fill={INK} /></Diamond> },
  clearway: {
    w: 90, h: 120, post: true, label: 'Clearway sign',
    render: () => (
      <Panel w={90} h={120}>
        {T(45, 20, 13, 'CLEARWAY')}
        <circle cx="45" cy="50" r="17" fill="#fff" stroke={RED} strokeWidth="5" />
        {T(45, 51, 22, 'C', RED)}
        {T(45, 82, 10, '6AM - 10AM')}
        {T(45, 96, 10, '3PM - 7PM')}
        {T(45, 108, 9, 'MON - FRI')}
      </Panel>
    ),
  },
  'narrow-bridge': { w: 120, h: 130, post: true, label: 'Narrow Bridge warning sign', render: () => <Diamond>{T(60, 52, 13, 'NARROW')}{T(60, 70, 13, 'BRIDGE')}</Diamond> },
  slippery: {
    w: 120, h: 160, post: true, label: 'Slippery when wet sign',
    render: () => (
      <Diamond plate={<Plate y={122} lines={['WHEN', 'WET']} w={48} />}>
        <CarIcon x={62} y={44} s={0.95} />
        <path d="M44 62 C54 70 36 76 48 84 M60 60 C70 68 52 76 64 84 M76 62 C86 70 68 76 80 84" stroke={INK} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      </Diamond>
    ),
  },
  'winding-road': { w: 120, h: 130, post: true, label: 'Winding road ahead sign', render: () => <Diamond><path d="M56 94 C56 80 72 76 70 64 C68 52 50 52 52 42 L52 36" stroke={INK} strokeWidth="9" fill="none" /><path d="M40 38 L53 20 L64 38 Z" fill={INK} /></Diamond> },
  dip: { w: 120, h: 130, post: true, label: 'Dip sign', render: () => <Diamond>{T(60, 62, 28, 'DIP', INK, 800)}</Diamond> },
  'hook-bend-right': { w: 120, h: 130, post: true, label: 'Sharp bend to the right sign', render: () => <Diamond><path d="M50 94 L50 50 C50 34 72 34 72 50 L72 58" stroke={INK} strokeWidth="9" fill="none" /><path d="M62 56 L82 56 L72 72 Z" fill={INK} /></Diamond> },
  'children-crossing': { w: 120, h: 130, post: true, label: 'Children crossing ahead sign', render: () => <Diamond><Person x={70} y={66} s={1.25} /><Person x={50} y={70} s={1.15} child /></Diamond> },
  crossroads: { w: 120, h: 130, post: true, label: 'Crossroads ahead sign', render: () => <Diamond><rect x="53" y="28" width="14" height="64" fill={INK} /><rect x="28" y="53" width="64" height="14" fill={INK} /></Diamond> },
  'give-way-ahead': { w: 120, h: 130, post: true, label: 'Give Way sign ahead', render: () => <Diamond><Arrow d="M60 58 L60 30" width={8} head={8} /><GiveWayTriangle cx={60} top={62} w={34} text={false} /></Diamond> },
  'trucks-entering': { w: 120, h: 130, post: true, label: 'Trucks entering sign', render: () => <Diamond><Truck x={60} y={60} s={1.15} /></Diamond> },
  pedestrians: { w: 120, h: 130, post: true, label: 'Pedestrians ahead sign', render: () => <Diamond><Person x={50} y={66} s={1.25} /><Person x={70} y={68} s={1.15} walking={false} /></Diamond> },
  'ped-crossing-ahead': {
    w: 120, h: 130, post: true, label: 'Pedestrian crossing ahead sign',
    render: () => (
      <Diamond>
        <Arrow d="M60 48 L60 26" width={7} head={7} />
        <circle cx="60" cy="72" r="18" fill="none" stroke={INK} strokeWidth="3" />
        <Person x={60} y={78} s={0.9} />
      </Diamond>
    ),
  },
  'ped-crossing': {
    w: 120, h: 130, post: true, label: 'Pedestrian crossing sign',
    render: () => (
      <Diamond>
        {[34, 46, 58, 70, 82].map((x) => <rect key={x} x={x - 4} y="80" width="7" height="8" fill={INK} />)}
        <Person x={60} y={66} s={1.3} />
      </Diamond>
    ),
  },
  'divided-road-ends': { w: 120, h: 130, post: true, label: 'Divided road ends sign', render: () => <Diamond><path d="M40 92 L40 70 C40 58 52 54 54 44 L54 26 L66 26 L66 44 C68 54 80 58 80 70 L80 92 L68 92 L68 72 C68 66 62 62 60 58 C58 62 52 66 52 72 L52 92 Z" fill={INK} /></Diamond> },
  'divided-road-ahead': { w: 120, h: 130, post: true, label: 'Divided road ahead sign', render: () => <Diamond><path d="M53 94 L53 64 L36 34 L48 28 L60 50 L72 28 L84 34 L67 64 L67 94 Z" fill={INK} /></Diamond> },
  bicycles: { w: 120, h: 130, post: true, label: 'Bicycles sign', render: () => <Diamond><Bicycle x={60} y={58} s={1.15} /></Diamond> },
  'signals-out-stop': {
    w: 120, h: 130, post: true, label: 'Stop sign with traffic signal symbol',
    render: () => (
      <Octagon cx={60} cy={60} r={56}>
        {[30, 60, 90].map((y) => <circle key={y} cx="60" cy={y} r="13" fill={INK} />)}
        {T(60, 62, 28, 'STOP', '#fff', 800)}
      </Octagon>
    ),
  },
  'stop-ahead': { w: 120, h: 130, post: true, label: 'Stop sign ahead', render: () => <Diamond><Arrow d="M60 56 L60 28" width={8} head={8} /><Octagon cx={60} cy={76} r={16} /></Diamond> },
  'traffic-controller': {
    w: 130, h: 100, label: 'Traffic controller ahead sign',
    render: () => (
      <g>
        <rect x="3" y="3" width="124" height="94" rx="5" fill="#1a1a1a" stroke="#f59e0b" strokeWidth="3" />
        <Person x={58} y={64} s={1.6} color="#f59e0b" walking={false} />
        <path d="M70 38 L84 38 L84 80" stroke="#f59e0b" strokeWidth="3" fill="none" />
        <circle cx="86" cy="32" r="10" fill="#f59e0b" />
      </g>
    ),
  },
  'steep-descent': { w: 120, h: 130, post: true, label: 'Steep descent sign', render: () => <Diamond><path d="M32 82 L88 82 L32 46 Z" fill={INK} /><CarIcon x={56} y={52} s={0.7} /></Diamond> },
  'railway-lights-ahead': { w: 120, h: 130, post: true, label: 'Railway crossing with flashing signals ahead sign', render: () => <Diamond><path d="M40 34 L80 70 M80 34 L40 70" stroke={INK} strokeWidth="7" /><circle cx="46" cy="80" r="8" fill="none" stroke={INK} strokeWidth="3" /><circle cx="74" cy="80" r="8" fill="none" stroke={INK} strokeWidth="3" /><rect x="58" y="52" width="4" height="44" fill={INK} /></Diamond> },
  'road-narrows': { w: 120, h: 130, post: true, label: 'Road narrows sign', render: () => <Diamond><path d="M44 94 L44 70 C44 58 52 54 52 42 L52 26" stroke={INK} strokeWidth="8" fill="none" /><path d="M76 94 L76 70 C76 58 68 54 68 42 L68 26" stroke={INK} strokeWidth="8" fill="none" /></Diamond> },
  'no-stopping': {
    w: 90, h: 120, post: true, label: 'No Stopping sign',
    render: () => (
      <g>
        <rect x="3" y="3" width="84" height="114" rx="7" fill={RED} stroke="#fff" strokeWidth="2" />
        <rect x="8" y="8" width="74" height="104" rx="5" fill="none" stroke="#fff" strokeWidth="2" />
        {T(45, 36, 22, 'NO', '#fff')}
        {T(45, 60, 14, 'STOPPING', '#fff')}
        <path d="M18 94 L72 94" stroke="#fff" strokeWidth="3" />
        <path d="M14 94 L24 88 L24 100 Z M76 94 L66 88 L66 100 Z" fill="#fff" />
      </g>
    ),
  },
  'railway-ahead': {
    w: 120, h: 170, post: true, label: 'Railway level crossing ahead sign with Give Way triangle',
    render: () => (
      <g>
        <GiveWayTriangle cx={60} top={4} w={50} text={false} />
        <g transform="translate(0 50)">
          <Diamond>
            <path d="M38 38 L82 82 M82 38 L38 82" stroke={INK} strokeWidth="8" />
            {T(60, 34, 9, 'RAIL')}
            {T(60, 88, 7, 'CROSSING')}
          </Diamond>
        </g>
      </g>
    ),
  },
  'side-road-left': { w: 120, h: 130, post: true, label: 'Side road intersection on the left sign', render: () => <Diamond><rect x="58" y="26" width="14" height="68" fill={INK} /><rect x="34" y="53" width="26" height="14" fill={INK} /></Diamond> },
  'curve-35': { w: 120, h: 160, post: true, label: 'Curve to the right ahead, advisory speed 35 km/h', render: () => <Diamond plate={<Plate y={122} lines={['35', 'km/h']} w={40} />}><path d="M50 92 L50 64 C50 50 58 44 70 42" stroke={INK} strokeWidth="9" fill="none" /><path d="M66 30 L86 42 L66 54 Z" fill={INK} /></Diamond> },
  'keep-left-unless-overtaking': {
    w: 140, h: 80, post: true, label: 'Keep Left Unless Overtaking sign',
    render: () => (
      <Panel w={140} h={80}>
        {T(70, 22, 13, 'KEEP LEFT')}
        {T(70, 40, 13, 'UNLESS')}
        {T(70, 58, 13, 'OVERTAKING')}
      </Panel>
    ),
  },
  'roundabout-giveway': {
    w: 120, h: 130, post: true, label: 'Roundabout Give Way sign',
    render: () => (
      <GiveWayTriangle cx={60} top={8} w={108} text={false}>
        <g transform="translate(60 42)">
          {[0, 120, 240].map((r) => (
            <g key={r} transform={`rotate(${r})`}>
              <path d="M-4 -15 A15 15 0 0 1 13 -6" stroke={INK} strokeWidth="4" fill="none" />
              <path d="M9 -11 L17 -3 L7 -2 Z" fill={INK} />
            </g>
          ))}
        </g>
      </GiveWayTriangle>
    ),
  },
  crest: { w: 120, h: 130, post: true, label: 'Crest sign', render: () => <Diamond>{T(60, 62, 22, 'CREST', INK, 800)}</Diamond> },
  hump: { w: 120, h: 130, post: true, label: 'Hump in road sign', render: () => <Diamond><path d="M30 76 C44 76 44 50 60 50 C76 50 76 76 90 76 Z" fill={INK} /></Diamond> },
  cattle: { w: 120, h: 130, post: true, label: 'Farm animals warning sign', render: () => <Diamond><Cow x={52} y={58} s={1.2} /><Sheep x={84} y={66} s={0.8} /></Diamond> },
  'disabled-parking': {
    w: 80, h: 110, post: true, label: 'Disability parking sign',
    render: () => (
      <g>
        <rect x="3" y="3" width="74" height="104" rx="7" fill="#fff" stroke={BLUE} strokeWidth="3" />
        <rect x="12" y="14" width="56" height="48" fill={BLUE} />
        <Wheelchair x={40} y={46} s={1.2} />
      </g>
    ),
  },
  'left-on-red': {
    w: 90, h: 130, post: true, label: 'Left Turn On Red Permitted After Stopping sign',
    render: () => <Panel w={90} h={130}>{['LEFT', 'TURN', 'ON RED', 'PERMITTED', 'AFTER', 'STOPPING'].map((w, i) => T(45, 20 + i * 18, w.length > 7 ? 12 : 15, w))}</Panel>,
  },
  'do-not-overtake-turning': {
    w: 140, h: 70, label: 'Do Not Overtake Turning Vehicle sign',
    render: () => <Panel w={140} h={70}>{T(70, 24, 11, 'DO NOT OVERTAKE')}{T(70, 44, 11, 'TURNING VEHICLE')}</Panel>,
  },
  'children-crossing-flag': {
    w: 110, h: 110, label: 'Hand-held CHILDREN CROSSING STOP sign',
    render: () => (
      <Octagon cx={55} cy={55} r={52}>
        {T(55, 30, 9, 'CHILDREN', '#fff')}
        {T(55, 42, 9, 'CROSSING', '#fff')}
        {T(55, 66, 26, 'STOP', '#fff', 800)}
      </Octagon>
    ),
  },
};

function Transit({ n }: { n: string }) {
  return (
    <Panel w={100} h={130}>
      {T(50, 20, 15, 'TRANSIT')}
      {T(50, 38, 15, 'LANE')}
      <rect x="22" y="50" width="56" height="40" rx="10" fill={RED} />
      {T(50, 71, 30, n, '#fff', 800)}
      {T(50, 102, 8, '6.00AM - 10.00AM')}
      {T(50, 116, 11, 'MON TO FRI')}
    </Panel>
  );
}

function NoTurn({ dir }: { dir: 'left' | 'right' }) {
  const flip = dir === 'left' ? 'scale(-1 1) translate(-90 0)' : undefined;
  return (
    <Panel w={90} h={130}>
      <g transform={flip}>
        <path d="M36 70 L36 44 C36 34 42 30 52 30 L56 30" stroke={INK} strokeWidth="8" fill="none" />
        <path d="M54 18 L70 30 L54 42 Z" fill={INK} />
      </g>
      <circle cx="45" cy="44" r="27" fill="none" stroke={RED} strokeWidth="6" />
      <path d="M26 25 L64 63" stroke={RED} strokeWidth="6" />
      {T(45, 88, 15, 'NO')}
      {T(45, 104, 13, dir === 'left' ? 'LEFT' : 'RIGHT')}
      {T(45, 119, 13, 'TURN')}
    </Panel>
  );
}

export const SIGN_IDS = Object.keys(SIGNS);

export function signLabel(id: string): string {
  return SIGNS[id]?.label ?? 'Road sign';
}

/** Renders a sign as a standalone <svg>. */
export function SignArt({ id, className, post = true, title }: { id: string; className?: string; post?: boolean; title?: string }) {
  const def = SIGNS[id];
  if (!def) {
    return (
      <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Sign unavailable">
        <rect x="4" y="4" width="112" height="112" rx="10" fill="#334155" />
        {T(60, 60, 12, 'SIGN', '#94a3b8')}
      </svg>
    );
  }
  const showPost = post && def.post;
  const h = def.h + (showPost ? 28 : 0);
  return (
    <svg viewBox={`0 0 ${def.w} ${h}`} className={className} role="img" aria-label={title ?? def.label}>
      <title>{title ?? def.label}</title>
      {showPost && <rect x={def.w / 2 - 3.5} y={def.h - 12} width="7" height="40" fill="#9ca3af" />}
      {def.render()}
    </svg>
  );
}

/** Renders a sign inside a parent <svg> at a given position/size (used in scenes). */
export function SignInline({ id, x, y, size }: { id: string; x: number; y: number; size: number }) {
  const def = SIGNS[id];
  if (!def) return null;
  const s = size / Math.max(def.w, def.h);
  return (
    <g transform={`translate(${x - (def.w * s) / 2} ${y - def.h * s}) scale(${s})`}>
      <rect x={def.w / 2 - 3} y={def.h - 10} width="6" height={size * 0.6 / s} fill="#9ca3af" />
      {def.render()}
    </g>
  );
}
