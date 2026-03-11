import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function GET(_request, { params }) {
  const supabase = await createClient();
  const { postId } = await params;

  const { data, error } = await supabase
    .from('post_replies')
    .select('id, post_id, user_id, content, created_at, profiles:user_id(display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const replies = (data || []).map((r) => {
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id,
      post_id: r.post_id,
      user_id: r.user_id,
      content: r.content,
      created_at: r.created_at,
      display_name: p?.display_name || null,
      avatar_url: p?.avatar_url || null,
    };
  });

  return NextResponse.json({ replies });
}

export async function POST(request, { params }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId } = await params;
  const body = await request.json().catch(() => ({}));
  const content = String(body?.content || '').trim();

  if (!content) return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('post_replies')
    .insert({
      post_id: postId,
      user_id: session.user.id,
      content,
    })
    .select('id, post_id, user_id, content, created_at')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reply: data }, { status: 201 });
}
