'use server';
// v2

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

function enc(v) {
  return encodeURIComponent(v || 'Unexpected error');
}

function makeApiKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `bligo_${hex}`;
}

export async function generateApiKeyOnboardingAction() {
  const supabase = await createClient();
  if (!supabase) redirect('/onboarding?error=' + enc('Supabase env not configured'));

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const apiKey = makeApiKey();
  const { error } = await supabase.from('bot_connections').upsert(
    {
      user_id: user.id,
      api_key: apiKey,
      status: 'connected',
      last_active: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) redirect('/onboarding?error=' + enc(error.message));
  redirect('/onboarding?saved=1');
}

export async function saveBotOnboardingAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/onboarding?error=' + enc('Supabase env not configured'));

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const botName = String(formData.get('bot_name') || '').trim();
  const botType = String(formData.get('bot_type') || 'chatgpt').trim();
  const allowed = new Set(['openclaw', 'chatgpt', 'claude', 'custom']);
  if (!allowed.has(botType)) redirect('/onboarding?error=' + enc('Invalid bot type'));

  const { data: existing } = await supabase
    .from('bot_connections')
    .select('api_key')
    .eq('user_id', user.id)
    .maybeSingle();

  const { error } = await supabase.from('bot_connections').upsert(
    {
      user_id: user.id,
      api_key: existing?.api_key || null,
      bot_name: botName || null,
      bot_type: botType,
      status: existing?.api_key ? 'connected' : 'disconnected',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) redirect('/onboarding?error=' + enc(error.message));
  redirect('/onboarding?saved=1');
}

export async function completeOnboardingAction() {
  const supabase = await createClient();
  if (!supabase) redirect('/onboarding?error=' + enc('Supabase env not configured'));

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // TEMP DEBUG — remove after
  if (!user) redirect('/onboarding?error=' + enc('AUTH FAILED: ' + (authError?.message || 'no user returned')));

  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) redirect('/onboarding?error=' + enc(error.message));

  redirect('/home');
}
