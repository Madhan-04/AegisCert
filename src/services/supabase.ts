import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Production Startup Check: Assert Postgres Supabase credentials in production mode
if (import.meta.env.PROD && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'FATAL INITIALIZATION ERROR: Production mode requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect to PostgreSQL. SQLite and LocalStorage fallbacks are disabled in production.'
  );
}

// Initialize production standard client, otherwise fallback to local dev mockup cache
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn(
    'LEGACY FALLBACK MODE: Running on local localStorage/SQLite mockup cache. Not suitable for production.'
  );
}
