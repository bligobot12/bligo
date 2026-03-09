import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { generateApiKeyAction, saveBotSettingsAction } from '../actions';
import OnboardingPrompt from '../../components/OnboardingPrompt';

export default async function ApiSettingsPage({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect('/login');

  const { data: connection } = await supabase
    .from('bot_connections')
    .select('user_id, api_key, bot_name, bot_type, last_active, status')
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
        Connect your AI agent to Bligo via API key. Use the onboarding prompt to let your bot build your profile automatically.
      </p>
      {saved ? <p style={{ color: '#8fd19e' }}>Saved.</p> : null}
      {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}

      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 4 }}>Your API key</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Treat this like a password — keep it private and regenerate it anytime if exposed.
        </p>
        <p style={{ wordBreak: 'break-all', marginTop: 8 }}>
          <strong>{connection?.api_key || 'No API key yet'}</strong>
        </p>
        <form action={generateApiKeyAction} style={{ marginTop: 8 }}>
          <button className="button" type="submit">
            {connection?.api_key ? 'Regenerate API key' : 'Generate API key'}
          </button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 4 }}>Onboarding prompt</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Copy and paste into ChatGPT, Claude, Gemini, or your personal AI agent to build your profile conversationally.
        </p>
        {connection?.api_key ? (
          <OnboardingPrompt apiKey={connection.api_key} />
        ) : (
          <p className="muted">Generate an API key above first.</p>
        )}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 4 }}>Connected bot</h3>
        <p className="muted" style={{ marginTop: 0 }}>Tell Bligo which AI agent you are using.</p>
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
