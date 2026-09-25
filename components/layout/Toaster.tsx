'use client';
import { useEffect } from 'react';
import { dismissToast, useGame, type Toast } from '@/lib/store';
import { Icon } from '@/components/ui/Icon';
import { RARITY_STYLE } from '@/lib/config';
import { Confetti } from '@/components/game/Confetti';

function ToastCard({ t }: { t: Toast }) {
  useEffect(() => {
    const id = setTimeout(() => dismissToast(t.id), t.kind === 'levelup' || t.kind === 'rank' ? 4200 : 3800);
    return () => clearTimeout(id);
  }, [t.id, t.kind]);
  const rar = t.rarity ? RARITY_STYLE[t.rarity] : null;
  const border = t.kind === 'achievement' ? rar?.color ?? '#38bdf8' : t.kind === 'levelup' ? '#a78bfa' : t.kind === 'rank' ? '#ffd84d' : '#2ee6d6';
  return (
    <button
      onClick={() => dismissToast(t.id)}
      className="pointer-events-auto w-full text-left card-game px-4 py-3 flex items-center gap-3 animate-slide-up focus-ring"
      style={{ borderColor: border, boxShadow: `0 0 0 1px ${border}55, 0 12px 30px ${rar?.glow ?? 'rgba(0,0,0,.4)'}` }}
      aria-label={`${t.title}. ${t.body ?? ''}. Dismiss`}
    >
      <span className="grid place-items-center w-11 h-11 rounded-xl shrink-0" style={{ background: `${border}22`, color: border }}>
        <Icon name={t.icon ?? 'Sparkles'} className="w-6 h-6" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-extrabold tracking-[0.2em]" style={{ color: border }}>
          {t.kind === 'achievement' ? `ACHIEVEMENT UNLOCKED · ${rar?.label ?? ''}` : t.kind === 'levelup' ? 'LEVEL UP' : t.kind === 'rank' ? 'LICENCE JOURNEY' : t.kind === 'unlock' ? 'UNLOCKED' : 'ROADQUEST'}
        </span>
        <span className="block font-display text-lg leading-tight truncate">{t.title}</span>
        {t.body && <span className="block text-xs text-night-300 line-clamp-2">{t.body}</span>}
      </span>
    </button>
  );
}

export function Toaster() {
  const toasts = useGame((s) => s.toasts);
  const celebrate = toasts.some((t) => t.kind === 'levelup' || t.kind === 'rank' || t.rarity === 'legendary');
  return (
    <>
      {celebrate && <Confetti />}
      <div className="fixed z-[70] top-3 inset-x-3 sm:left-auto sm:right-4 sm:w-96 flex flex-col gap-2 pointer-events-none" aria-live="polite" role="status">
        {toasts.slice(-3).map((t) => (
          <ToastCard key={t.id} t={t} />
        ))}
      </div>
    </>
  );
}
