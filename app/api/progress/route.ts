import { json, notConfigured, serverConfigured, supabaseAdmin, userFromRequest } from '@/lib/supabase/server';
import { ACHIEVEMENT_MAP, CAR_MAP } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request) {
  if (!serverConfigured()) return notConfigured();
  const userId = await userFromRequest(req);
  if (!userId) return json({ error: 'unauthorised' }, 401);
  const text = await req.text();
  if (text.length > 400_000) return json({ error: 'too-large', message: 'Progress data too large.' }, 413);
  let body: { progress?: Record<string, unknown>; selectedCarId?: string; carColor?: string | null };
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'invalid' }, 400);
  }
  const progress = body.progress && typeof body.progress === 'object' ? body.progress : {};
  const db = supabaseAdmin();
  const up = await db.from('player_progress').upsert({ user_id: userId, data: progress, updated_at: new Date().toISOString() });
  if (up.error) return json({ error: 'db', message: up.error.message }, 500);

  // Mirror achievements into their own table (cosmetic; ids must exist)
  const ach = Object.keys((progress.achievements as Record<string, number>) ?? {}).filter((id) => ACHIEVEMENT_MAP[id]).slice(0, 500);
  if (ach.length) await db.from('player_achievements').upsert(ach.map((id) => ({ user_id: userId, achievement_id: id })), { onConflict: 'user_id,achievement_id', ignoreDuplicates: true });

  // Selected car + colour shown on leaderboards
  const patch: Record<string, string> = { last_seen: new Date().toISOString() };
  const car = String(body.selectedCarId ?? '');
  if (CAR_MAP[car]) {
    const owned = await db.from('player_cars').select('car_id').eq('user_id', userId).eq('car_id', car).maybeSingle();
    if (owned.data || CAR_MAP[car].achievement) patch.selected_car_id = car;
  }
  if (body.carColor && /^#[0-9a-fA-F]{6}$/.test(body.carColor)) patch.car_color = body.carColor;
  await db.from('profiles').update(patch).eq('id', userId);
  return json({ ok: true });
}
