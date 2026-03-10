import Link from 'next/link';
import { redirect } from 'next/navigation';


import { createClient } from '../../lib/supabase/server';

function renderList(values) {
  if (!values || values.length === 0) return '—';
  return values.join(', ');
}

export default async function ProfilePage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, headline, city, interests, goals, onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: prefs } = await supabase
    .from('intro_preferences')
    .select('intro_types')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: botConnection } = await supabase
    .from('bot_connections')
    .select('bot_name, bot_type, status, last_active')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_complete) redirect('/onboarding');

  return (
    <section className="card" style={{ maxWidth: 760 }}>
      <h2>Profile Preview</h2>
      <p className="muted" style={{ marginTop: 0 }}>This is how other members see you in intros and connection surfaces.</p>

      <div className="form-col" style={{ marginTop: 8 }}>
        {botConnection?.status === 'connected' && botConnection?.last_active ? (
          <div className="post-item">
            <p className="muted">Profile update source</p>
            <p>
              Last updated by bot ({botConnection.bot_name || botConnection.bot_type || 'agent'}) on{' '}
              {new Date(botConnection.last_active).toLocaleString()}
            </p>
          </div>
        ) : null}

        <div className="post-item" style={{ padding: 14 }}>
          <h3 style={{ margin: 0 }}>{profile.display_name || profile.username || '—'}</h3>
          <p className="muted" style={{ marginTop: 4 }}>@{profile.username || 'no-username'}</p>
          <p style={{ marginTop: 10 }}>{profile.headline || 'No headline yet.'}</p>
          <p className="muted" style={{ marginTop: 6 }}>{profile.city || 'City not set'}</p>

          <div style={{ marginTop: 12 }}>
            <p className="muted" style={{ marginBottom: 6 }}>Interests</p>
            <p>{renderList(profile.interests)}</p>
          </div>

          <div style={{ marginTop: 10 }}>
            <p className="muted" style={{ marginBottom: 6 }}>Goals</p>
            <p>{renderList(profile.goals)}</p>
          </div>
        </div>

        <div className="post-item">
          <p className="muted">Intro preferences</p>
          <p>{renderList(prefs?.intro_types || [])}</p>
        </div>
      </div>

      <div className="actions">
        <Link className="button primary" href="/onboarding?step=1">Edit onboarding</Link>
        <Link className="button" href="/home">Back home</Link>
      </div>
    </section>
  );
}
