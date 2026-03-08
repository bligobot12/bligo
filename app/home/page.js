import Link from 'next/link';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

import { createClient } from '../../lib/supabase/server';
import { logoutAction } from '../auth/actions';
import { acceptConnectionRequestAction, declineConnectionRequestAction } from '../connections/actions';

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

  const { data: incomingRequests } = await supabase
    .from('connections')
    .select('from_user_id, status, profiles:from_user_id(username,display_name)')
    .eq('to_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const params = await searchParams;
  const onboarded = params?.onboarded === '1';
  const accepted = params?.accepted === '1';
  const declined = params?.declined === '1';
  const error = params?.error ? decodeURIComponent(params.error) : '';

  return (
    <div className="form-col" style={{ maxWidth: 860 }}>
      <section className="card">
        <h2>Home</h2>
        <p className="muted">Protected onboarding summary loaded from Supabase.</p>
        {onboarded ? <p style={{ color: '#8fd19e' }}>Onboarding complete. Your profile is saved.</p> : null}
        {accepted ? <p style={{ color: '#8fd19e' }}>Connection request accepted.</p> : null}
        {declined ? <p style={{ color: '#8fd19e' }}>Connection request declined.</p> : null}
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}

        <h3 style={{ marginTop: 16 }}>Incoming connection requests</h3>
        <div className="feed" style={{ marginTop: 8 }}>
          {(incomingRequests || []).map((req) => {
            const from = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
            const label = from?.display_name || from?.username || req.from_user_id;
            return (
              <div key={req.from_user_id} className="post-item" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <strong>{label}</strong>
                  <p className="muted">@{from?.username || 'no-username'}</p>
                </div>
                <div className="actions" style={{ marginTop: 0 }}>
                  <form action={acceptConnectionRequestAction}>
                    <input type="hidden" name="from_user_id" value={req.from_user_id} />
                    <button className="button" type="submit">Accept</button>
                  </form>
                  <form action={declineConnectionRequestAction}>
                    <input type="hidden" name="from_user_id" value={req.from_user_id} />
                    <button className="button" type="submit">Decline</button>
                  </form>
                </div>
              </div>
            );
          })}
          {(incomingRequests || []).length === 0 ? <p className="muted">No pending requests.</p> : null}
        </div>

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
          <Link className="button" href="/connections">Find connections</Link>
          <Link className="button" href="/onboarding?step=1">Edit onboarding</Link>
          <form action={logoutAction}>
            <button className="button" type="submit">Log out</button>
          </form>
        </div>
      </section>
    </div>
  );
}
