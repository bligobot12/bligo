'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

function enc(v) {
  return encodeURIComponent(v || 'Unexpected error');
}

export async function createPostAction(formData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect('/login');

  const content = String(formData.get('content') || '').trim();
  const postType = String(formData.get('post_type') || 'intent').trim();
  const visibility = String(formData.get('visibility') || 'connections').trim();

  if (!content) redirect('/posts?error=' + enc('Post cannot be empty'));

  const { error } = await supabase.from('posts').insert({
    user_id: user.id,
    content,
    post_type: postType,
    visibility,
  });

  if (error) redirect('/posts?error=' + enc(error.message));
  redirect('/home?posted=1');
}

export async function searchFromPostAction(formData) {
  const query = String(formData.get('query') || '').trim();
  if (!query) redirect('/search?error=' + enc('Cannot search from empty post'));
  redirect('/search?q=' + encodeURIComponent(query));
}

export async function updatePostAction(formData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect('/login');

  const postId = String(formData.get('post_id') || '').trim();
  const content = String(formData.get('content') || '').trim();
  const redirectTo = String(formData.get('redirect_to') || '/posts').trim();
  if (!postId || !content) redirect(`${redirectTo}?error=` + enc('Missing post id or content'));

  const { error } = await supabase.from('posts').update({ content, updated_at: new Date().toISOString() }).eq('id', postId).eq('user_id', user.id);
  if (error) redirect(`${redirectTo}?error=` + enc(error.message));
  redirect(`${redirectTo}?updated=1`);
}

export async function deletePostAction(formData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect('/login');

  const postId = String(formData.get('post_id') || '').trim();
  const redirectTo = String(formData.get('redirect_to') || '/history?tab=posts').trim();
  if (!postId) redirect(`${redirectTo}${redirectTo.includes('?') ? '&' : '?'}error=` + enc('Missing post id'));

  const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
  if (error) redirect(`${redirectTo}${redirectTo.includes('?') ? '&' : '?'}error=` + enc(error.message));
  redirect(`${redirectTo}${redirectTo.includes('?') ? '&' : '?'}deleted=1`);
}
