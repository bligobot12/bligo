import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lrpytrtdbnrkcfanicbx.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6N_Zu4yhsLPmJFlMelV34A_AB965oxj';

export async function createClient() {
 if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

 const cookieStore = await cookies();
 const allCookies = cookieStore.getAll();

 // Reassemble chunked Supabase auth cookies
 const cookieMap = {};
 for (const { name, value } of allCookies) {
 cookieMap[name] = value;
 }

 const baseKey = `sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;
 if (!cookieMap[baseKey]) {
 const chunks = [];
 let i = 0;
 while (cookieMap[`${baseKey}.${i}`]) {
 chunks.push(cookieMap[`${baseKey}.${i}`]);
 i++;
 }
 if (chunks.length > 0) {
 cookieMap[baseKey] = chunks.join('');
 }
 }

 return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
 cookies: {
 getAll() {
 return Object.entries(cookieMap).map(([name, value]) => ({ name, value }));
 },
 setAll(cookiesToSet) {
 cookiesToSet.forEach(({ name, value, options }) => {
 try {
 cookieStore.set(name, value, options);
 } catch {
 // Ignore in read-only server component context only
 }
 });
 },
 },
 });
}
