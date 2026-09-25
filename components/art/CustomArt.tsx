'use client';
// One-off illustrations recreated from specific source diagrams/photos.
import type { ReactNode } from 'react';
import type { VisualSpec } from '@/lib/types';
import type { SceneInteraction } from './Scene';
import { SignInline } from './Sign';
import { LabelBubble, PersonTop, VehicleTop } from './vehicles';
import { Person } from './pictograms';

const ROAD = '#4b5563';

function Pickable({ id, it, children, x, y, w, h }: { id: string; it?: SceneInteraction; children: ReactNode; x: number; y: number; w: number; h: number }) {
  const can = !!it?.pickable?.includes(id);
  const good = it?.good?.includes(id);
  const bad = it?.bad?.includes(id);
  const picked = it?.picked?.includes(id);
  return (
    <g onClick={can ? () => it?.onPick?.(id) : undefined} style={{ cursor: can ? 'pointer' : undefined }} role={can ? 'button' : undefined} aria-label={can ? `Choose ${id}` : undefined}>
      {children}
      {(can || good || bad) && (
        <rect x={x} y={y} width={w} height={h} rx="10" fill={good ? 'rgba(34,197,94,.25)' : bad ? 'rgba(239,68,68,.25)' : picked ? 'rgba(37,99,235,.25)' : 'transparent'} stroke={good ? '#22c55e' : bad ? '#ef4444' : '#fde047'} strokeWidth={good || bad ? 4 : 2} strokeDasharray={good || bad ? undefined : '6 5'} />
      )}
    </g>
  );
}

function tone(id: string, it?: SceneInteraction) {
  return it?.good?.includes(id) ? 'good' : it?.bad?.includes(id) ? 'bad' : it?.picked?.includes(id) ? 'picked' : 'default';
}

function ParkingMethods({ it }: { it?: SceneInteraction }) {
  const cols = [
    { id: 'M', rot: 30, x: 70 },
    { id: 'N', rot: 0, x: 200 },
    { id: 'O', rot: -30, x: 330 },
  ];
  return (
    <g>
      {cols.map((c) => (
        <Pickable key={c.id} id={c.id} it={it} x={c.x - 60} y={10} w={120} h={280}>
          <rect x={c.x - 58} y={10} width="116" height="280" fill={ROAD} />
          <rect x={c.x - 62} y={10} width="6" height="280" fill="#d6d3d1" />
          {[0, 1, 2, 3, 4, 5, 6].map((k) => <rect key={k} x={c.x + 12} y={20 + k * 40} width="3" height="22" fill="#f8fafc" />)}
          <g transform={`translate(${c.x - 34} 150) rotate(${c.rot})`}>
            <VehicleTop color={c.id === 'M' ? 'yellow' : c.id === 'N' ? 'lightblue' : 'purple'} />
          </g>
          <LabelBubble x={c.x - 34} y={40} text={c.id} tone={tone(c.id, it)} />
        </Pickable>
      ))}
      <text x="200" y="296" textAnchor="middle" fontSize="11" fill="#0f172a" fontFamily="Arial" fontWeight="700">No signs or markings</text>
    </g>
  );
}

function Mirrors({ it }: { it?: SceneInteraction }) {
  // A: shows mostly road behind with a sliver of own car; B: mostly own car; C: mostly sky/kerb
  const views = [
    { id: 'A', sky: 0.35, car: 0.18 },
    { id: 'B', sky: 0.3, car: 0.6 },
    { id: 'C', sky: 0.7, car: 0.05 },
  ];
  return (
    <g>
      {views.map((v, i) => {
        const x = 20 + i * 128;
        return (
          <Pickable key={v.id} id={v.id} it={it} x={x - 4} y={36} w={120} h={210}>
            <g>
              <rect x={x} y={70} width="112" height="150" rx="36" fill="#111827" />
              <clipPath id={`mc${v.id}`}>
                <rect x={x + 8} y={78} width="96" height="134" rx="30" />
              </clipPath>
              <g clipPath={`url(#mc${v.id})`}>
                <rect x={x} y={78} width="112" height={134 * v.sky} fill="#7dd3fc" />
                <rect x={x} y={78 + 134 * v.sky} width="112" height={134 * (1 - v.sky)} fill="#6b7280" />
                <path d={`M${x + 40} ${78 + 134 * v.sky} L${x + 70} ${78 + 134 * v.sky} L${x + 104} 212 L${x + 20} 212 Z`} fill="#4b5563" />
                <rect x={x + 58} y={78 + 134 * v.sky + 12} width="20" height="12" fill="#ef4444" />
                <rect x={x + 104 - 96 * v.car} y={78} width={96 * v.car + 10} height="134" fill="#1d4ed8" />
                <rect x={x + 104 - 96 * v.car + 4} y={96} width={Math.max(0, 96 * v.car - 10)} height="30" fill="#93c5fd" opacity=".6" />
              </g>
            </g>
            <LabelBubble x={x + 56} y={52} text={v.id} tone={tone(v.id, it)} />
          </Pickable>
        );
      })}
    </g>
  );
}

