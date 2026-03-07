'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

function cleanUsername(v) {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);
}

export async function saveProfileAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/home?error=' + encodeURIComponent('Supabase env not configured in deployment.'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const username = cleanUsername(formData.get('username')) || `user_${user.id.slice(0, 8)}`;
  const displayName = String(formData.get('display_name') || '').trim();
  const bio = String(formData.get('bio') || '').trim();
  const avatarFile = formData.get('avatar');

  let avatarUrl = null;

  if (avatarFile && typeof avatarFile === 'object' && 'arrayBuffer' in avatarFile && avatarFile.size > 0) {
    const ext = (avatarFile.name?.split('.').pop() || 'png').toLowerCase();
    const filePath = `${user.id}/${Date.now()}.${ext}`;
    const arrayBuffer = await avatarFile.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: avatarFile.type || 'image/png',
        upsert: true,
      });

    if (uploadError) {
      redirect('/home?error=' + encodeURIComponent(`Avatar upload failed: ${uploadError.message}`));
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    avatarUrl = data.publicUrl;
  }

  const updatePayload = {
    id: user.id,
    user_id: user.id,
    username,
    display_name: displayName || null,
    full_name: displayName || null,
    bio,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').upsert(updatePayload);

  if (error) {
    // fallback for older schema without user_id/display_name
    const fallback = {
      id: user.id,
      username,
      full_name: displayName || null,
      bio,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      updated_at: new Date().toISOString(),
    };
    const { error: fallbackError } = await supabase.from('profiles').upsert(fallback);
    if (fallbackError) {
      redirect('/home?error=' + encodeURIComponent(fallbackError.message));
    }
  }

  redirect('/home?saved=1');
}

export async function createPostAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/home?error=' + encodeURIComponent('Supabase env not configured in deployment.'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const body = String(formData.get('post_body') || '').trim();
  if (!body) redirect('/home?error=' + encodeURIComponent('Post text is required.'));

  const { error } = await supabase.from('posts').insert({
    user_id: user.id,
    body,
  });

  if (error) {
    redirect('/home?error=' + encodeURIComponent(error.message));
  }

  redirect('/home?posted=1');
}
