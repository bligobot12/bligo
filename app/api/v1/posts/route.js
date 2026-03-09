import { NextResponse } from 'next/server';
import { resolveApiClientUser } from '../../../../lib/apiAuth';

function unauthorized(message) {
  return NextResponse.json({ error: message || 'Unauthorized' }, { status: 401 });
}

export async function POST(request) {
  const auth = await resolveApiClientUser(request);
  if (auth.status === 401) return unauthorized(auth.error);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status || 500 });

  const body = await request.json().catch(() => ({}));
  const content = String(body.content || '').trim();
  const post_type = String(body.post_type || 'intent').trim();
  const visibility = String(body.visibility || 'connections').trim();

  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 });

  const { data, error } = await auth.supabase
    .from('posts')
    .insert({ user_id: auth.userId, content, post_type, visibility })
    .select('id, user_id, content, post_type, visibility, created_at')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, post: data });
}