function BusRail() {
  return (
    <g>
      <rect x="0" y="0" width="400" height="300" fill="#6aa84f" />
      {/* bus stop */}
      <rect x="40" y="0" width="120" height="300" fill={ROAD} />
      <rect x="34" y="0" width="6" height="300" fill="#d6d3d1" />
      <rect x="6" y="18" width="26" height="30" rx="3" fill="#fde047" stroke="#111" />
      <text x="19" y="30" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="Arial">BUS</text>
      <text x="19" y="40" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="Arial">STOP</text>
      <line x1="60" y1="36" x2="60" y2="236" stroke="#fde047" strokeWidth="3" markerStart="url(#cArrow)" markerEnd="url(#cArrow)" />
      <rect x="66" y="124" width="46" height="22" rx="5" fill="#0f172a" />
      <text x="89" y="136" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="800" fill="#fde047" fontFamily="Arial">20 m</text>
      <g transform="translate(60 262)"><VehicleTop color="lightblue" /></g>
      {/* railway crossing */}
      <rect x="240" y="0" width="120" height="300" fill={ROAD} />
      <rect x="234" y="0" width="6" height="300" fill="#d6d3d1" />
      {[0, 1].map((k) => (
        <g key={k}>
          <rect x="230" y={22 + k * 16} width="140" height="4" fill="#78350f" />
        </g>
      ))}
      {Array.from({ length: 12 }, (_, k) => <rect key={k} x={236 + k * 11} y="16" width="4" height="32" fill="#57534e" />)}
      <line x1="260" y1="54" x2="260" y2="236" stroke="#fde047" strokeWidth="3" markerStart="url(#cArrow)" markerEnd="url(#cArrow)" />
      <rect x="266" y="124" width="46" height="22" rx="5" fill="#0f172a" />
      <text x="289" y="136" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="800" fill="#fde047" fontFamily="Arial">20 m</text>
      <g transform="translate(260 262)"><VehicleTop color="lightblue" /></g>
      <SignInline id="railway-giveway" x={385} y={90} size={50} />
    </g>
  );
}

function Seatbelts() {
  const seat = (x: number, y: number, belt: boolean, kind: string) => (
    <g>
      <rect x={x - 26} y={y - 30} width="52" height="60" rx="10" fill="#475569" />
      <circle cx={x} cy={y - 8} r="12" fill={kind === 'child' ? '#fcd34d' : '#e7c9a9'} stroke="#111" />
      <rect x={x - 16} y={y + 4} width="32" height="22" rx="6" fill={kind === 'child' ? '#34d399' : kind === 'woman' ? '#a78bfa' : '#60a5fa'} />
      {belt && <path d={`M${x - 18} ${y - 4} L${x + 16} ${y + 26}`} stroke="#dc2626" strokeWidth="5" />}
      {!belt && <path d={`M${x + 22} ${y - 26} L${x + 22} ${y + 26}`} stroke="#dc2626" strokeWidth="5" strokeDasharray="6 4" />}
    </g>
  );
  return (
    <g>
      <rect x="0" y="0" width="400" height="300" fill="#1f2937" />
      <rect x="110" y="10" width="180" height="280" rx="60" fill="#e5e7eb" />
      <rect x="126" y="40" width="148" height="230" rx="40" fill="#cbd5e1" />
      {seat(165, 90, true, 'man')}
      {seat(235, 90, true, 'child')}
      {seat(165, 200, true, 'child')}
      {seat(235, 200, false, 'woman')}
      <text x="330" y="210" fontSize="12" fill="#fde047" fontFamily="Arial" fontWeight="700">Rear adult</text>
      <text x="330" y="226" fontSize="12" fill="#fde047" fontFamily="Arial" fontWeight="700">passenger</text>
      <path d="M325 206 L270 204" stroke="#fde047" strokeWidth="2" markerEnd="url(#cArrow)" />
    </g>
  );
}

