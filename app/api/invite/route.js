import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { email, message } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, first_name, last_name')
    .eq('user_id', user.id)
    .maybeSingle();

  const senderName = profile?.display_name
    || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
    || 'A Bligo member';

  const { error } = await supabase.from('invites').insert({
    from_user_id: user.id,
    email: email.toLowerCase(),
    message: message || null,
    status: 'pending',
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This person has already been invited' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sender: senderName });
}
