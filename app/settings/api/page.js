import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { deleteApiKeyAction, generateApiKeyAction, saveBotSettingsAction } from '../actions';
import OnboardingPrompt from '../../../components/OnboardingPrompt';

export default async function ApiSettingsPage({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect('/login');

  const { data: keys } = await supabase
    .from('bot_api_keys')
    .select('id, api_key, bot_name, bot_type, created_at, last_active')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const latestKey = (keys || [])[0]?.api_key || null;

  const { data: connection } = await supabase
    .from('bot_connections')
    .select('user_id, bot_name, bot_type, last_active, status')
    .eq('user_id', user.id)
    .maybeSingle();

  const params = await searchParams;
  const saved = params?.saved === '1';
  const error = params?.error ? decodeURIComponent(params.error) : '';

  return (
    <div className="form-col" style={{ maxWidth: 760 }}>
      <a className="muted" href="/settings" style={{ fontSize: 13 }}>← Back to Settings</a>
      <h2 style={{ marginBottom: 4, marginTop: 12 }}>API & Onboarding</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Connect your AI agent to Bligo via API keys. You can keep separate keys per bot.
      </p>
      {saved ? <p style={{ color: '#8fd19e' }}>Saved.</p> : null}
      {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}

      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 4 }}>API keys</h3>
        <p className="muted" style={{ marginTop: 0 }}>Generate one key per bot and remove old keys anytime.</p>

        <form action={generateApiKeyAction} className="form-col" style={{ marginTop: 10 }}>
          <input className="input" name="bot_name" placeholder="Bot name (e.g. Home Assistant)" />
          <select className="input" name="bot_type" defaultValue="custom">
            <option value="openclaw">OpenClaw</option>
            <option value="chatgpt">ChatGPT</option>
            <option value="claude">Claude</option>
            <option value="custom">Custom</option>
          </select>
          <button className="button" type="submit">Generate new API key</button>
        </form>

        <div style={{ marginTop: 14 }}>
          {(keys || []).length === 0 ? <p className="muted">No API keys yet.</p> : null}
          {(keys || []).map((k) => (
            <div key={k.id} className="card" style={{ marginBottom: 8 }}>
              <p style={{ wordBreak: 'break-all', margin: 0 }}><strong>{k.api_key}</strong></p>
              <p className="muted" style={{ margin: '6px 0 0' }}>
                {k.bot_name || 'Unnamed bot'} · {k.bot_type || 'custom'}
              </p>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>
                Created: {k.created_at ? new Date(k.created_at).toLocaleString() : '—'} · Last active: {k.last_active ? new Date(k.last_active).toLocaleString() : 'Never'}
              </p>
              <form action={deleteApiKeyAction} style={{ marginTop: 8 }}>
                <input type="hidden" name="key_id" value={k.id} />
                <button className="button" type="submit">Delete key</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 4 }}>Onboarding prompt</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Copy and paste into your assistant to help it build your profile.
        </p>
        {latestKey ? <OnboardingPrompt apiKey={latestKey} /> : <p className="muted">Generate an API key above first.</p>}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 4 }}>Connected bot</h3>
        <p className="muted" style={{ marginTop: 0 }}>Tell Bligo which bot is your default connection.</p>
        <form className="form-col" action={saveBotSettingsAction} style={{ marginTop: 12 }}>
          <label className="muted">Bot name</label>
          <input className="input" name="bot_name" defaultValue={connection?.bot_name || ''} placeholder="My Assistant" />
          <label className="muted">Bot type</label>
          <select className="input" name="bot_type" defaultValue={connection?.bot_type || 'chatgpt'}>
            <option value="openclaw">OpenClaw</option>
            <option value="chatgpt">ChatGPT</option>
            <option value="claude">Claude</option>
            <option value="custom">Custom</option>
          </select>
          <p className="muted" style={{ marginTop: 8 }}>Status: {connection?.status || 'disconnected'}</p>
          <p className="muted" style={{ marginTop: 0 }}>Last active: {connection?.last_active ? new Date(connection.last_active).toLocaleString() : 'Never'}</p>
          <button className="button primary" type="submit" style={{ marginTop: 8 }}>Save bot settings</button>
        </form>
      </section>
    </div>
  );
}
