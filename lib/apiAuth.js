import { createAdminClient } from './supabase/admin';

function readApiKey(request) {
  const fromHeader = request.headers.get('x-api-key');
  if (fromHeader) return fromHeader.trim();

  const auth = request.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();

  return '';
}

export async function resolveApiClientUser(request) {
  const apiKey = readApiKey(request);
  if (!apiKey) return { error: 'Missing API key', status: 401 };

  const supabase = createAdminClient();
  if (!supabase) return { error: 'Server API auth not configured', status: 500 };

  const { data: connection, error } = await supabase
    .from('bot_connections')
    .select('user_id, status')
    .eq('api_key', apiKey)
    .maybeSingle();

  if (error || !connection?.user_id) return { error: 'Invalid API key', status: 401 };

  await supabase
    .from('bot_connections')
    .update({ status: 'connected', last_active: new Date().toISOString() })
    .eq('user_id', connection.user_id);

  return { supabase, userId: connection.user_id };
}
