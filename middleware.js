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

  const baseKey = `sb-${url.split('//')[1].split('.')[0]}-auth-token`;
  let reassembled = cookieMap[baseKey];
  if (!reassembled) {
    const chunks = [];
    let i = 0;
    while (cookieMap[`${baseKey}.${i}`]) {
      chunks.push(cookieMap[`${baseKey}.${i}`]);
      i += 1;
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

  const needsAuth = [
    '/home',
    '/onboarding',
    '/messages',
    '/connections',
    '/settings',
    '/profile',
    '/search',
    '/posts',
    '/history',
    '/notifications',
  ].some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!user && needsAuth) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/home/:path*',
    '/onboarding/:path*',
    '/messages/:path*',
    '/connections/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/search/:path*',
    '/posts/:path*',
    '/history/:path*',
    '/notifications/:path*',
  ],
};
