import { json, notConfigured, serverConfigured, supabaseAdmin, userFromRequest } from '@/lib/supabase/server';
import { normaliseSuburb, validateName, validateSuburb, validateUsername } from '@/lib/validation';
import { CAR_MAP } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!serverConfigured()) return notConfigured();
  const userId = await userFromRequest(req);
  if (!userId) return json({ error: 'unauthorised', message: 'Please refresh and try again.' }, 401);
  const body = (await req.json().catch(() => ({}))) as Record<string, string>;
  const firstName = String(body.firstName ?? '').trim();
  const surname = String(body.surname ?? '').trim();
  const username = String(body.username ?? '').trim();
  const suburb = normaliseSuburb(String(body.suburb ?? ''));
  const starterCar = String(body.starterCar ?? 'zippy');
  const err = validateName(firstName, 'First name') ?? validateName(surname, 'Surname') ?? validateUsername(username) ?? validateSuburb(suburb);
  if (err) return json({ error: 'invalid', message: err }, 400);
  if (!CAR_MAP[starterCar]?.starter) return json({ error: 'invalid', message: 'Please choose a starter car.' }, 400);

  const db = supabaseAdmin();
  const existing = await db.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (existing.data) return json({ error: 'exists', message: 'This device already has a driver profile.' }, 409);

  const ins = await db.from('profiles').insert({ id: userId, username, suburb, selected_car_id: starterCar });
  if (ins.error) {
    if (ins.error.code === '23505') return json({ error: 'taken', message: 'That username is already taken.' }, 409);
    return json({ error: 'db', message: ins.error.message }, 500);
  }
  await db.from('profile_private').insert({ user_id: userId, first_name: firstName, surname });
  await db.from('player_progress').insert({ user_id: userId, data: {} });
  await db.from('player_cars').insert({ user_id: userId, car_id: starterCar });
  return json({ ok: true });
}
