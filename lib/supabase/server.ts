// Server-only Supabase helpers (service role). NEVER import this from client components.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

let admin: SupabaseClient | null = null;

export function serverConfigured(): boolean {
  return Boolean(SB_URL && SERVICE);
}

export function supabaseAdmin(): SupabaseClient {
  if (!serverConfigured()) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  if (!admin) admin = createClient(SB_URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

/** Verifies the bearer token sent by the browser and returns the user id. */
export async function userFromRequest(req: Request): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}

export function notConfigured() {
  return json({ error: 'server-not-configured', message: 'Supabase service key missing on the server. See README step 5.' }, 503);
}
