import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

export default async function SettingsPage({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect('/login');

  const { data: connection } = await supabase
    .from('bot_connections')
    .select('bot_name, bot_type, status, last_active')
    .eq('user_id', user.id)
    .maybeSingle();

  const params = await searchParams;
  const saved = params?.saved === '1';

  return (
    <div className="form-col" style={{ maxWidth: 760 }}>
      <h2 style={{ marginBottom: 4 }}>Settings</h2>
      <p className="muted" style={{ marginTop: 0 }}>Manage your account and preferences.</p>
      {saved ? <p style={{ color: '#8fd19e' }}>Saved.</p> : null}

      {/* Account */}
      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 4 }}>Account</h3>
        <p className="muted" style={{ marginTop: 0 }}>Manage your login and profile details.</p>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a className="button" href="/settings/api" style={{ display: 'inline-block' }}>API & Onboarding</a>
          <a className="button" href="/skills" style={{ display: 'inline-block' }}>🧠 AI Skills Training</a>
          <a className="button" href="/skills/add" style={{ display: 'inline-block' }}>Add Skills</a>
          <a className="button" href="/forgot-password" style={{ display: 'inline-block' }}>Change password</a>
          <a className="button" href="/onboarding" style={{ display: 'inline-block' }}>Edit profile onboarding</a>
        </div>
      </section>

      {/* Bot Status */}
      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 4 }}>Connected Bot</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          {connection?.status === 'connected'
            ? `${connection.bot_name || connection.bot_type || 'Your bot'} is connected.`
            : 'No bot connected yet.'}
        </p>
        {connection?.last_active ? (
          <p className="muted" style={{ marginTop: 4 }}>Last active: {new Date(connection.last_active).toLocaleString()}</p>
        ) : null}
        <a className="button" href="/settings/api" style={{ display: 'inline-block', marginTop: 12 }}>Manage bot connection</a>
      </section>

      {/* Support */}
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
