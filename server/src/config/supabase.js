import { createClient } from '@supabase/supabase-js';
import env from './env.js';

// Admin client — uses service role key, bypasses RLS.
// Use this ONLY in server-side controllers, never expose to client.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Public client — uses anon key, obeys RLS.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
