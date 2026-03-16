import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lrpytrtdbnrkcfanicbx.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6N_Zu4yhsLPmJFlMelV34A_AB965oxj';

function parseCookies(request) {
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
  return cookieMap;
}

function getSupabase(request) {
  const cookieMap = parseCookies(request);
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return Object.entries(cookieMap).map(([name, value]) => ({ name, value }));
      },
      setAll() {},
    },
  });
}

export async function GET(request) {
  const supabase = getSupabase(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: keys, error } = await supabase
    .from('bot_api_keys')
    .select('id, api_key, bot_name, bot_type, created_at, last_active')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: keys || [] });
}

export async function POST(request) {
  const supabase = getSupabase(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const botName = String(body.bot_name || '').trim();
  const botType = String(body.bot_type || 'custom').trim();
  const allowed = new Set(['openclaw', 'chatgpt', 'claude', 'custom']);
  if (!allowed.has(botType)) {
    return NextResponse.json({ error: 'Invalid bot type' }, { status: 400 });
  }

  const apiKey = `bligo_${crypto.randomUUID().replaceAll('-', '')}`;

  const { data, error } = await supabase
    .from('bot_api_keys')
    .insert({
      user_id: user.id,
      api_key: apiKey,
      bot_name: botName || null,
      bot_type: botType,
      last_active: new Date().toISOString(),
    })
    .select('id, api_key, bot_name, bot_type, created_at, last_active')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ key: data });
}
