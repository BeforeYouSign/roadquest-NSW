// Detects whether Supabase has been configured. Without these variables the
// whole site runs in DEMO MODE (local fake player + sample leaderboards).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const IS_ONLINE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const IS_DEMO = !IS_ONLINE;
