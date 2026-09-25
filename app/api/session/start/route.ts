import { json, notConfigured, serverConfigured, supabaseAdmin, userFromRequest } from '@/lib/supabase/server';
import { QUESTION_MAP, dailyChallengeIds, testQuestionIds, weeklyChallengeIds } from '@/lib/questions';
import { GAME } from '@/lib/config';
import { dayId, weekId } from '@/lib/time';

export const dynamic = 'force-dynamic';

const MODES = ['journey', 'quick', 'practice', 'minigame', 'daily', 'weekly', 'test', 'final', 'drive', 'onboarding'];

export async function POST(req: Request) {
  if (!serverConfigured()) return notConfigured();
  const userId = await userFromRequest(req);
  if (!userId) return json({ error: 'unauthorised', message: 'Please refresh the page.' }, 401);
  const body = (await req.json().catch(() => ({}))) as { mode?: string; questionIds?: string[]; meta?: Record<string, string> };
  const mode = String(body.mode ?? '');
  if (!MODES.includes(mode)) return json({ error: 'invalid', message: 'Unknown game mode.' }, 400);
  const db = supabaseAdmin();

  const prof = await db.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (!prof.data) return json({ error: 'no-profile', message: 'Create your driver first.' }, 403);

  // Rate limiting
  const sec = GAME.security;
  const since = new Date(Date.now() - 3600_000).toISOString();
  const recent = await db.from('game_sessions').select('started_at').eq('user_id', userId).gte('started_at', since).order('started_at', { ascending: false }).limit(sec.maxSessionsPerHour + 1);
  const rows = recent.data ?? [];
  if (rows.length >= sec.maxSessionsPerHour) return json({ error: 'rate-limited', message: 'Whoa, slow down! Take a short break and try again soon.' }, 429);
  if (rows[0] && Date.now() - Date.parse(rows[0].started_at) < sec.minSecondsBetweenSessions * 1000) return json({ error: 'rate-limited', message: 'Please wait a moment before starting another run.' }, 429);

  const today = dayId();
  const week = weekId();
  let ids: string[];
  if (mode === 'daily') {
    ids = dailyChallengeIds(today);
    await db.from('daily_challenges').upsert({ day: today, question_ids: ids }, { onConflict: 'day', ignoreDuplicates: true });
  } else if (mode === 'weekly') {
    ids = weeklyChallengeIds(week);
    await db.from('weekly_challenges').upsert({ week, question_ids: ids }, { onConflict: 'week', ignoreDuplicates: true });
  } else if (mode === 'test' || mode === 'final') {
    ids = testQuestionIds();
  } else {
    ids = Array.from(new Set((body.questionIds ?? []).map(String))).filter((id) => QUESTION_MAP[id] && QUESTION_MAP[id].status !== 'excluded').slice(0, sec.maxAnswersPerSession);
  }

  const context = { dayKey: mode === 'daily' ? today : undefined, weekKey: mode === 'weekly' ? week : undefined, minigameId: body.meta?.minigameId, levelId: body.meta?.levelId };
  const ins = await db.from('game_sessions').insert({ user_id: userId, mode, question_ids: ids, context, day_key: today }).select('id').single();
  if (ins.error) return json({ error: 'db', message: ins.error.message }, 500);
  return json({ sessionId: ins.data.id, questionIds: ids });
}
