import { NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';


export async function GET(request) {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  const url = new URL('/login', request.url);
  return NextResponse.redirect(url);
}