function PedSignals() {
  return (
    <g>
      <rect width="400" height="300" fill="#e5e7eb" />
      {[{ x: 110, walk: true }, { x: 290, walk: false }].map((s) => (
        <g key={s.x}>
          <rect x={s.x - 6} y="150" width="12" height="140" fill="#1f2937" />
          <rect x={s.x - 56} y="40" width="112" height="112" rx="8" fill="#111" />
          <g className="animate-blink">
            {s.walk ? <Person x={s.x} y={116} s={2.2} color="#ef4444" walking={false} /> : (
              <>
                <text x={s.x} y="86" textAnchor="middle" fontSize="26" fontWeight="800" fill="#ef4444" fontFamily="Arial">DON&apos;T</text>
                <text x={s.x} y="118" textAnchor="middle" fontSize="26" fontWeight="800" fill="#ef4444" fontFamily="Arial">WALK</text>
              </>
            )}
          </g>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
            const a = (k / 8) * Math.PI * 2;
            return <line key={k} x1={s.x + Math.cos(a) * 66} y1={96 + Math.sin(a) * 66} x2={s.x + Math.cos(a) * 80} y2={96 + Math.sin(a) * 80} stroke="#ef4444" strokeWidth="4" className="animate-blink" />;
          })}
        </g>
      ))}
      <text x="200" y="104" textAnchor="middle" fontSize="22" fontWeight="800" fill="#0f172a" fontFamily="Arial">OR</text>
      <text x="200" y="282" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a" fontFamily="Arial">Flashing red pedestrian signals</text>
    </g>
  );
}

function Bus40() {
  return (
    <g>
      <rect width="400" height="300" fill="#bae6fd" />
      <rect y="220" width="400" height="80" fill="#4b5563" />
      <rect x="90" y="30" width="220" height="230" rx="18" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="4" />
      <rect x="110" y="60" width="180" height="70" rx="8" fill="#1e293b" />
      <g className="animate-blink">
        <circle cx="130" cy="44" r="7" fill="#fbbf24" />
        <circle cx="270" cy="44" r="7" fill="#fbbf24" />
      </g>
      <circle cx="200" cy="95" r="26" fill="#fff" stroke="#dc2626" strokeWidth="6" />
      <text x="200" y="97" textAnchor="middle" dominantBaseline="middle" fontSize="26" fontWeight="800" fontFamily="Arial">40</text>
      <rect x="120" y="190" width="160" height="30" rx="4" fill="#e5e7eb" />
      <rect x="110" y="238" width="40" height="22" rx="5" fill="#111" />
      <rect x="250" y="238" width="40" height="22" rx="5" fill="#111" />
      <rect x="105" y="150" width="30" height="14" fill="#ef4444" />
      <rect x="265" y="150" width="30" height="14" fill="#ef4444" />
      <text x="200" y="290" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="Arial">Lights flashing on the back of a school bus</text>
    </g>
  );
}

function ShoulderCheck() {
  return (
    <g>
      <rect width="400" height="300" fill="#bfdbfe" />
      <rect y="200" width="400" height="100" fill="#4b5563" />
      <rect y="194" width="400" height="8" fill="#d6d3d1" />
      <path d="M40 200 L100 120 L260 110 L330 150 L360 200 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="3" />
      <path d="M110 128 L160 124 L160 170 L100 170 Z M172 122 L250 118 L300 150 L300 170 L172 170 Z" fill="#1e293b" />
      <circle cx="210" cy="140" r="18" fill="#e7c9a9" stroke="#111" strokeWidth="2" />
      <path d="M200 132 Q190 140 196 150" stroke="#111" strokeWidth="2" fill="none" />
      <path d="M240 140 C280 120 330 110 380 118" stroke="#fde047" strokeWidth="4" strokeDasharray="8 6" fill="none" markerEnd="url(#cArrow)" />
      <circle cx="110" cy="210" r="26" fill="#111" />
      <circle cx="300" cy="210" r="26" fill="#111" />
      <text x="200" y="285" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="Arial">Moving away from the kerb into traffic</text>
    </g>
  );
}

