import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lrpytrtdbnrkcfanicbx.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6N_Zu4yhsLPmJFlMelV34A_AB965oxj';

export async function POST(request) {
  // Read cookies directly from request headers
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieMap = {};
  cookieHeader.split(';').forEach((pair) => {
    const [key, ...val] = pair.trim().split('=');
    if (key) cookieMap[decodeURIComponent(key.trim())] = decodeURIComponent(val.join('=').trim());
  });

  // Reassemble chunked Supabase auth cookies
  const baseKey = `sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;
  if (!cookieMap[baseKey]) {
    const chunks = [];
    let i = 0;
    while (cookieMap[`${baseKey}.${i}`]) {
      chunks.push(cookieMap[`${baseKey}.${i}`]);
      i++;
    }
    if (chunks.length > 0) cookieMap[baseKey] = chunks.join('');
  }

  // Debug — remove after confirmed working
  const cookieNames = Object.keys(cookieMap);

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return Object.entries(cookieMap).map(([name, value]) => ({ name, value }));
      },
      setAll() {}, // read-only in API route
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Debug response — remove after confirmed working
  if (!user) {
    return NextResponse.json(
      {
        error: 'Not authenticated',
        detail: authError?.message,
        cookieNames,
        cookieCount: cookieNames.length,
      },
      { status: 401 }
    );
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: user.id,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
