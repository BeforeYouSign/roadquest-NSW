import { json, notConfigured, serverConfigured, supabaseAdmin, userFromRequest } from '@/lib/supabase/server';
import { GAME } from '@/lib/config';
import { dayId, weekId } from '@/lib/time';
import type { LeaderboardRow, SuburbRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const COLS = 'id, username, suburb, level, xp, skill_rating, lifetime_points, car_color, suburb_key';

export async function GET(req: Request) {
  if (!serverConfigured()) return notConfigured();
  const tab = new URL(req.url).searchParams.get('tab') ?? 'global';
  const db = supabaseAdmin();
  const userId = await userFromRequest(req).catch(() => null);

  if (tab === 'suburbs') {
    const cfg = GAME.suburb;
    const r = await db.rpc('get_suburb_board', { p_week: weekId(), p_min: cfg.minActivePlayers, p_topn: cfg.topN, p_cap: cfg.playerCap, p_bonus: cfg.participationBonusPerPlayer, p_maxbonus: cfg.maxParticipationBonus });
    if (r.error) return json({ error: 'db', message: r.error.message }, 500);
    const rows: SuburbRow[] = ((r.data ?? []) as Row[]).map((x, i) => ({
      rank: i + 1, suburb: String(x.suburb), activePlayers: Number(x.active_players), totalXp: Number(x.total_xp), avgSkill: Number(x.avg_skill),
      weeklyPoints: Number(x.weekly_points), championshipScore: Number(x.championship_score), official: Boolean(x.official),
    }));
    let mySuburb: string | undefined;
    if (userId) mySuburb = (await db.from('profiles').select('suburb').eq('id', userId).maybeSingle()).data?.suburb;
    return json({ rows, mySuburb });
  }

  if (tab === 'winners') {
    const r = await db.from('weekly_winners').select('*').order('week', { ascending: false }).order('place').limit(12);
    const weeks: Record<string, { week: string; players: { username: string; suburb: string; points: number }[]; suburb: string }> = {};
    for (const w of (r.data ?? []) as Row[]) {
      weeks[w.week] ??= { week: w.week, players: [], suburb: w.top_suburb ?? '' };
      weeks[w.week].players.push({ username: w.username, suburb: w.suburb, points: Number(w.points) });
    }
    return json({ weeks: Object.values(weeks).slice(0, 4) });
  }

  if (tab === 'daily') {
    const r = await db.from('daily_results').select('user_id, score, duration_ms').eq('day', dayId()).order('score', { ascending: false }).order('duration_ms').limit(100);
    const results = (r.data ?? []) as Row[];
    const ids = results.map((x) => String(x.user_id));
    const profs = ids.length ? await db.from('profiles').select(COLS).in('id', ids) : { data: [] as Row[] };
    const map = new Map<string, Row>(((profs.data ?? []) as Row[]).map((p) => [String(p.id), p]));
    const rows: LeaderboardRow[] = results.map((x, i) => {
      const p = map.get(x.user_id);
      return { rank: i + 1, userId: x.user_id, username: p?.username ?? '—', suburb: p?.suburb ?? '', level: Number(p?.level ?? 1), score: Number(x.score), isMe: x.user_id === userId, carColor: p?.car_color ?? undefined };
    });
    return json({ rows });
  }

  if (tab === 'week') {
    const r = await db.rpc('get_weekly_board', { p_week: weekId(), p_limit: 100 });
    if (r.error) return json({ error: 'db', message: r.error.message }, 500);
    const rows: LeaderboardRow[] = ((r.data ?? []) as Row[]).map((x, i) => ({ rank: i + 1, userId: String(x.user_id), username: String(x.username), suburb: String(x.suburb), level: Number(x.level), score: Number(x.points), isMe: x.user_id === userId, carColor: (x.car_color as string) ?? undefined }));
    let me: LeaderboardRow | null = null;
    if (userId && !rows.some((x) => x.isMe)) {
      const mine = await db.from('weekly_scores').select('points').eq('user_id', userId).eq('week', weekId()).maybeSingle();
      const pts = Number(mine.data?.points ?? 0);
      const ahead = await db.from('weekly_scores').select('user_id', { count: 'exact', head: true }).eq('week', weekId()).gt('points', pts);
      const p = await db.from('profiles').select(COLS).eq('id', userId).maybeSingle();
      if (p.data) me = { rank: (ahead.count ?? 0) + 1, userId, username: p.data.username, suburb: p.data.suburb, level: p.data.level, score: pts, isMe: true, carColor: p.data.car_color ?? undefined };
    }
    return json({ rows, me, myRank: me?.rank ?? rows.find((x) => x.isMe)?.rank ?? null });
  }

  // global | skill | xp | mysuburb
  const order = tab === 'skill' ? 'skill_rating' : tab === 'xp' ? 'xp' : 'lifetime_points';
  let q = db.from('profiles').select(COLS).order(order, { ascending: false }).order('created_at').limit(100);
  let myProfile: Row | null = null;
  if (userId) myProfile = (await db.from('profiles').select(COLS).eq('id', userId).maybeSingle()).data;
  if (tab === 'mysuburb') {
    if (!myProfile) return json({ rows: [], me: null, myRank: null });
    q = q.eq('suburb_key', String(myProfile.suburb_key));
  }
  const r = await q;
  if (r.error) return json({ error: 'db', message: r.error.message }, 500);
  const score = (p: Row) => Math.round(Number(p[order]));
  const rows: LeaderboardRow[] = ((r.data ?? []) as Row[]).map((p, i) => ({ rank: i + 1, userId: p.id, username: p.username, suburb: p.suburb, level: p.level, score: score(p), isMe: p.id === userId, carColor: p.car_color ?? undefined }));
  let me: LeaderboardRow | null = null;
  if (myProfile && !rows.some((x) => x.isMe)) {
    let ahead = db.from('profiles').select('id', { count: 'exact', head: true }).gt(order, Number(myProfile[order]));
    if (tab === 'mysuburb') ahead = ahead.eq('suburb_key', String(myProfile.suburb_key));
    const c = await ahead;
    me = { rank: (c.count ?? 0) + 1, userId: String(myProfile.id), username: String(myProfile.username), suburb: String(myProfile.suburb), level: Number(myProfile.level), score: score(myProfile), isMe: true, carColor: (myProfile.car_color as string) ?? undefined };
  }
  return json({ rows, me, myRank: me?.rank ?? rows.find((x) => x.isMe)?.rank ?? null });
}
