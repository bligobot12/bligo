import { createBrowserClient } from '@supabase/ssr';

const FALLBACK_SUPABASE_URL = 'https://lrpytrtdbnrkcfanicbx.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_6N_Zu4yhsLPmJFlMelV34A_AB965oxj';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY
  );
}
