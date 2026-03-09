import { NextResponse } from 'next/server';
import { resolveApiClientUser } from '../../../../lib/apiAuth';
import { performSearchForUser } from '../../../../lib/search/performSearch';

function unauthorized(message) {
  return NextResponse.json({ error: message || 'Unauthorized' }, { status: 401 });
}

export async function POST(request) {
  const auth = await resolveApiClientUser(request);
  if (auth.status === 401) return unauthorized(auth.error);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status || 500 });

  const body = await request.json().catch(() => ({}));
  const query = String(body.query || '').trim();
  if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 });

  const result = await performSearchForUser(auth.supabase, auth.userId, query);
  if (result?.error) return NextResponse.json({ error: result.error }, { status: 500 });

  return NextResponse.json({ query: result.query, results: result.results });
}
