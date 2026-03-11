import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { display_name, job_title, industry, location_city, location_state, bio } = body;

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name,
      job_title,
      industry,
      location_city,
      location_state,
      bio,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
