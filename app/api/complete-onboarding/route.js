import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieNames = allCookies.map((c) => c.name);

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured', cookies: cookieNames },
      { status: 500 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  return NextResponse.json({
    user: user?.id || null,
    authError: authError?.message || null,
    cookieNames,
    cookieCount: allCookies.length,
  });
}
