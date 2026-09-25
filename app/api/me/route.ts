import { json, notConfigured, serverConfigured, supabaseAdmin, userFromRequest } from '@/lib/supabase/server';
import { weekId } from '@/lib/time';
import { statsFromRow } from '@/lib/server/stats';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!serverConfigured()) return notConfigured();
  const userId = await userFromRequest(req);
  if (!userId) return json({ error: 'unauthorised' }, 401);
  const db = supabaseAdmin();
  const [p, priv, prog, wk, ranks] = await Promise.all([
    db.from('profiles').select('*').eq('id', userId).maybeSingle(),
    db.from('profile_private').select('first_name, surname').eq('user_id', userId).maybeSingle(),
    db.from('player_progress').select('data').eq('user_id', userId).maybeSingle(),
    db.from('weekly_scores').select('points').eq('user_id', userId).eq('week', weekId()).maybeSingle(),
    db.rpc('get_player_ranks', { p_user: userId }),
  ]);
  if (!p.data) return json({ profile: null, stats: {}, progress: null, ranks: { global: null, suburb: null } });
  await db.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId);
  const r = Array.isArray(ranks.data) ? ranks.data[0] : null;
  return json({
    profile: { id: userId, username: p.data.username, suburb: p.data.suburb, firstName: priv.data?.first_name ?? '', surname: priv.data?.surname ?? '', createdAt: p.data.created_at },
    stats: statsFromRow(p.data, wk.data?.points ?? 0),
    progress: prog.data?.data ?? null,
    ranks: { global: r ? Number(r.global_rank) : null, suburb: r ? Number(r.suburb_rank) : null },
  });
}
