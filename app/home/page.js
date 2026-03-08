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
    .select('user_id, username, display_name, bio, location, goals, interests')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: intro } = await supabase
    .from('intro_preferences')
    .select('user_id, preferred_industries, preferred_locations, intro_goal, dealbreakers, visibility')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile || !intro) {
    redirect('/onboarding');
  }

  const params = await searchParams;
  const onboarded = params?.onboarded === '1';

  return (
    <div className="form-col" style={{ maxWidth: 860 }}>
      <section className="card">
        <h2>Home</h2>
        <p className="muted">Protected profile summary loaded from Supabase.</p>
        {onboarded ? <p style={{ color: '#8fd19e' }}>Onboarding complete. Your profile is saved.</p> : null}

        <div className="form-col" style={{ marginTop: 10 }}>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Username:</strong> {profile.username || '—'}</p>
          <p><strong>Display name:</strong> {profile.display_name || '—'}</p>
          <p><strong>Bio:</strong> {profile.bio || '—'}</p>
          <p><strong>Location:</strong> {profile.location || '—'}</p>
          <p><strong>Goals:</strong> {profile.goals || '—'}</p>
          <p><strong>Interests:</strong> {profile.interests || '—'}</p>
          <p><strong>Preferred industries:</strong> {(intro.preferred_industries || []).join(', ') || '—'}</p>
          <p><strong>Preferred locations:</strong> {(intro.preferred_locations || []).join(', ') || '—'}</p>
          <p><strong>Intro goal:</strong> {intro.intro_goal || '—'}</p>
          <p><strong>Dealbreakers:</strong> {intro.dealbreakers || '—'}</p>
          <p><strong>Visibility:</strong> {intro.visibility || 'private'}</p>
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
