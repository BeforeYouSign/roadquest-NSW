import { json, notConfigured, serverConfigured, supabaseAdmin, userFromRequest } from '@/lib/supabase/server';
import { CAR_MAP, COSMETICS } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!serverConfigured()) return notConfigured();
  const userId = await userFromRequest(req);
  if (!userId) return json({ error: 'unauthorised' }, 401);
  const { kind, id } = (await req.json().catch(() => ({}))) as { kind?: string; id?: string };
  const db = supabaseAdmin();
  const prof = await db.from('profiles').select('coins, level').eq('id', userId).single();
  if (prof.error) return json({ error: 'no-profile', message: 'Create your driver first.' }, 403);

  let price = 0;
  if (kind === 'car') {
    const car = CAR_MAP[String(id)];
    if (!car || car.achievement || car.price <= 0) return json({ error: 'invalid', message: 'That car cannot be bought.' }, 400);
    if (car.levelRequired && Number(prof.data.level) < car.levelRequired) return json({ error: 'locked', message: `Reach level ${car.levelRequired} first.` }, 403);
    const owned = await db.from('player_cars').select('car_id').eq('user_id', userId).eq('car_id', car.id).maybeSingle();
    if (owned.data) return json({ coins: Number(prof.data.coins) });
    price = car.price;
  } else if (kind === 'cosmetic') {
    const [slot, itemId] = String(id).split(':');
    const list = (COSMETICS as Record<string, { id: string; price: number; achievement?: string }[]>)[slot];
    const item = list?.find((x) => x.id === itemId);
    if (!item || item.achievement || item.price <= 0) return json({ error: 'invalid', message: 'That item cannot be bought.' }, 400);
    const owned = await db.from('player_cosmetics').select('item_key').eq('user_id', userId).eq('item_key', String(id)).maybeSingle();
    if (owned.data) return json({ coins: Number(prof.data.coins) });
    price = item.price;
  } else return json({ error: 'invalid' }, 400);

  const spent = await db.rpc('spend_coins', { p_user: userId, p_amount: price });
  const balance = Number(spent.data);
  if (spent.error || balance < 0) return json({ error: 'coins', message: 'Not enough coins.' }, 402);
  if (kind === 'car') await db.from('player_cars').insert({ user_id: userId, car_id: String(id) });
  else await db.from('player_cosmetics').insert({ user_id: userId, item_key: String(id) });
  return json({ coins: balance });
}
