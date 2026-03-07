'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

function enc(v) {
  return encodeURIComponent(v || 'Unexpected error');
}

export async function loginAction(formData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${enc(error.message)}`);
  }

  redirect('/home');
}

export async function signupAction(formData) {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) {
    redirect(`/signup?error=${enc(error.message)}`);
  }

  if (data.user?.id) {
    const base = {
      id: data.user.id,
      user_id: data.user.id,
      full_name: name || null,
      display_name: name || null,
      username: email.split('@')[0],
    };

    const { error: upsertErr } = await supabase.from('profiles').upsert(base);
    if (upsertErr) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: name || null,
        username: email.split('@')[0],
      });
    }
  }

  if (!data.session) {
    redirect('/login?message=' + enc('Check your email to confirm your account, then log in.'));
  }

  redirect('/home');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
