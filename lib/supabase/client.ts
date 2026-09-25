'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { IS_ONLINE, SUPABASE_ANON_KEY, SUPABASE_URL } from '../env';

let client: SupabaseClient | null = null;

/** Browser Supabase client (anon key). Only used for anonymous sign-in / session tokens. */
export function supabaseBrowser(): SupabaseClient | null {
  if (!IS_ONLINE) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'roadquest-auth' },
    });
  }
  return client;
}

export async function getAccessToken(): Promise<string | null> {
  const sb = supabaseBrowser();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Creates (or reuses) an anonymous authenticated user tied to this browser/device. */
export async function ensureAnonymousSession(): Promise<{ userId: string; token: string }> {
  const sb = supabaseBrowser();
  if (!sb) throw new Error('Supabase is not configured');
  const existing = await sb.auth.getSession();
  if (existing.data.session) return { userId: existing.data.session.user.id, token: existing.data.session.access_token };
  const { data, error } = await sb.auth.signInAnonymously();
  if (error || !data.session) throw new Error(error?.message ?? 'Could not start a session. Is Anonymous sign-in enabled in Supabase?');
  return { userId: data.session.user.id, token: data.session.access_token };
}
