import Link from 'next/link';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

import { createClient } from '../../lib/supabase/server';
import { logoutAction } from '../auth/actions';

export default async function HomePage({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, headline, city, region, interests, goals, visibility, onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: intro } = await supabase
    .from('intro_preferences')
    .select('user_id, intro_types, open_to_meeting, preferred_locations, notes')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile || !intro || !profile.onboarding_complete) {
    redirect('/onboarding');
  }

  const params = await searchParams;
  const onboarded = params?.onboarded === '1';

  return (
    <div className="form-col" style={{ maxWidth: 860 }}>
      <section className="card">
        <h2>Home</h2>
        <p className="muted">Protected onboarding summary loaded from Supabase.</p>
        {onboarded ? <p style={{ color: '#8fd19e' }}>Onboarding complete. Your profile is saved.</p> : null}

        <div className="form-col" style={{ marginTop: 10 }}>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Username:</strong> {profile.username || '—'}</p>
          <p><strong>Display name:</strong> {profile.display_name || '—'}</p>
          <p><strong>Headline:</strong> {profile.headline || '—'}</p>
          <p><strong>City:</strong> {profile.city || '—'}</p>
          <p><strong>Region:</strong> {profile.region || '—'}</p>
          <p><strong>Interests:</strong> {(profile.interests || []).join(', ') || '—'}</p>
          <p><strong>Goals:</strong> {(profile.goals || []).join(', ') || '—'}</p>
          <p><strong>Visibility:</strong> {profile.visibility || 'connections'}</p>
          <p><strong>Onboarding complete:</strong> {profile.onboarding_complete ? 'true' : 'false'}</p>
          <p><strong>Intro types:</strong> {(intro.intro_types || []).join(', ') || '—'}</p>
          <p><strong>Open to meeting:</strong> {intro.open_to_meeting ? 'Yes' : 'No'}</p>
          <p><strong>Preferred locations:</strong> {(intro.preferred_locations || []).join(', ') || '—'}</p>
          <p><strong>Notes:</strong> {intro.notes || '—'}</p>
        </div>

        <div className="actions">
          <Link className="button" href="/onboarding?step=1">Edit onboarding</Link>
          <form action={logoutAction}>
            <button className="button" type="submit">Log out</button>
          </form>
        </div>
      </section>
    </div>
  );
}
