import { json, notConfigured, serverConfigured, supabaseAdmin, userFromRequest } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!serverConfigured()) return notConfigured();
  const userId = await userFromRequest(req);
  if (!userId) return json({ global: null, suburb: null });
  const r = await supabaseAdmin().rpc('get_player_ranks', { p_user: userId });
  const row = Array.isArray(r.data) ? r.data[0] : null;
  return json({ global: row ? Number(row.global_rank) : null, suburb: row ? Number(row.suburb_rank) : null });
}
