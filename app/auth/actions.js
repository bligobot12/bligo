'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

function enc(v) {
  return encodeURIComponent(v || 'Unexpected error');
}

export async function loginAction(formData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  const supabase = await createClient();
  if (!supabase) {
    redirect('/login?error=' + enc('Supabase env not configured in deployment.'));
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${enc(error.message)}`);
  }

  redirect('/home');
}

export async function signupAction(formData) {
  const firstName = String(formData.get('first_name') || '').trim();
  const lastName = String(formData.get('last_name') || '').trim();
  const name = `${firstName} ${lastName}`.trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!firstName || !lastName) {
    redirect('/signup?error=' + enc('First and last name are required.'));
  }

  const supabase = await createClient();
  if (!supabase) {
    redirect('/signup?error=' + enc('Supabase env not configured in deployment.'));
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, first_name: firstName, last_name: lastName },
    },
  });

  if (error) {
    redirect(`/signup?error=${enc(error.message)}`);
  }

  if (data.user?.id) {
    const base = {
      id: data.user.id,
      user_id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      full_name: name || null,
      display_name: name || null,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase.from('profiles').upsert(base);
    if (upsertErr) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        full_name: name || null,
        display_name: name || null,
        updated_at: new Date().toISOString(),
      });
    }
  }

  if (!data.session) {
    redirect('/login?message=' + enc('Check your email to confirm your account, then log in.'));
  }

  redirect('/onboarding');
}

export async function logoutAction() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  await supabase.auth.signOut();
  redirect('/login');
}

export async function forgotPasswordAction(formData) {
  const email = String(formData.get('email') || '').trim();

  const supabase = await createClient();
  if (!supabase) {
    redirect('/forgot-password?error=' + enc('Supabase env not configured in deployment.'));
  }

  const h = await headers();
  const proto = h.get('x-forwarded-proto') || 'https';
  const host = h.get('x-forwarded-host') || h.get('host') || 'bligo.ai';
  const redirectTo = `${proto}://${host}/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    redirect('/forgot-password?error=' + enc(error.message));
  }

  redirect('/login?message=' + enc('Password reset email sent. Check your inbox.'));
}
