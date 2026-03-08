import { redirect } from 'next/navigation';


import { createClient } from '../../lib/supabase/server';
import { generateApiKeyAction, saveBotSettingsAction } from './actions';

export default async function SettingsPage({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: connection } = await supabase
    .from('bot_connections')
    .select('user_id, api_key, bot_name, bot_type, last_active, status, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  const params = await searchParams;
  const saved = params?.saved === '1';
  const error = params?.error ? decodeURIComponent(params.error) : '';

  return (
    <section className="card" style={{ maxWidth: 760 }}>
      <h2>Settings</h2>
      {saved ? <p style={{ color: '#8fd19e' }}>Settings saved.</p> : null}
      {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}

      <div className="form-col" style={{ marginTop: 10 }}>
        <h3 style={{ marginBottom: 4 }}>Bligo API key</h3>
        <p className="muted" style={{ marginTop: 0 }}>Use this key to connect your AI agent securely.</p>
        <p style={{ wordBreak: 'break-all' }}>
          <strong>{connection?.api_key || 'No API key yet'}</strong>
        </p>
        <form action={generateApiKeyAction}>
          <button className="button" type="submit">{connection?.api_key ? 'Regenerate API key' : 'Generate API key'}</button>
        </form>
      </div>

      <form className="form-col" action={saveBotSettingsAction} style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 4 }}>Connected bot</h3>
        <label className="muted">Bot name</label>
        <input className="input" name="bot_name" defaultValue={connection?.bot_name || ''} placeholder="My Assistant" />

        <label className="muted">Bot type</label>
        <select className="input" name="bot_type" defaultValue={connection?.bot_type || 'openclaw'}>
          <option value="openclaw">OpenClaw</option>
          <option value="chatgpt">ChatGPT</option>
          <option value="claude">Claude</option>
          <option value="custom">Custom</option>
        </select>

        <p className="muted">Status: {connection?.status || 'disconnected'}</p>
        <p className="muted">Last active: {connection?.last_active ? new Date(connection.last_active).toLocaleString() : 'Never'}</p>

        <button className="button primary" type="submit">Save bot settings</button>
      </form>
    </section>
  );
}
