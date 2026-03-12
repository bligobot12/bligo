import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

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
