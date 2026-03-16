import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lrpytrtdbnrkcfanicbx.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6N_Zu4yhsLPmJFlMelV34A_AB965oxj';

// Simple in-memory rate limiter: max 10 requests per IP per minute
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

export async function POST(request) {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const { email, password, first_name, last_name } = await request.json();
  const name = `${first_name} ${last_name}`.trim();

  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, first_name, last_name } },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (data.user?.id) {
    await supabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          user_id: data.user.id,
          first_name,
          last_name,
          full_name: name,
          display_name: name,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
  }

  return response;
}
