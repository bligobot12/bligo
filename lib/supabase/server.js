import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const FALLBACK_SUPABASE_URL = 'https://lrpytrtdbnrkcfanicbx.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_6N_Zu4yhsLPmJFlMelV34A_AB965oxj';

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

  if (!url || !anon) return null;

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Reassemble chunked Supabase auth cookies
  const cookieMap = {};
  for (const { name, value } of allCookies) {
    cookieMap[name] = value;
  }

  // Find chunked token cookies and reassemble
  const baseKey = `sb-${url.split('//')[1].split('.')[0]}-auth-token`;
  let reassembled = cookieMap[baseKey];
  if (!reassembled) {
    const chunks = [];
    let i = 0;
    while (cookieMap[`${baseKey}.${i}`]) {
      chunks.push(cookieMap[`${baseKey}.${i}`]);
      i++;
    }
    if (chunks.length > 0) {
      reassembled = chunks.join('');
      cookieMap[baseKey] = reassembled;
    }
  }

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return Object.entries(cookieMap).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {}
      },
    },
  });
}
