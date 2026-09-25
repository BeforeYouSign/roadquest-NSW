'use client';
import { useMemo } from 'react';
import { useGame } from '@/lib/store';

const COLORS = ['#ffd84d', '#ff7a1a', '#2ee6d6', '#ff4d8d', '#8b5cf6', '#22c55e', '#ffffff'];

/** Lightweight CSS confetti burst (no library). */
export function Confetti({ count = 70 }: { count?: number }) {
  const reduced = useGame((s) => s.settings.reducedMotion);
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.8 + Math.random() * 1.6,
        dx: (Math.random() - 0.5) * 240,
        rot: 360 + Math.random() * 720,
        color: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        round: Math.random() > 0.7,
      })),
    [count],
  );
  if (reduced) return null;
  return (
    <div className="fixed inset-0 z-[65] pointer-events-none overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.h,
            background: p.color,
            borderRadius: p.round ? '50%' : 2,
            animation: `confettiFall ${p.dur}s ${p.delay}s cubic-bezier(.2,.6,.4,1) forwards`,
            ['--dx' as string]: `${p.dx}px`,
            ['--rot' as string]: `${p.rot}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
