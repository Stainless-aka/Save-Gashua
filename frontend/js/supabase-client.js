// Public Supabase client configuration. The publishable key is safe to expose
// because every table and Storage operation is protected by RLS.
const SUPABASE_URL = "https://aopesijwkofwbybcvqhx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_yp05Ulf6Hujnic6MN9eC4A_M9mcAwTH";

window.saveGashuaSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
