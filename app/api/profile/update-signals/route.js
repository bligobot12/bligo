import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { signals } = await request.json().catch(() => ({}));
  if (!Array.isArray(signals)) return NextResponse.json({ error: 'Invalid signals' }, { status: 400 });

  const userId = session.user.id;

  const { data: profile } = await supabase
    .from('profiles')
    .select('signals')
    .eq('user_id', userId)
    .maybeSingle();

  const existing = Array.isArray(profile?.signals) ? profile.signals : [];
  const merged = [...existing];

  for (const newSig of signals) {
    const idx = merged.findIndex((s) => s.tag === newSig.tag);
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], ...newSig, frequency: (merged[idx].frequency || 1) + 1 };
    } else {
      merged.push(newSig);
    }
  }

  await supabase
    .from('profiles')
    .update({
      signals: merged,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return NextResponse.json({ ok: true, count: merged.length });
}
