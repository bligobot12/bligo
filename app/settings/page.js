import OnboardingPrompt from './OnboardingPrompt';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { generateApiKeyAction, saveBotSettingsAction } from './actions';

export default async function SettingsPage({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
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
    <div className="form-col" style={{ maxWidth: 760 }}>
      <h2 style={{ marginBottom: 4 }}>Settings</h2>
      <p className="muted" style={{ marginTop: 0 }}>Manage your account, bot connection, and preferences.</p>
      {saved ? <p style={{ color: '#8fd19e' }}>Settings saved.</p> : null}
      {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}

      {/* CARD 1 — API & Onboarding */}
      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 4 }}>API & Onboarding</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Your API key connects your AI agent to Bligo. Use the onboarding prompt to let your bot build your profile automatically.
        </p>

        <div style={{ marginTop: 12 }}>
          <p className="muted" style={{ marginBottom: 4 }}>Your API key</p>
          <p style={{ wordBreak: 'break-all', marginTop: 0 }}>
            <strong>{connection?.api_key || 'No API key yet'}</strong>
          </p>
          <form action={generateApiKeyAction} style={{ marginTop: 8 }}>
            <button className="button" type="submit">
              {connection?.api_key ? 'Regenerate API key' : 'Generate API key'}
            </button>
          </form>
        </div>

        <div style={{ marginTop: 20, borderTop: '1px solid #2a2a2a', paddingTop: 16 }}>
          <p className="muted" style={{ marginBottom: 4 }}>Onboarding prompt</p>
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            Copy and paste into ChatGPT, Claude, Gemini, or your personal AI agent to build your profile conversationally.
          </p>
          {connection?.api_key ? (
            <OnboardingPrompt apiKey={connection.api_key} />
          ) : (
            <p className="muted">Generate an API key first to see your onboarding prompt.</p>
          )}
        </div>
      </section>

      {/* CARD 2 — Connected Bot */}
      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 4 }}>Connected Bot</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Tell Bligo which AI agent you are using to keep your profile updated.
        </p>
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

      {/* CARD 3 — Account */}
      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 4 }}>Account</h3>
        <p className="muted" style={{ marginTop: 0 }}>Manage your login and account details.</p>
        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <a className="button" href="/forgot-password">Change password</a>
        </div>
      </section>

      {/* CARD 4 — Support */}
      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 4 }}>Support</h3>
        <p className="muted" style={{ marginTop: 0 }}>Need help or want to report an issue?</p>
        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <a className="button" href="/contact">Contact us</a>
          <a className="button" href="mailto:support@bligo.ai">Report a problem</a>
        </div>
      </section>
    </div>
  );
}
