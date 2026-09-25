// Side-view car art for the Garage (parametric: body, paint, wheels, roof, decals, plates).
import type { CarCustom, CarDef } from '@/lib/types';
import { COSMETICS, paintHex } from '@/lib/config';

type Body = CarDef['body'];

const BODIES: Record<Body, { path: string; glass: string; wheels: [number, number]; roofY: number; roofX: [number, number]; bed?: boolean }> = {
  hatch: {
    path: 'M28 112 L28 92 Q30 80 48 78 L96 72 L128 46 Q134 41 144 41 L214 41 Q226 41 234 52 L250 76 Q288 80 294 94 L294 112 Z',
    glass: 'M134 50 L144 46 L178 46 L178 72 L108 72 Z M186 46 L212 46 Q222 46 228 56 L238 72 L186 72 Z',
    wheels: [84, 242], roofY: 41, roofX: [140, 220],
  },
  sedan: {
    path: 'M20 112 L20 94 Q22 84 40 82 L92 78 L130 50 Q136 45 146 45 L206 45 Q218 45 228 54 L256 78 L294 82 Q304 86 304 98 L304 112 Z',
    glass: 'M138 54 L148 50 L182 50 L182 76 L110 76 Z M190 50 L206 50 Q214 50 222 58 L238 76 L190 76 Z',
    wheels: [78, 252], roofY: 45, roofX: [142, 214],
  },
  suv: {
    path: 'M24 116 L24 86 Q26 72 46 70 L84 66 L110 36 Q116 30 128 30 L240 30 Q252 30 258 42 L274 68 Q300 72 302 90 L302 116 Z',
    glass: 'M118 40 L128 36 L176 36 L176 64 L96 64 Z M184 36 L238 36 Q246 36 250 44 L262 64 L184 64 Z',
    wheels: [82, 248], roofY: 30, roofX: [124, 246],
  },
  wagon: {
    path: 'M20 112 L20 92 Q22 82 42 80 L90 76 L124 46 Q130 42 140 42 L262 42 Q272 42 278 54 L290 78 Q304 82 304 96 L304 112 Z',
    glass: 'M132 52 L142 47 L178 47 L178 74 L106 74 Z M186 47 L226 47 L226 74 L186 74 Z M234 47 L260 47 Q268 47 272 56 L280 74 L234 74 Z',
    wheels: [76, 254], roofY: 42, roofX: [138, 266],
  },
  ute: {
    path: 'M20 114 L20 90 Q22 80 42 78 L86 74 L112 44 Q118 38 128 38 L178 38 Q186 38 190 46 L198 74 L304 74 L304 114 Z',
    glass: 'M120 48 L128 43 L170 43 Q178 43 182 52 L188 70 L100 70 Z',
    wheels: [78, 256], roofY: 38, roofX: [124, 178], bed: true,
  },
  van: {
    path: 'M22 116 L22 84 Q24 70 42 66 L76 34 Q82 26 96 26 L284 26 Q298 26 300 42 L302 116 Z',
    glass: 'M84 38 L96 32 L136 32 L136 64 L60 64 Z M144 32 L196 32 L196 60 L144 60 Z M204 32 L256 32 L256 60 L204 60 Z',
    wheels: [78, 252], roofY: 26, roofX: [96, 284],
  },
  sporthatch: {
    path: 'M26 112 L26 94 Q28 84 46 82 L100 76 L134 50 Q140 45 150 45 L212 45 Q226 45 236 56 L252 78 Q290 82 296 96 L296 112 Z',
    glass: 'M140 54 L150 49 L182 49 L182 74 L114 74 Z M190 49 L210 49 Q220 49 228 58 L240 74 L190 74 Z',
    wheels: [84, 244], roofY: 45, roofX: [146, 218],
  },
  sports: {
    path: 'M16 110 L16 98 Q18 90 36 88 L110 80 L150 56 Q158 52 170 52 L214 52 Q230 52 242 62 L268 84 L300 88 Q308 92 308 102 L308 110 Z',
    glass: 'M156 60 L170 56 L206 56 Q222 56 232 64 L250 82 L126 82 Z',
    wheels: [74, 258], roofY: 52, roofX: [162, 226],
  },
  prestige: {
    path: 'M16 112 L16 94 Q18 84 38 82 L94 78 L134 48 Q140 43 152 43 L212 43 Q226 43 236 52 L266 78 L300 82 Q310 86 310 98 L310 112 Z',
    glass: 'M142 52 L152 48 L186 48 L186 76 L112 76 Z M194 48 L210 48 Q220 48 228 56 L248 76 L194 76 Z',
    wheels: [76, 258], roofY: 43, roofX: [148, 220],
  },
};

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amt));
  return `#${((1 << 24) | (c((n >> 16) & 255) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).slice(1)}`;
}

