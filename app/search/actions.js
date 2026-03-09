'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { performSearchForUser } from '../../lib/search/performSearch';

function enc(v) {
  return encodeURIComponent(v || 'Unexpected error');
}

export async function searchUsersAction(formData) {
  const query = String(formData.get('query') || '').trim();
  if (!query) redirect('/search?error=' + enc('Search query is required'));
  redirect('/search?q=' + encodeURIComponent(query));
}

export async function searchFromPostAction(formData) {
  const query = String(formData.get('query') || '').trim();
  if (!query) redirect('/search?error=' + enc('Cannot search from empty post'));
  redirect('/search?q=' + encodeURIComponent(query));
}

export async function runSearchByQueryAction(query) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return { error: 'Not authenticated' };
  return performSearchForUser(supabase, user.id, query);
}
