import { SignInline } from './Sign';

const LAMP: Record<string, { color: string; glow?: string; arrow?: 'left' | 'right' }> = {
  off: { color: '#1f2937' },
  red: { color: '#ef2b2b', glow: '#ff6b6b' },
  yellow: { color: '#fbbf24', glow: '#fde68a' },
  green: { color: '#22c55e', glow: '#86efac' },
  'green-right': { color: '#1f2937', glow: '#22c55e', arrow: 'right' },
  'green-left': { color: '#1f2937', glow: '#22c55e', arrow: 'left' },
  'red-right': { color: '#1f2937', glow: '#ef2b2b', arrow: 'right' },
  'red-left': { color: '#1f2937', glow: '#ef2b2b', arrow: 'left' },
};

const LABEL: Record<string, string> = {
  red: 'red light', yellow: 'yellow light', green: 'green light',
  'green-right': 'green right arrow', 'green-left': 'green left arrow', 'red-right': 'red right arrow', 'red-left': 'red left arrow',
};

export function describeLights(cols: string[][]): string {
  const lit = cols.flat().filter((l) => l !== 'off').map((l) => LABEL[l] ?? l);
  return `Traffic lights showing ${lit.join(' and ') || 'no lights'}`;
}

/** Renders a traffic light cluster. `cols` is a list of columns, each [top, middle, bottom]. */
export function TrafficLightsArt({ cols, sign, className, blink }: { cols: string[][]; sign?: string; className?: string; blink?: boolean }) {
  const colW = 46;
  const w = cols.length * colW + 16;
  const housingH = 3 * 44 + 14;
  const total = 170 + (sign ? 10 : 0);
  const vbW = Math.max(w + 20, sign ? 150 : 0, 120);
  const x0 = (vbW - w) / 2 - (sign ? 30 : 0);
  return (
    <svg viewBox={`0 0 ${vbW} ${total}`} className={className} role="img" aria-label={describeLights(cols)}>
      <title>{describeLights(cols)}</title>
      <rect x={x0 + w / 2 - 4} y={housingH} width="8" height={total - housingH} fill="#6b7280" />
      <rect x={x0} y="4" width={w} height={housingH} rx="12" fill="#111827" stroke="#e5e7eb" strokeWidth="2.5" />
      {cols.map((col, ci) =>
        col.map((lamp, li) => {
          const L = LAMP[lamp] ?? LAMP.off;
          const cx = x0 + 8 + colW / 2 + ci * colW;
          const cy = 30 + li * 44;
          const lit = lamp !== 'off';
          return (
            <g key={`${ci}-${li}`} className={lit && blink ? 'animate-blink' : undefined}>
              <circle cx={cx} cy={cy} r="17" fill="#0b0f19" />
              <circle cx={cx} cy={cy} r="15" fill={L.color} />
              {lit && !L.arrow && <circle cx={cx} cy={cy} r="15" fill={L.glow} opacity=".35" />}
              {L.arrow && (
                <g transform={`translate(${cx} ${cy}) ${L.arrow === 'left' ? 'scale(-1 1)' : ''}`}>
                  <path d="M-9 0 L6 0" stroke={L.glow} strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M1 -7 L9 0 L1 7" stroke={L.glow} strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
            </g>
          );
        }),
      )}
      {sign && <SignInline id={sign} x={x0 + w + 40} y={housingH + 10} size={70} />}
    </svg>
  );
}
