'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { formatCountdown } from '@/lib/time';

export function ProgressBar({ value, color = 'from-sun-400 to-flame-500', className = '', height = 'h-3', label }: { value: number; color?: string; className?: string; height?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className={`w-full rounded-full bg-night-950/70 border border-white/10 overflow-hidden ${height} ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={label}>
      <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-[width] duration-700 ease-out relative`} style={{ width: `${pct}%` }}>
        <div className="absolute inset-0 shine opacity-60" />
      </div>
    </div>
  );
}

export function StatTile({ label, value, icon, accent = 'text-sun-400', sub }: { label: string; value: ReactNode; icon?: ReactNode; accent?: string; sub?: ReactNode }) {
  return (
    <div className="card-game px-4 py-3 flex items-center gap-3 min-w-0">
      {icon && <div className={`shrink-0 ${accent}`}>{icon}</div>}
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-night-300 font-bold truncate">{label}</div>
        <div className="font-display text-xl md:text-2xl leading-tight truncate">{value}</div>
        {sub && <div className="text-xs text-night-300 truncate">{sub}</div>}
      </div>
    </div>
  );
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide ${className}`}>{children}</span>;
}

export function SectionTitle({ children, kicker, right }: { children: ReactNode; kicker?: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        {kicker && <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-aqua-400">{kicker}</div>}
        <h2 className="font-display text-2xl md:text-3xl leading-tight">{children}</h2>
      </div>
      {right}
    </div>
  );
}

export function Modal({ open, onClose, children, title, wide }: { open: boolean; onClose?: () => void; children: ReactNode; title?: string; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 bg-night-950/80 backdrop-blur-sm animate-slide-up" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`card-game w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[92dvh] overflow-y-auto p-5 relative`}>
        {onClose && (
          <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 focus-ring" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        )}
        {title && <h2 className="font-display text-2xl mb-3 pr-10">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`shrink-0 rounded-xl px-4 py-2.5 font-display text-sm tracking-wide uppercase transition focus-ring ${value === t.id ? 'bg-sun-500 text-night-950 shadow-[0_4px_0_#a16207]' : 'bg-white/5 text-night-300 hover:bg-white/10 border border-white/10'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function useCountdown(getMs: () => number, interval = 1000): string {
  const [text, setText] = useState('');
  useEffect(() => {
    const tick = () => setText(formatCountdown(getMs()));
    tick();
    const id = window.setInterval(tick, interval);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return text;
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status" aria-live="polite">
      <div className="relative w-16 h-24 rounded-xl road-bg animate-road overflow-hidden border-2 border-white/10">
        <div className="absolute left-1/2 bottom-2 -translate-x-1/2 w-6 h-10 rounded-md bg-sun-500 shadow-lg" />
      </div>
      <span className="text-night-300 font-bold text-sm">{label}…</span>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card-game p-8 text-center">
      <div className="font-display text-2xl mb-2">{title}</div>
      {body && <p className="text-night-300 mb-4">{body}</p>}
      {action}
    </div>
  );
}