function Wheel({ cx, style }: { cx: number; style: string }) {
  const cy = 114;
  const rim = style === 'mesh' ? '#fbbf24' : style === 'neon' ? '#22d3ee' : style === 'steel' ? '#9ca3af' : '#e5e7eb';
  return (
    <g>
      <circle cx={cx} cy={cy} r="23" fill="#111" />
      <circle cx={cx} cy={cy} r={style === 'chunky' ? 12 : 14} fill={rim} />
      {style === 'spoke' && [0, 72, 144, 216, 288].map((a) => <rect key={a} x={cx - 1.8} y={cy - 13} width="3.6" height="13" fill="#6b7280" transform={`rotate(${a} ${cx} ${cy})`} />)}
      {style === 'turbine' && [0, 45, 90, 135, 180, 225, 270, 315].map((a) => <path key={a} d={`M${cx} ${cy} L${cx + 4} ${cy - 13} L${cx - 2} ${cy - 13} Z`} fill="#475569" transform={`rotate(${a} ${cx} ${cy})`} />)}
      {style === 'mesh' && <circle cx={cx} cy={cy} r="10" fill="none" stroke="#92400e" strokeWidth="2" strokeDasharray="2 2" />}
      {style === 'neon' && <circle cx={cx} cy={cy} r="17" fill="none" stroke="#22d3ee" strokeWidth="2" opacity=".8" />}
      {style === 'chunky' && <circle cx={cx} cy={cy} r="21" fill="none" stroke="#374151" strokeWidth="4" strokeDasharray="4 3" />}
      <circle cx={cx} cy={cy} r="4" fill="#374151" />
    </g>
  );
}

