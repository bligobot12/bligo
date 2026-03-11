'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

function enc(v) {
  return encodeURIComponent(v || 'Unexpected error');
}

function makeApiKey() {
  return `bligo_${crypto.randomUUID().replaceAll('-', '')}`;
}

export async function generateApiKeyAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/settings/api?error=' + enc('Supabase env not configured'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const apiKey = makeApiKey();
  const botName = String(formData?.get('bot_name') || '').trim();
  const botType = String(formData?.get('bot_type') || 'custom').trim();

  const { error } = await supabase
    .from('bot_api_keys')
    .insert({
      user_id: user.id,
      api_key: apiKey,
      bot_name: botName || null,
      bot_type: botType || null,
      last_active: new Date().toISOString(),
    });

  if (error) redirect('/settings/api?error=' + enc(error.message));
  redirect('/settings/api?saved=1');
}

export async function deleteApiKeyAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/settings/api?error=' + enc('Supabase env not configured'));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const keyId = String(formData.get('key_id') || '').trim();
  if (!keyId) redirect('/settings/api?error=' + enc('Missing key id'));

  const { error } = await supabase
    .from('bot_api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', user.id);

  if (error) redirect('/settings/api?error=' + enc(error.message));
  redirect('/settings/api?saved=1');
}

export async function saveBotSettingsAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/settings?error=' + enc('Supabase env not configured'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const botName = String(formData.get('bot_name') || '').trim();
  const botType = String(formData.get('bot_type') || 'openclaw').trim();
  const allowed = new Set(['openclaw', 'chatgpt', 'claude', 'custom']);

  if (!allowed.has(botType)) {
    redirect('/settings/api?error=' + enc('Invalid bot type'));
  }

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

  if (error) redirect('/settings/api?error=' + enc(error.message));
  redirect('/settings/api?saved=1');
}