function RoadMarkingsABC({ it }: { it?: SceneInteraction }) {
  return (
    <g>
      <rect width="400" height="300" fill="#6b7280" />
      <Pickable id="A" it={it} x={20} y={60} w={110} h={180}>
        <path d="M40 180 L110 180 L75 120 Z" fill="none" stroke="#f8fafc" strokeWidth="5" />
        <LabelBubble x={75} y={220} text="A" tone={tone('A', it)} />
      </Pickable>
      <Pickable id="B" it={it} x={145} y={60} w={110} h={180}>
        <path d="M215 70 L185 110 L215 150 L185 190" fill="none" stroke="#f8fafc" strokeWidth="5" />
        <LabelBubble x={200} y={220} text="B" tone={tone('B', it)} />
      </Pickable>
      <Pickable id="C" it={it} x={270} y={60} w={110} h={180}>
        <path d="M290 130 L370 130 L370 190 L290 190 Z M290 130 L290 118 M310 130 L310 118 M330 130 L330 118 M350 130 L350 118 M370 130 L370 118" fill="none" stroke="#f8fafc" strokeWidth="4" />
        <path d="M330 180 L330 150 M322 158 L330 148 L338 158" stroke="#f8fafc" strokeWidth="4" fill="none" />
        <LabelBubble x={330} y={220} text="C" tone={tone('C', it)} />
      </Pickable>
    </g>
  );
}

function SchoolCrossing({ supervisor }: { supervisor?: boolean }) {
  return (
    <g>
      <rect width="400" height="300" fill="#6aa84f" />
      <rect x="130" y="0" width="140" height="300" fill={ROAD} />
      <rect x="124" y="0" width="6" height="300" fill="#d6d3d1" />
      <rect x="270" y="0" width="6" height="300" fill="#d6d3d1" />
      <line x1="200" y1="0" x2="200" y2="300" stroke="#f8fafc" strokeWidth="2" strokeDasharray="12 10" />
      {Array.from({ length: 10 }, (_, k) => <rect key={k} x={134 + k * 14} y="100" width="8" height="34" fill="#f8fafc" />)}
      {[124, 270].map((x) => (
        <g key={x}>
          <rect x={x - 2} y="70" width="4" height="70" fill="#dc2626" />
          {[0, 1, 2, 3].map((k) => <rect key={k} x={x - 3} y={72 + k * 16} width="6" height="8" fill="#fff" />)}
        </g>
      ))}
      <PersonTop x={160} y={116} kind="child" rot={90} />
      <PersonTop x={186} y={112} kind="child" rot={90} />
      <PersonTop x={222} y={118} kind="child" rot={90} />
      <PersonTop x={112} y={120} kind="worker" rot={90} />
      <SignInline id="children-crossing-flag" x={100} y={110} size={46} />
      <SignInline id="children-crossing" x={320} y={70} size={40} />
      <g transform="translate(166 230)"><VehicleTop color="blue" /></g>
      {supervisor && <text x="200" y="292" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="Arial" stroke="#0f172a" strokeWidth="3" paintOrder="stroke">School crossing supervisor holding the STOP sign</text>}
    </g>
  );
}

function BabyRestraint() {
  return (
    <g>
      <rect width="400" height="300" fill="#e0e7ff" />
      <rect x="60" y="60" width="280" height="200" rx="30" fill="#94a3b8" />
      <rect x="80" y="80" width="240" height="120" rx="20" fill="#64748b" />
      <path d="M130 200 C130 130 270 130 270 200 Z" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="4" />
      <path d="M150 180 C160 140 240 140 250 180" stroke="#93c5fd" strokeWidth="10" fill="none" />
      <circle cx="200" cy="165" r="14" fill="#fcd34d" />
      <path d="M200 80 L200 30" stroke="#f97316" strokeWidth="5" />
      <circle cx="200" cy="26" r="8" fill="#f97316" stroke="#9a3412" strokeWidth="3" />
      <text x="214" y="30" fontSize="12" fontWeight="700" fill="#9a3412" fontFamily="Arial">anchorage point</text>
      <text x="200" y="285" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b" fontFamily="Arial">Fitting a baby restraint</text>
    </g>
  );
}

function OneWayPositions({ it }: { it?: SceneInteraction }) {
  const panel = (id: string, x0: number, carX: number) => (
    <Pickable id={id} it={it} x={x0} y={10} w={185} h={280}>
      <rect x={x0} y={10} width="185" height="280" fill="#6aa84f" />
      <rect x={x0 + 40} y={10} width="105" height="280" fill={ROAD} />
      <rect x={x0} y="90" width="185" height="70" fill={ROAD} />
      <line x1={x0} y1="125" x2={x0 + 185} y2="125" stroke="#f8fafc" strokeWidth="2" strokeDasharray="10 10" />
      <text x={x0 + 150} y="30" fontSize="10" fontWeight="800" fill="#fff" fontFamily="Arial">ONE WAY ↑</text>
      <g transform={`translate(${carX} 215)`}><VehicleTop color="yellow" indicate="right" /></g>
      <path d={`M${carX} 196 L${carX} 140 Q${carX} 118 ${carX + 30} 118 L${x0 + 180} 118`} stroke="#1d4ed8" strokeWidth="4" fill="none" markerEnd="url(#cArrowBlue)" />
      <LabelBubble x={x0 + 22} y={250} text={id} tone={tone(id, it)} />
    </Pickable>
  );
  return (
    <g>
      {panel('M', 10, 102)}
      {panel('R', 205, 330)}
    </g>
  );
}

