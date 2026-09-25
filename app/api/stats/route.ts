import { json, notConfigured, serverConfigured, supabaseAdmin } from '@/lib/supabase/server';
import { dayId, weekId } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!serverConfigured()) return notConfigured();
  const r = await supabaseAdmin().rpc('get_site_stats', { p_day: dayId(), p_week: weekId() });
  const row = Array.isArray(r.data) ? r.data[0] : null;
  return json({ players: Number(row?.players ?? 0), answered: Number(row?.answered ?? 0), topSuburb: row?.top_suburb ?? '—', dailyPlayers: Number(row?.daily_players ?? 0) });
}
