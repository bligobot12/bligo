import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const fields = {
    display_name: { max: 100 },
    headline: { max: 200 },
    job_title: { max: 100 },
    industry: { max: 100 },
    location_city: { max: 100 },
    location_state: { max: 100 },
    bio: { max: 1000 },
  };

  const update = { updated_at: new Date().toISOString() };
  for (const [key, rule] of Object.entries(fields)) {
    if (body[key] !== undefined) {
      const val = String(body[key] || '').slice(0, rule.max);
      update[key] = val || null;
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('user_id', session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
