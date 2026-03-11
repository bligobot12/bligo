import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ userId: null });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return NextResponse.json({ userId: session?.user?.id || null });
}
