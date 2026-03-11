import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return NextResponse.json({ apiKey: null });

  const { data } = await supabase
    .from('bot_connections')
    .select('api_key')
    .eq('user_id', session.user.id)
    .maybeSingle();

  return NextResponse.json({ apiKey: data?.api_key || null });
}
