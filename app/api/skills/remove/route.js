import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { createAdminClient } from '../../../../lib/supabase/admin';

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { tag } = await request.json().catch(() => ({}));
  if (!tag) return NextResponse.json({ error: 'Tag required' }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { data: profile } = await admin
    .from('profiles')
    .select('signals')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const updatedSignals = (profile?.signals || []).filter((s) => s?.tag !== tag);

  const { error } = await admin
    .from('profiles')
    .update({ signals: updatedSignals })
    .eq('user_id', session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
