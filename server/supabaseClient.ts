import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;
let supabaseAdmin: any = null;

if (supabaseUrl && supabaseKey && supabaseServiceRoleKey) {
  // Public client for client-side operations (respects RLS)
  supabase = createClient(supabaseUrl, supabaseKey);

  // Service role client for server-side operations (bypasses RLS)
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
}

export { supabase, supabaseAdmin };
