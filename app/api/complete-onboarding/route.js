import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '../../../lib/supabase/admin';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lrpytrtdbnrkcfanicbx.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6N_Zu4yhsLPmJFlMelV34A_AB965oxj';

export async function POST(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieMap = {};
  cookieHeader.split(';').forEach((pair) => {
    const [key, ...val] = pair.trim().split('=');
    if (key) cookieMap[decodeURIComponent(key.trim())] = decodeURIComponent(val.join('=').trim());
  });

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

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return Object.entries(cookieMap).map(([name, value]) => ({ name, value }));
      },
      setAll() {},
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated', detail: authError?.message },
      { status: 401 }
    );
  }

  // Use admin client to bypass RLS for profile upsert
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 });
  }

  const { error } = await admin
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
