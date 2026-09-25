import { json, notConfigured, serverConfigured, supabaseAdmin } from '@/lib/supabase/server';
import { validateUsername } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!serverConfigured()) return notConfigured();
  const u = new URL(req.url).searchParams.get('u')?.trim() ?? '';
  const invalid = validateUsername(u);
  if (invalid) return json({ available: false, reason: invalid });
  const { data, error } = await supabaseAdmin().from('profiles').select('id').eq('username_lowercase', u.toLowerCase()).maybeSingle();
  if (error) return json({ error: 'db', message: error.message }, 500);
  return json({ available: !data });
}
