import { json, notConfigured, serverConfigured, supabaseAdmin, userFromRequest } from '@/lib/supabase/server';
import { computeSession, levelFromXp } from '@/lib/scoring';
import { GAME } from '@/lib/config';
import { dayId, previousWeekId, weekId } from '@/lib/time';
import { statsFromRow } from '@/lib/server/stats';
import type { AnswerPayload, GameMode } from '@/lib/types';

export const dynamic = 'force-dynamic';

const COMPLETE_REQUIRED = ['daily', 'weekly', 'test', 'final'];

export async function POST(req: Request) {
  if (!serverConfigured()) return notConfigured();
  const userId = await userFromRequest(req);
  if (!userId) return json({ error: 'unauthorised', message: 'Please refresh the page.' }, 401);
  const body = (await req.json().catch(() => ({}))) as { sessionId?: string; answers?: AnswerPayload[] };
  const db = supabaseAdmin();
  const sec = GAME.security;

  const sess = await db.from('game_sessions').select('*').eq('id', String(body.sessionId ?? '')).eq('user_id', userId).maybeSingle();
  if (!sess.data) return json({ error: 'no-session', message: 'This run has expired. Please start again.' }, 404);
  const s = sess.data as { id: string; mode: GameMode; question_ids: string[]; status: string; started_at: string; context: Record<string, string> };
  if (s.status !== 'open') return json({ error: 'used', message: 'These answers were already submitted.' }, 409);
  const elapsed = Date.now() - Date.parse(s.started_at);
  if (elapsed > sec.sessionTtlMinutes * 60_000) return json({ error: 'expired', message: 'This run took too long and has expired.' }, 410);

  // ── Validate answers
  const allowed = new Set(s.question_ids);
  const raw = Array.isArray(body.answers) ? body.answers.slice(0, sec.maxAnswersPerSession) : [];
  const seen = new Set<string>();
  const answers: AnswerPayload[] = [];
  for (const a of raw) {
    const qid = String(a?.qid ?? '');
    if (!allowed.has(qid) || seen.has(qid)) continue;
    seen.add(qid);
    const kind = a.kind === 'tf' || a.kind === 'pick' ? a.kind : 'option';
    answers.push({ qid, kind, value: String(a.value ?? '').slice(0, 400), shown: a.shown ? String(a.shown).slice(0, 400) : undefined, ms: Math.max(0, Math.min(Number(a.ms) || 0, elapsed)) });
  }
  if (COMPLETE_REQUIRED.includes(s.mode) && answers.length < s.question_ids.length) {
    await db.from('game_sessions').update({ status: 'rejected' }).eq('id', s.id);
    return json({ error: 'incomplete', message: 'Every question must be answered for this mode.' }, 422);
  }
  if (answers.length && elapsed < answers.length * sec.minMsPerAnswer) {
    await db.from('game_sessions').update({ status: 'rejected' }).eq('id', s.id);
    return json({ error: 'too-fast', message: 'Answers came in faster than humanly possible, so this run was not counted.' }, 422);
  }

  // ── Player context
  const prof = await db.from('profiles').select('*').eq('id', userId).single();
  if (prof.error) return json({ error: 'db', message: prof.error.message }, 500);
  const p = prof.data;
  const since = new Date(Date.now() - GAME.skill.repeatCooldownHours * 3600_000).toISOString();
  const [att, todaySessions, dailyRow, weeklyRow, onboard] = await Promise.all([
    db.from('question_attempts').select('question_id, created_at').eq('user_id', userId).gte('created_at', since).in('question_id', answers.map((a) => a.qid)),
    db.from('game_sessions').select('mode, result').eq('user_id', userId).eq('day_key', dayId()).eq('status', 'submitted'),
    s.mode === 'daily' ? db.from('daily_results').select('user_id').eq('user_id', userId).eq('day', s.context.dayKey ?? dayId()).maybeSingle() : Promise.resolve({ data: null }),
    s.mode === 'weekly' ? db.from('weekly_results').select('user_id').eq('user_id', userId).eq('week', s.context.weekKey ?? weekId()).maybeSingle() : Promise.resolve({ data: null }),
    s.mode === 'onboarding' ? db.from('game_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('mode', 'onboarding').eq('status', 'submitted') : Promise.resolve({ count: 1 }),
  ]);
  const recent: Record<string, number> = {};
  for (const r of (att.data ?? []) as { question_id: string; created_at: string }[]) recent[r.question_id] = Math.max(recent[r.question_id] ?? 0, Date.parse(r.created_at));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nonRanked = ((todaySessions.data ?? []) as any[])
    .filter((x) => !(GAME.points.rankedModes as string[]).includes(x.mode))
    .reduce((sum: number, x) => sum + Number((x.result as { points?: number } | null)?.points ?? 0), 0);

  const result = computeSession(
    s.mode,
    answers,
    { skill: Number(p.skill_rating), answeredTotal: Number(p.questions_answered), streak: Number(p.current_streak), recent, nonRankedPointsToday: nonRanked, now: Date.now() },
    { firstDailyAttempt: s.mode === 'daily' && !dailyRow.data, firstWeeklyAttempt: s.mode === 'weekly' && !weeklyRow.data, firstOnboarding: s.mode === 'onboarding' && (onboard as { count: number | null }).count === 0 },
  );

  // ── Persist
  const wk = weekId();
  const level = levelFromXp(Number(p.xp) + result.xp).level;
  const award = await db.rpc('award_session', {
    p_user: userId, p_xp: result.xp, p_coins: result.coins, p_points: result.points, p_skill: result.skillAfter,
    p_answered: result.total, p_correct: result.correctCount, p_streak: result.streakAfter, p_best_streak: result.bestStreakInRun, p_level: level, p_week: wk,
  });
  if (award.error) return json({ error: 'db', message: award.error.message }, 500);
  if (answers.length) {
    await db.from('question_attempts').insert(result.graded.map((g) => ({ user_id: userId, session_id: s.id, question_id: g.qid, correct: g.correct, ms: answers.find((a) => a.qid === g.qid)?.ms ?? 0, mode: s.mode })));
  }
  const duration = answers.reduce((sum, a) => sum + a.ms, 0);
  if (s.mode === 'daily' && result.ranked) await db.from('daily_results').insert({ user_id: userId, day: s.context.dayKey ?? dayId(), score: result.score, correct: result.correctCount, total: result.total, duration_ms: duration });
  if (s.mode === 'weekly' && result.ranked) await db.from('weekly_results').insert({ user_id: userId, week: s.context.weekKey ?? wk, score: result.score, correct: result.correctCount, total: result.total, duration_ms: duration });
  await db.from('game_sessions').update({ status: 'submitted', submitted_at: new Date().toISOString(), result: { points: result.points, xp: result.xp, correct: result.correctCount, total: result.total, score: result.score } }).eq('id', s.id);
  await db.rpc('archive_week', { p_week: previousWeekId(wk) });

  const row = Array.isArray(award.data) ? award.data[0] : award.data;
  const weekly = await db.from('weekly_scores').select('points').eq('user_id', userId).eq('week', wk).maybeSingle();
  return json({ result, stats: statsFromRow(row ?? p, weekly.data?.points ?? 0) });
}
