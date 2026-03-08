import Link from 'next/link';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

import { createClient } from '../../lib/supabase/server';
import { logoutAction } from '../auth/actions';
import { acceptConnectionRequestAction, declineConnectionRequestAction } from '../connections/actions';
import { generateMatchCandidatesAction, respondToIntroAction, runMatchingNowAction } from '../matching/actions';

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

  const { data: botConnection } = await supabase
    .from('bot_connections')
    .select('bot_name, bot_type, status, last_active')
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

  await generateMatchCandidatesAction();

  const { data: suggestedIntros } = await supabase
    .from('match_candidates')
    .select('id, user_a_id, user_b_id, reason_why_now, reason_trust_path, shared_signals, status')
    .eq('user_a_id', user.id)
    .eq('status', 'pending')
    .order('score', { ascending: false })
    .limit(3);

  const matchIds = (suggestedIntros || []).map((row) => row.user_b_id);
  const { data: matchedProfiles } = matchIds.length
    ? await supabase
        .from('profiles')
        .select('user_id, display_name, headline')
        .in('user_id', matchIds)
    : { data: [] };
  const matchedById = new Map((matchedProfiles || []).map((p) => [p.user_id, p]));

  const params = await searchParams;
  const onboarded = params?.onboarded === '1';
  const accepted = params?.accepted === '1';
  const declined = params?.declined === '1';
  const responded = params?.responded === '1';
  const matched = params?.matched === '1';
  const error = params?.error ? decodeURIComponent(params.error) : '';

  return (
    <div className="form-col" style={{ maxWidth: 860 }}>
      <section className="card">
        <h2>Home</h2>
        {onboarded ? <p style={{ color: '#8fd19e' }}>Onboarding complete. Your profile is saved.</p> : null}
        {accepted ? <p style={{ color: '#8fd19e' }}>Connection request accepted.</p> : null}
        {declined ? <p style={{ color: '#8fd19e' }}>Connection request declined.</p> : null}
        {responded ? <p style={{ color: '#8fd19e' }}>Intro response saved.</p> : null}
        {matched ? <p style={{ color: '#8fd19e' }}>Matching completed. New introductions are ready.</p> : null}
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

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Suggested introductions</h3>
          <form action={runMatchingNowAction}>
            <button className="button secondary" type="submit">Find my matches</button>
          </form>
        </div>
        <div className="feed" style={{ marginTop: 8 }}>
          {(suggestedIntros || []).map((match) => {
            const matched = matchedById.get(match.user_b_id);
            return (
              <div key={match.id} className="post-item">
                <div>
                  <strong>{matched?.display_name || 'Suggested person'}</strong>
                  <p className="muted">{matched?.headline || 'No headline yet'}</p>
                  <p style={{ marginTop: 6 }}>{match.reason_why_now || 'Potentially strong fit based on your profile signals.'}</p>
                  <p className="muted" style={{ marginTop: 4 }}>Trust path: {match.reason_trust_path || 'Shared interests'}</p>
                </div>
                <div className="actions" style={{ marginTop: 10 }}>
                  <form action={respondToIntroAction}>
                    <input type="hidden" name="match_candidate_id" value={match.id} />
                    <input type="hidden" name="response" value="accept" />
                    <button className="button" type="submit">Accept</button>
                  </form>
                  <form action={respondToIntroAction}>
                    <input type="hidden" name="match_candidate_id" value={match.id} />
                    <input type="hidden" name="response" value="decline" />
                    <button className="button" type="submit">Decline</button>
                  </form>
                </div>
              </div>
            );
          })}
          {(suggestedIntros || []).length === 0 ? <p className="muted">No suggested intros yet. Add interests/goals and build a few connections first.</p> : null}
        </div>

        <Link href="/profile" className="post-item" style={{ marginTop: 12, display: 'block' }}>
          <p className="muted" style={{ marginBottom: 6 }}>Your profile</p>
          <h3 style={{ margin: 0 }}>{profile.display_name || profile.username || 'Unnamed user'}</h3>
          <p className="muted" style={{ marginTop: 4 }}>{profile.headline || 'Add a headline in onboarding'}</p>
          <p className="muted" style={{ marginTop: 4 }}>{profile.city || 'City not set'}</p>
          {botConnection?.status === 'connected' && botConnection?.last_active ? (
            <p className="muted" style={{ marginTop: 4 }}>
              Updated by bot ({botConnection.bot_name || botConnection.bot_type || 'agent'}) · {new Date(botConnection.last_active).toLocaleString()}
            </p>
          ) : null}
        </Link>

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