function HillPark() {
  return (
    <g>
      <rect width="400" height="300" fill="#bae6fd" />
      <path d="M0 260 L400 150 L400 300 L0 300 Z" fill="#4b5563" />
      <path d="M0 268 L400 158" stroke="#d6d3d1" strokeWidth="10" />
      <g transform="translate(200 196) rotate(-15.4)">
        <rect x="-90" y="-50" width="180" height="42" rx="10" fill="#f8fafc" stroke="#475569" strokeWidth="3" />
        <path d="M-60 -50 L-40 -82 L50 -82 L72 -50 Z" fill="#f8fafc" stroke="#475569" strokeWidth="3" />
        <path d="M-52 -52 L-36 -76 L2 -76 L2 -52 Z M8 -52 L8 -76 L46 -76 L62 -52 Z" fill="#1e293b" />
        <circle cx="-54" cy="-6" r="18" fill="#111" />
        <circle cx="56" cy="-6" r="18" fill="#111" />
        <circle cx="-54" cy="-6" r="7" fill="#9ca3af" />
        <circle cx="56" cy="-6" r="7" fill="#9ca3af" />
      </g>
      <path d="M330 90 L380 70" stroke="#0f172a" strokeWidth="3" markerEnd="url(#cArrow)" />
      <text x="300" y="60" fontSize="13" fontWeight="800" fill="#0f172a" fontFamily="Arial">UPHILL</text>
      <text x="200" y="290" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="Arial">Automatic car parked on a street sloping uphill</text>
    </g>
  );
}

export function CustomArt({ spec, className, interaction }: { spec: VisualSpec; className?: string; interaction?: SceneInteraction }) {
  const name = spec.name ?? '';
  let body: ReactNode = null;
  let label = 'Illustration';
  switch (name) {
    case 'parking-methods': body = <ParkingMethods it={interaction} />; label = 'Three parking methods M, N and O'; break;
    case 'mirrors': body = <Mirrors it={interaction} />; label = 'Three side mirror adjustments A, B and C'; break;
    case 'bus-rail-20m': body = <BusRail />; label = 'Parking distance from a bus stop and a railway crossing'; break;
    case 'seatbelts': body = <Seatbelts />; label = 'Car occupants from above; the rear adult passenger is not wearing a seat belt'; break;
    case 'ped-signals': body = <PedSignals />; label = 'Flashing red pedestrian signals'; break;
    case 'bus-40': body = <Bus40 />; label = 'Flashing lights and 40 sign on the back of a bus'; break;
    case 'shoulder-check': body = <ShoulderCheck />; label = 'Driver checking over the shoulder before pulling out'; break;
    case 'road-markings-abc': body = <RoadMarkingsABC it={interaction} />; label = 'Road markings A, B and C'; break;
    case 'school-crossing': body = <SchoolCrossing supervisor={spec.supervisor} />; label = 'Children crossing with a school crossing supervisor'; break;
    case 'baby-restraint': body = <BabyRestraint />; label = 'Baby restraint and anchorage point'; break;
    case 'one-way-positions': body = <OneWayPositions it={interaction} />; label = 'Two positions (M and R) for turning right from a one-way street'; break;
    case 'hill-park': body = <HillPark />; label = 'Car parked on an uphill slope'; break;
    default: body = <rect width="400" height="300" fill="#334155" />;
  }
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label={label}>
      <title>{label}</title>
      <defs>
        <marker id="cArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#fde047" />
        </marker>
        <marker id="cArrowBlue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill="#1d4ed8" />
        </marker>
      </defs>
      {body}
    </svg>
  );
}

export const CUSTOM_PICKABLE: Record<string, string[]> = {
  mirrors: ['A', 'B', 'C'],
  'road-markings-abc': ['A', 'B', 'C'],
  'one-way-positions': ['M', 'R'],
  'parking-methods': ['M', 'N', 'O'],
};
