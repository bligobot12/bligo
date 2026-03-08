import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lrpytrtdbnrkcfanicbx.supabase.co';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6N_Zu4yhsLPmJFlMelV34A_AB965oxj';

  if (!url || !anon) return response;

  const cookieMap = {};
  for (const { name, value } of request.cookies.getAll()) {
    cookieMap[name] = value;
  }

  // Reassemble chunked Supabase auth cookies (sb-<project>-auth-token.0, .1, ...)
  const baseKey = `sb-${url.split('//')[1].split('.')[0]}-auth-token`;
  let reassembled = cookieMap[baseKey];
  if (!reassembled) {
    const chunks = [];
    let i = 0;
    while (cookieMap[`${baseKey}.${i}`]) {
      chunks.push(cookieMap[`${baseKey}.${i}`]);
      i++;
    }
    if (chunks.length > 0) {
      reassembled = chunks.join('');
      cookieMap[baseKey] = reassembled;
    }
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return Object.entries(cookieMap).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
          cookieMap[name] = value;
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/home') ||
      request.nextUrl.pathname.startsWith('/onboarding') ||
      request.nextUrl.pathname.startsWith('/settings') ||
      request.nextUrl.pathname.startsWith('/connections') ||
      request.nextUrl.pathname.startsWith('/profile'))
  ) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/home/:path*', '/onboarding/:path*', '/messages/:path*', '/settings/:path*', '/connections/:path*', '/profile/:path*'],
};
