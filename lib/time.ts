// All competition days/weeks run on Sydney time (Australia/Sydney).
// Weeks start Monday 00:00 and end Sunday 23:59.

const TZ = 'Australia/Sydney';

interface Parts { y: number; m: number; d: number; h: number; min: number; s: number; wd: number }

const WD: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function sydneyParts(date: Date = new Date()): Parts {
  const fmt = new Intl.DateTimeFormat('en-AU', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    weekday: 'short', hour12: false,
  });
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) p[part.type] = part.value;
  const h = Number(p.hour) % 24;
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h, min: Number(p.minute), s: Number(p.second), wd: WD[p.weekday?.slice(0, 3)] ?? 1 };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function dayId(date: Date = new Date()): string {
  const p = sydneyParts(date);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

/** Week id = the Sydney date of that week's Monday, e.g. "2026-09-21". */
export function weekId(date: Date = new Date()): string {
  const p = sydneyParts(date);
  const wall = Date.UTC(p.y, p.m - 1, p.d);
  const monday = new Date(wall - (p.wd - 1) * 86400000);
  return `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
}

export function previousWeekId(id: string): string {
  const [y, m, d] = id.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) - 7 * 86400000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function previousDayId(id: string): string {
  const [y, m, d] = id.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) - 86400000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

function wallNow(date: Date) {
  const p = sydneyParts(date);
  return { p, wall: Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) };
}

/** Milliseconds until the current Sydney week ends (Monday 00:00). */
export function msUntilWeekEnd(date: Date = new Date()): number {
  const { p, wall } = wallNow(date);
  const nextMonday = Date.UTC(p.y, p.m - 1, p.d) + (8 - p.wd) * 86400000;
  return Math.max(0, nextMonday - wall);
}

/** Milliseconds until the next Sydney midnight. */
export function msUntilDayEnd(date: Date = new Date()): number {
  const { p, wall } = wallNow(date);
  return Math.max(0, Date.UTC(p.y, p.m - 1, p.d) + 86400000 - wall);
}

export function formatCountdown(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${pad(m)}m`;
  const sec = s % 60;
  return `${h}h ${pad(m)}m ${pad(sec)}s`;
}

export function formatDate(iso: string | number | Date): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ });
}
