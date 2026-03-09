import { NextResponse } from 'next/server';
import { resolveApiClientUser } from '../../../../lib/apiAuth';

function unauthorized(message) {
  return NextResponse.json({ error: message || 'Unauthorized' }, { status: 401 });
}

export async function GET(request) {
  const auth = await resolveApiClientUser(request);
  if (auth.status === 401) return unauthorized(auth.error);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status || 500 });

  const { data, error } = await auth.supabase
    .from('searches')
    .select('id, query, results, created_at')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ searches: data || [] });
}
