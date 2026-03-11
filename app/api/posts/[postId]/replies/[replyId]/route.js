import { NextResponse } from 'next/server';
import { createClient } from '../../../../../../lib/supabase/server';

export async function DELETE(_request, { params }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId, replyId } = await params;

  const { error } = await supabase
    .from('post_replies')
    .delete()
    .eq('id', replyId)
    .eq('post_id', postId)
    .eq('user_id', session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
