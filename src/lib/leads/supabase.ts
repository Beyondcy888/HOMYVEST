// Supabase client for the lead funnel (U01_02 §9). Never import this module statically: load it with
// loadSupabase() from ./client.js, so @supabase/supabase-js stays out of the first bundle.
// Only the publishable (anon) key is ever used here; the database lets it insert form rows and nothing else.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

/** null when not configured: the funnel then hands over to WhatsApp. */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
