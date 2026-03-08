export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { resolveApiClientUser } from '../../../../lib/apiAuth';

export const runtime = 'nodejs';

function unauthorized(message) {
  return NextResponse.json({ error: message || 'Unauthorized' }, { status: 401 });
}

export async function GET(request) {
  const auth = await resolveApiClientUser(request);
  if (auth.status === 401) return unauthorized(auth.error);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status || 500 });

  const { supabase, userId } = auth;
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, interests, goals, headline, city, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: profile || null });
}

export async function POST(request) {
  const auth = await resolveApiClientUser(request);
  if (auth.status === 401) return unauthorized(auth.error);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status || 500 });

  const body = await request.json().catch(() => ({}));
  const cleanArray = (v) => (Array.isArray(v) ? v.map((x) => String(x || '').trim()).filter(Boolean) : undefined);

  const payload = {
    interests: cleanArray(body.interests),
    goals: cleanArray(body.goals),
    headline: typeof body.headline === 'string' ? body.headline.trim() : undefined,
    city: typeof body.city === 'string' ? body.city.trim() : undefined,
    updated_at: new Date().toISOString(),
  };

  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  if (Object.keys(payload).length === 1) {
    return NextResponse.json({ error: 'No valid profile fields provided' }, { status: 400 });
  }

  const { supabase, userId } = auth;
  const { data: updated, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('user_id', userId)
    .select('user_id, interests, goals, headline, city, updated_at')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from('bot_connections')
    .update({ status: 'connected', last_active: new Date().toISOString() })
    .eq('user_id', userId);

  return NextResponse.json({ profile: updated || null });
}
