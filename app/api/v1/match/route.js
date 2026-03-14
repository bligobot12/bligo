import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { resolveApiClientUser } from '../../../../lib/apiAuth';
import { runMatchingForUser } from '../../../../lib/matching/runMatchingForUser';


function unauthorized(message) {
  return NextResponse.json({ error: message || 'Unauthorized' }, { status: 401 });
}

export async function POST(request) {
  const auth = await resolveApiClientUser(request);
  if (auth.status === 401) return unauthorized(auth.error);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status || 500 });

  const result = await runMatchingForUser(auth.supabase, auth.userId);
  if (!result.ok) return NextResponse.json({ error: result.error || 'Matching failed' }, { status: 500 });

  return NextResponse.json({ ok: true, count: result.count });
}