export function CarProfile({ car, custom, className, showPlates = true }: { car: CarDef; custom: CarCustom; className?: string; showPlates?: boolean }) {
  const b = BODIES[car.body] ?? BODIES.hatch;
  const paint = paintHex(custom.paint);
  const wheel = COSMETICS.wheels.find((w) => w.id === custom.wheels)?.style ?? 'steel';
  const plate = COSMETICS.plates.find((p) => p.id === custom.plate) ?? COSMETICS.plates[0];
  const lplate = COSMETICS.lplates.find((p) => p.id === custom.lplate) ?? COSMETICS.lplates[0];
  const interior = COSMETICS.interiors.find((i) => i.id === custom.interior)?.hex ?? '#374151';
  const clipId = `body-${car.id}`;
  return (
    <svg viewBox="0 0 320 150" className={className} role="img" aria-label={`${car.name}, ${car.class}`}>
      <title>{`${car.name} (${car.class})`}</title>
      <defs>
        <linearGradient id={`g-${car.id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={shade(paint, 45)} />
          <stop offset=".55" stopColor={paint} />
          <stop offset="1" stopColor={shade(paint, -55)} />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={b.path} />
        </clipPath>
      </defs>
      <ellipse cx="160" cy="138" rx="140" ry="8" fill="rgba(0,0,0,.35)" />
      {/* roof accessory */}
      {custom.roof === 'racks' && <g fill="#1f2937"><rect x={b.roofX[0]} y={b.roofY - 7} width={b.roofX[1] - b.roofX[0]} height="3" /><rect x={b.roofX[0] + 8} y={b.roofY - 7} width="4" height="7" /><rect x={b.roofX[1] - 12} y={b.roofY - 7} width="4" height="7" /></g>}
      {custom.roof === 'surfboard' && <g><rect x={b.roofX[0] + 8} y={b.roofY - 6} width="4" height="6" fill="#1f2937" /><rect x={b.roofX[1] - 12} y={b.roofY - 6} width="4" height="6" fill="#1f2937" /><path d={`M${b.roofX[0] - 30} ${b.roofY - 10} Q${(b.roofX[0] + b.roofX[1]) / 2} ${b.roofY - 20} ${b.roofX[1] + 30} ${b.roofY - 10} Q${(b.roofX[0] + b.roofX[1]) / 2} ${b.roofY - 4} ${b.roofX[0] - 30} ${b.roofY - 10} Z`} fill="#38bdf8" stroke="#0369a1" strokeWidth="1.5" /><path d={`M${b.roofX[0] - 20} ${b.roofY - 11} L${b.roofX[1] + 20} ${b.roofY - 11}`} stroke="#fff" strokeWidth="1.5" /></g>}
      {custom.roof === 'kayak' && <g><rect x={b.roofX[0] + 8} y={b.roofY - 6} width="4" height="6" fill="#1f2937" /><rect x={b.roofX[1] - 12} y={b.roofY - 6} width="4" height="6" fill="#1f2937" /><path d={`M${b.roofX[0] - 40} ${b.roofY - 11} Q${(b.roofX[0] + b.roofX[1]) / 2} ${b.roofY - 24} ${b.roofX[1] + 40} ${b.roofY - 11} Q${(b.roofX[0] + b.roofX[1]) / 2} ${b.roofY - 2} ${b.roofX[0] - 40} ${b.roofY - 11} Z`} fill="#f97316" stroke="#9a3412" strokeWidth="1.5" /></g>}
      {custom.roof === 'lightbar' && <g><rect x={b.roofX[0] + 10} y={b.roofY - 9} width={b.roofX[1] - b.roofX[0] - 20} height="8" rx="3" fill="#111" />{Array.from({ length: 6 }, (_, i) => <circle key={i} cx={b.roofX[0] + 18 + i * ((b.roofX[1] - b.roofX[0] - 36) / 5)} cy={b.roofY - 5} r="2.5" fill="#fef08a" />)}</g>}
      {custom.roof === 'pod' && <path d={`M${b.roofX[0] + 6} ${b.roofY} Q${b.roofX[0] + 10} ${b.roofY - 16} ${(b.roofX[0] + b.roofX[1]) / 2} ${b.roofY - 16} Q${b.roofX[1] - 10} ${b.roofY - 16} ${b.roofX[1] - 6} ${b.roofY} Z`} fill="#334155" stroke="#0f172a" strokeWidth="1.5" />}
      {/* body */}
      <path d={b.path} fill={`url(#g-${car.id})`} stroke={shade(paint, -80)} strokeWidth="2" />
      {b.bed && <rect x="200" y="74" width="100" height="6" fill={shade(paint, -40)} />}
      <g clipPath={`url(#${clipId})`}>
        {custom.decal === 'stripes' && <><rect x="0" y="86" width="320" height="6" fill="#fff" opacity=".9" /><rect x="0" y="95" width="320" height="3" fill="#fff" opacity=".9" /></>}
        {custom.decal === 'checker' && Array.from({ length: 30 }, (_, i) => <rect key={i} x={i * 11} y={i % 2 ? 90 : 96} width="6" height="6" fill="#111" />)}
        {custom.decal === 'bolt' && <path d="M150 80 L180 80 L168 92 L196 92 L150 108 L162 96 L140 96 Z" fill="#fde047" stroke="#111" strokeWidth="1" />}
        {custom.decal === 'gumleaf' && <path d="M120 100 Q160 72 210 96 Q160 110 120 100 Z M124 100 L206 96" fill="#16a34a" stroke="#14532d" strokeWidth="1.5" />}
        {custom.decal === 'wave' && <path d="M40 104 Q70 84 100 100 T160 98 T220 100 T290 96 L290 112 L40 112 Z" fill="#0ea5e9" opacity=".85" />}
        {custom.decal === 'crown' && <path d="M150 104 L150 88 L160 96 L170 84 L180 96 L190 88 L190 104 Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />}
        <rect x="0" y="60" width="320" height="10" fill="#fff" opacity=".08" />
      </g>
      <path d={b.glass} fill={interior} opacity=".25" />
      <path d={b.glass} fill="#0f172a" opacity=".72" />
      {/* lights */}
      <rect x={b.path.includes('M16') ? 18 : 24} y="90" width="10" height="7" rx="2" fill="#b91c1c" />
      <rect x="288" y="88" width="12" height="7" rx="2" fill="#fef9c3" />
      {/* door line + handle */}
      <path d="M182 80 L182 108" stroke={shade(paint, -70)} strokeWidth="1.2" opacity=".6" />
      <rect x="190" y="84" width="12" height="3" rx="1.5" fill={shade(paint, -70)} />
      <Wheel cx={b.wheels[0]} style={wheel} />
      <Wheel cx={b.wheels[1]} style={wheel} />
      {showPlates && (
        <>
          <rect x="30" y="100" width="18" height="16" rx="2" fill={lplate.bg} stroke="#111" strokeWidth="1" />
          <text x="39" y="112" textAnchor="middle" fontSize="13" fontWeight="900" fill={lplate.fg} fontFamily="Arial">L</text>
          <rect x="266" y="98" width="30" height="11" rx="2" fill={plate.bg} stroke="#111" strokeWidth="1" />
          <text x="281" y="106.5" textAnchor="middle" fontSize="7" fontWeight="800" fill={plate.fg} fontFamily="Arial">{custom.plateText.slice(0, 7)}</text>
        </>
      )}
    </svg>
  );
}
