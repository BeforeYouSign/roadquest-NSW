// Top-down vehicle sprites for SVG scenes. All drawn pointing "up" (north) at the origin.

export const COLOR_HEX: Record<string, string> = {
  blue: '#2563eb', yellow: '#facc15', red: '#ef4444', pink: '#ec4899', purple: '#9333ea', green: '#16a34a',
  orange: '#f97316', white: '#f8fafc', silver: '#a8b3c2', navy: '#1e3a8a', lightblue: '#7dd3fc', teal: '#14b8a6',
};

export function vehicleType(color: string): string {
  if (['truck', 'moto', 'bike', 'fire', 'ambulance', 'bus', 'tram', 'police'].includes(color)) return color;
  return 'car';
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function VehicleTop({ color = 'blue', indicate, highlight, braking }: { color?: string; indicate?: 'left' | 'right'; highlight?: boolean; braking?: boolean }) {
  const type = vehicleType(color);
  if (type === 'moto' || type === 'bike') {
    return (
      <g>
        {highlight && <ellipse cx="0" cy="0" rx="14" ry="20" fill="none" stroke="#fde047" strokeWidth="3" className="animate-pulse-ring" />}
        <rect x="-2.5" y="-14" width="5" height="28" rx="2.5" fill="#111" />
        <rect x="-5" y="-4" width="10" height="10" rx="4" fill={type === 'moto' ? '#dc2626' : '#16a34a'} />
        <circle cx="0" cy="-2" r="4.5" fill={type === 'moto' ? '#111' : '#f5d0a9'} stroke="#fff" strokeWidth="1" />
        <rect x="-8" y="-9" width="16" height="2.5" rx="1" fill="#374151" />
      </g>
    );
  }
  if (type === 'truck' || type === 'bus' || type === 'tram' || type === 'fire') {
    const L = type === 'truck' ? 62 : type === 'tram' ? 80 : 56;
    const base = type === 'fire' ? '#dc2626' : type === 'bus' ? '#0ea5e9' : type === 'tram' ? '#f59e0b' : '#e5e7eb';
    return (
      <g>
        {highlight && <rect x="-16" y={-L / 2 - 6} width="32" height={L + 12} rx="8" fill="none" stroke="#fde047" strokeWidth="3" className="animate-pulse-ring" />}
        <rect x="-11" y={-L / 2 + 1} width="22" height={L} rx="3" fill="rgba(0,0,0,.25)" />
        <rect x="-11" y={-L / 2} width="22" height={L} rx="3" fill={base} stroke={shade(base, -60)} strokeWidth="1.2" />
        {type === 'truck' && <rect x="-11" y={-L / 2} width="22" height="15" rx="3" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.2" />}
        <rect x="-8" y={-L / 2 + 3} width="16" height="5" rx="1.5" fill="#1e293b" opacity=".8" />
        {type === 'fire' && <rect x="-3" y={-L / 2 + 16} width="6" height={L - 22} fill="#e5e7eb" />}
        {type === 'fire' && <rect x="-9" y={-L / 2 + 10} width="18" height="3" fill="#60a5fa" className="animate-blink" />}
        {indicate && <Indicators dir={indicate} halfW={11} halfL={L / 2} />}
      </g>
    );
  }
  const body = type === 'ambulance' ? '#f8fafc' : type === 'police' ? '#f8fafc' : (COLOR_HEX[color] ?? color);
  return (
    <g>
      {highlight && <ellipse cx="0" cy="0" rx="17" ry="24" fill="none" stroke="#fde047" strokeWidth="3" className="animate-pulse-ring" />}
      <rect x="-8.5" y="-15" width="17" height="32" rx="6" fill="rgba(0,0,0,.28)" />
      <rect x="-8.5" y="-16" width="17" height="32" rx="6" fill={body} stroke={shade(body, -70)} strokeWidth="1.2" />
      <path d="M-6.5 -7 Q0 -10 6.5 -7 L5.5 -2 L-5.5 -2 Z" fill="#1e293b" opacity=".85" />
      <rect x="-5.5" y="-2" width="11" height="9" rx="2" fill={shade(body, -25)} />
      <path d="M-5.5 8 L5.5 8 L6 11 Q0 12.5 -6 11 Z" fill="#1e293b" opacity=".8" />
      <rect x="-7" y="-16" width="3.5" height="2" rx="1" fill="#fef9c3" />
      <rect x="3.5" y="-16" width="3.5" height="2" rx="1" fill="#fef9c3" />
      <rect x="-7" y="14.2" width="3.5" height="1.8" rx=".8" fill={braking ? '#ff2d2d' : '#991b1b'} />
      <rect x="3.5" y="14.2" width="3.5" height="1.8" rx=".8" fill={braking ? '#ff2d2d' : '#991b1b'} />
      {type === 'ambulance' && (
        <>
          <rect x="-1.5" y="-1" width="3" height="8" fill="#dc2626" />
          <rect x="-4" y="1.5" width="8" height="3" fill="#dc2626" />
          <rect x="-6" y="-4" width="12" height="2" fill="#ef4444" className="animate-blink" />
        </>
      )}
      {type === 'police' && (
        <>
          <rect x="-8.5" y="0" width="17" height="4" fill="#1d4ed8" />
          <rect x="-6" y="-4" width="5" height="2" fill="#ef4444" className="animate-blink" />
          <rect x="1" y="-4" width="5" height="2" fill="#3b82f6" className="animate-blink-alt" />
        </>
      )}
      {indicate && <Indicators dir={indicate} halfW={8.5} halfL={16} />}
    </g>
  );
}

function Indicators({ dir, halfW, halfL }: { dir: 'left' | 'right'; halfW: number; halfL: number }) {
  const x = dir === 'left' ? -halfW - 1 : halfW - 2;
  return (
    <g className="animate-blink" fill="#fb923c">
      <rect x={x} y={-halfL - 0.5} width="3" height="4" rx="1" />
      <rect x={x} y={halfL - 3.5} width="3" height="4" rx="1" />
      <circle cx={x + 1.5} cy={-halfL - 2} r="3.5" fill="#fb923c" opacity=".45" />
    </g>
  );
}

export function LabelBubble({ x, y, text, tone = 'default' }: { x: number; y: number; text: string; tone?: 'default' | 'good' | 'bad' | 'picked' }) {
  const fill = tone === 'good' ? '#16a34a' : tone === 'bad' ? '#dc2626' : tone === 'picked' ? '#2563eb' : '#ffffff';
  const ink = tone === 'default' ? '#0f172a' : '#ffffff';
  return (
    <g>
      <circle cx={x} cy={y} r="10" fill={fill} stroke="#0f172a" strokeWidth="2" />
      <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="800" fill={ink} fontFamily="Arial, sans-serif">
        {text}
      </text>
    </g>
  );
}

export function PersonTop({ x, y, kind = 'adult', rot = 0 }: { x: number; y: number; kind?: string; rot?: number }) {
  const s = kind === 'child' ? 0.75 : 1;
  const shirt = kind === 'child' ? '#f472b6' : kind === 'elderly' ? '#a78bfa' : kind === 'worker' ? '#f97316' : '#0ea5e9';
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx="0" cy="1" rx="7" ry="4.5" fill="rgba(0,0,0,.25)" />
      <ellipse cx="0" cy="0" rx="7" ry="4.2" fill={shirt} stroke="#0f172a" strokeWidth="1" />
      <circle cx="0" cy="0" r="3.4" fill="#7c4a2d" stroke="#0f172a" strokeWidth=".8" />
    </g>
  );
}
