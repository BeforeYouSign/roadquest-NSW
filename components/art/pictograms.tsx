// Simple, original pictograms used across signs and scenes.
import type { ReactNode } from 'react';

const INK = '#111';

/** Pictogram person (stick style, thick round strokes). */
export function Person({ x, y, s = 1, color = INK, walking = true, child = false }: { x: number; y: number; s?: number; color?: string; walking?: boolean; child?: boolean }) {
  const k = child ? 0.72 : 1;
  const sw = 3.4 * s * (child ? 0.9 : 1);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * k})`} stroke={color} strokeWidth={sw / (s * k)} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <circle cx="0" cy="-22" r="4.2" fill={color} stroke="none" />
      <path d="M0 -16 L0 -2" />
      {walking ? (
        <>
          <path d="M0 -13 L-6 -6 M0 -13 L6 -7" />
          <path d="M0 -2 L-6 10 M0 -2 L5 4 L7 11" />
        </>
      ) : (
        <>
          <path d="M0 -13 L-5 -4 M0 -13 L5 -4" />
          <path d="M0 -2 L-4 11 M0 -2 L4 11" />
        </>
      )}
    </g>
  );
}

export function Kangaroo({ x, y, s = 1, color = INK }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
      <path d="M-18 6 C-10 -2 -2 -10 6 -10 C10 -12 12 -18 14 -20 L15 -24 L17 -20 L19 -23 L19 -17 C22 -15 22 -12 18 -11 C14 -8 14 -2 12 2 C14 4 16 8 20 9 L20 11 L6 11 C4 8 2 6 0 5 C-6 8 -14 10 -24 12 C-30 13 -32 12 -32 11 C-26 10 -22 9 -18 6 Z" />
      <path d="M12 -4 L18 -2 L17 0 L11 -1 Z" />
    </g>
  );
}

export function Cow({ x, y, s = 1, color = INK }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
      <path d="M-16 -8 L10 -8 L14 -12 L20 -12 L22 -8 L20 -3 L14 -2 L12 2 L12 12 L9 12 L8 3 L-10 3 L-11 12 L-14 12 L-15 3 C-18 2 -19 -2 -19 -4 L-22 2 L-23 1 L-19 -7 Z" />
    </g>
  );
}

export function Sheep({ x, y, s = 1, color = INK }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
      <ellipse cx="0" cy="-2" rx="11" ry="7" />
      <ellipse cx="11" cy="-5" rx="4" ry="3.2" />
      <rect x="-8" y="3" width="2.4" height="8" />
      <rect x="-2" y="3" width="2.4" height="8" />
      <rect x="4" y="3" width="2.4" height="8" />
    </g>
  );
}

export function Truck({ x, y, s = 1, color = INK }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
      <rect x="-26" y="-14" width="34" height="20" rx="1.5" />
      <path d="M10 -9 L20 -9 L26 -1 L26 6 L10 6 Z" />
      <circle cx="-17" cy="8" r="5" />
      <circle cx="-5" cy="8" r="5" />
      <circle cx="18" cy="8" r="5" />
      <rect x="13" y="-7" width="7" height="5" fill="#ffd200" />
    </g>
  );
}

export function Bicycle({ x, y, s = 1, color = INK }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="-14" cy="6" r="9" />
      <circle cx="14" cy="6" r="9" />
      <path d="M-14 6 L-4 -8 L10 -8 L14 6 M-4 -8 L0 6 L10 -8 M-7 -12 L-1 -12 M10 -8 L8 -13 L12 -14" />
    </g>
  );
}

export function Worker({ x, y, s = 1, color = INK }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g stroke={color} strokeWidth={4} strokeLinecap="round" fill="none">
        <path d="M-4 -12 L0 4 M0 4 L-6 18 M0 4 L6 18 M-3 -8 L10 2 L18 10" />
      </g>
      <circle cx="-5" cy="-19" r="4.5" fill={color} />
      <path d="M8 16 C14 4 30 4 36 16 Z" fill={color} />
    </g>
  );
}

export function CarIcon({ x, y, s = 1, color = INK }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
      <path d="M-18 2 L-15 -6 C-14 -9 -12 -10 -9 -10 L9 -10 C12 -10 14 -9 15 -6 L18 2 L18 8 L-18 8 Z" />
      <circle cx="-10" cy="9" r="4" />
      <circle cx="10" cy="9" r="4" />
      <rect x="-11" y="-7" width="9" height="6" fill="#fff" opacity=".85" />
      <rect x="2" y="-7" width="9" height="6" fill="#fff" opacity=".85" />
    </g>
  );
}

export function BusIcon({ x, y, s = 1, color = INK }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-22" y="-10" width="44" height="18" rx="3" fill={color} />
      {[-17, -9, -1, 7].map((wx) => (
        <rect key={wx} x={wx} y="-7" width="6" height="6" fill="#fff" />
      ))}
      <rect x="15" y="-7" width="4" height="10" fill="#fff" />
      <circle cx="-13" cy="9" r="3.5" fill={color} stroke="#fff" strokeWidth="1.5" />
      <circle cx="12" cy="9" r="3.5" fill={color} stroke="#fff" strokeWidth="1.5" />
    </g>
  );
}

export function Wheelchair({ x, y, s = 1, color = '#fff' }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round">
      <circle cx="-2" cy="-16" r="3" fill={color} stroke="none" />
      <path d="M-2 -11 L-2 0 L8 0 L12 10" />
      <path d="M-2 -6 L6 -6" />
      <path d="M-6 -4 A10 10 0 1 0 8 8" />
    </g>
  );
}

export function Arrow({ d, color = INK, width = 6, head = 9 }: { d: string; color?: string; width?: number; head?: number }): ReactNode {
  const id = `ah${Math.abs(hash(d + color + head))}`;
  return (
    <g>
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX="5" refY="5" markerWidth={head / width + 1.2} markerHeight={head / width + 1.2} orient="auto-start-reverse" markerUnits="strokeWidth">
          <path d="M0 0 L10 5 L0 10 Z" fill={color} />
        </marker>
      </defs>
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="butt" strokeLinejoin="round" markerEnd={`url(#${id})`} />
    </g>
  );
}

export function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
