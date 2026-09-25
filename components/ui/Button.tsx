'use client';
import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { sfx } from '@/lib/sound';

export type Tone = 'sun' | 'aqua' | 'berry' | 'grape' | 'leaf' | 'flame' | 'dark' | 'ghost' | 'danger';

const TONES: Record<Tone, { cls: string; shadow: string }> = {
  sun: { cls: 'bg-gradient-to-b from-sun-400 to-sun-600 text-night-950', shadow: '#a16207' },
  aqua: { cls: 'bg-gradient-to-b from-aqua-400 to-aqua-600 text-night-950', shadow: '#0b7a72' },
  berry: { cls: 'bg-gradient-to-b from-berry-400 to-berry-600 text-white', shadow: '#9d174d' },
  grape: { cls: 'bg-gradient-to-b from-grape-400 to-grape-600 text-white', shadow: '#4c1d95' },
  leaf: { cls: 'bg-gradient-to-b from-leaf-400 to-leaf-600 text-night-950', shadow: '#166534' },
  flame: { cls: 'bg-gradient-to-b from-flame-400 to-flame-600 text-white', shadow: '#9a3412' },
  danger: { cls: 'bg-gradient-to-b from-danger-400 to-danger-600 text-white', shadow: '#7f1d1d' },
  dark: { cls: 'bg-gradient-to-b from-night-600 to-night-700 text-white border border-white/10', shadow: '#070b1a' },
  ghost: { cls: 'bg-white/5 text-white border border-white/15', shadow: 'rgba(0,0,0,.4)' },
};

const SIZES = {
  sm: 'px-3.5 py-2 text-sm min-h-10',
  md: 'px-5 py-3 text-base min-h-12',
  lg: 'px-7 py-4 text-lg md:text-xl min-h-14',
  xl: 'px-8 py-5 text-xl md:text-2xl min-h-16',
};

interface Common {
  tone?: Tone;
  size?: keyof typeof SIZES;
  className?: string;
  children: ReactNode;
  full?: boolean;
}

export function GameButton({ tone = 'sun', size = 'md', className = '', children, full, onClick, ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  const t = TONES[tone];
  return (
    <button
      {...rest}
      onClick={(e) => {
        sfx.tap();
        onClick?.(e);
      }}
      className={`btn-3d ${t.cls} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
      style={{ ['--btn-shadow' as string]: t.shadow } as React.CSSProperties}
    >
      {children}
    </button>
  );
}

export function GameLink({ tone = 'sun', size = 'md', className = '', children, full, href, ariaLabel }: Common & { href: string; ariaLabel?: string }) {
  const t = TONES[tone];
  return (
    <Link href={href} aria-label={ariaLabel} onClick={() => sfx.tap()} className={`btn-3d ${t.cls} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`} style={{ ['--btn-shadow' as string]: t.shadow } as React.CSSProperties}>
      {children}
    </Link>
  );
}
