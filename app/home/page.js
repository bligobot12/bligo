import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '../../lib/supabase/server';
import { createAdminClient } from '../../lib/supabase/admin';
import { acceptConnectionRequestAction, declineConnectionRequestAction } from '../connections/actions';
import { respondToIntroAction } from '../matching/actions';

function overlapCount(a, b) {
  const setB = new Set(Array.isArray(b) ? b.map((x) => String(x).toLowerCase()) : []);
  return (Array.isArray(a) ? a : []).reduce((count, x) => (setB.has(String(x).toLowerCase()) ? count + 1 : count), 0);
}

export default async function HomePage({ searchParams }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect('/login');

  const adminClient = createAdminClient();
  const { data: profile } = await (adminClient || supabase)
    .from('profiles')
    .select('user_id, username, display_name, headline, city, interests, signals, onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_complete) redirect('/onboarding');

  const { data: botConnection } = await supabase
    .from('bot_connections')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: incomingRequests } = await supabase
    .from('connections')
    .select('from_user_id, profiles:from_user_id(username,display_name)')
    .eq('to_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: suggestedIntros } = await supabase
    .from('match_candidates')
    .select('id, user_b_id, reason_why_now')
    .eq('user_a_id', user.id)
    .eq('status', 'pending')
    .order('score', { ascending: false })
    .limit(3);

  const { data: acceptedConnections } = await supabase
    .from('connections')
    .select('from_user_id, to_user_id, updated_at')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .eq('status', 'accepted')
    .order('updated_at', { ascending: false })
    .limit(5);

  const recentAcceptedIds = [...new Set((acceptedConnections || []).map((c) => (c.from_user_id === user.id ? c.to_user_id : c.from_user_id)))];

  const introIds = (suggestedIntros || []).map((i) => i.user_b_id);
  const discoverCandidatesLimit = 12;
  const { data: discoverPool } = await supabase
    .from('profiles')
    .select('user_id, display_name, headline, city, interests, signals, created_at')
    .neq('user_id', user.id)
    .eq('onboarding_complete', true)
    .order('created_at', { ascending: false })
    .limit(discoverCandidatesLimit);

  const profileIds = [...new Set([...introIds, ...recentAcceptedIds, ...(discoverPool || []).map((p) => p.user_id)])];
  const { data: profileRows } = profileIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username, headline, city').in('user_id', profileIds)
    : { data: [] };
  const byId = new Map((profileRows || []).map((p) => [p.user_id, p]));

  const myInterests = profile.interests || [];
  const mySignalTags = (profile.signals || []).map((s) => s?.tag).filter(Boolean);

  const discoverMatches = (discoverPool || [])
    .map((p) => {
      const score = overlapCount(myInterests, p.interests) + overlapCount(mySignalTags, (p.signals || []).map((s) => s?.tag));
      return { ...p, overlapScore: score };
    })
    .filter((p) => p.overlapScore > 0)
    .slice(0, 3);

  const { data: recentSearches } = await supabase
    .from('searches')
    .select('query, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  const params = await searchParams;
  const accepted = params?.accepted === '1';
  const declined = params?.declined === '1';
  const responded = params?.responded === '1';
  const error = params?.error ? decodeURIComponent(params.error) : '';

  return (
    <div className="form-col" style={{ maxWidth: 1050 }}>
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>{profile.display_name || profile.username || 'Your dashboard'}</h2>
            <p className="muted">{profile.headline || 'Add a headline in settings'}</p>
            <p className="muted">{profile.city || 'City not set'}</p>
          </div>
          <div>
            <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, display: 'inline-block', background: botConnection?.status === 'connected' ? '#52d273' : '#80889b' }} />
              Bot {botConnection?.status === 'connected' ? 'connected' : 'not connected'}
            </p>
            <div className="actions" style={{ marginTop: 8 }}>
              <Link className="button" href="/posts">Post something</Link>
              <Link className="button" href="/search">Search</Link>
            </div>
          </div>
        </div>
        {accepted ? <p style={{ color: '#8fd19e' }}>Connection request accepted.</p> : null}
        {declined ? <p style={{ color: '#8fd19e' }}>Connection request declined.</p> : null}
        {responded ? <p style={{ color: '#8fd19e' }}>Intro response saved.</p> : null}
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}
      </section>

      <div className="home-grid">
        <section className="card">
          <h3>Suggested Introductions</h3>
          <div className="feed" style={{ marginTop: 8 }}>
            {(suggestedIntros || []).map((match) => {
              const matched = byId.get(match.user_b_id);
              return (
                <div key={match.id} className="post-item">
                  <strong>{matched?.display_name || matched?.username || 'Suggested person'}</strong>
                  <p className="muted">{matched?.headline || 'No headline yet'}</p>
                  <p>{match.reason_why_now || 'Potentially strong fit based on your profile.'}</p>
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
            {(suggestedIntros || []).length === 0 ? <p className="muted">No intros right now.</p> : null}
          </div>
        </section>

        <section className="card">
          <h3>Your Network Activity</h3>
          <p className="muted" style={{ marginTop: 6 }}>Incoming requests</p>
          <div className="feed" style={{ marginTop: 6 }}>
            {(incomingRequests || []).map((req) => {
              const from = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
              return (
                <div key={req.from_user_id} className="post-item">
                  <strong>{from?.display_name || from?.username || req.from_user_id}</strong>
                  <div className="actions" style={{ marginTop: 8 }}>
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

          <p className="muted" style={{ marginTop: 14 }}>Recent accepted</p>
          <div className="feed" style={{ marginTop: 6 }}>
            {recentAcceptedIds.map((id) => {
              const p = byId.get(id);
              return (
                <div key={id} className="post-item">
                  <strong>{p?.display_name || p?.username || 'Connection'}</strong>
                  <p className="muted">{p?.headline || 'No headline yet'}</p>
                </div>
              );
            })}
            {recentAcceptedIds.length === 0 ? <p className="muted">No recent accepted connections.</p> : null}
          </div>
        </section>

        <section className="card" style={{ gridColumn: '1 / -1' }}>
          <h3>Discover</h3>
          <div className="grid" style={{ marginTop: 10 }}>
            <div className="post-item">
              <strong>New users who match your profile</strong>
              <div className="feed" style={{ marginTop: 8 }}>
                {discoverMatches.map((u) => (
                  <div key={u.user_id}>
                    <strong>{u.display_name || 'New user'}</strong>
                    <p className="muted">{u.headline || 'No headline yet'} · {u.city || 'City not set'}</p>
                  </div>
                ))}
                {discoverMatches.length === 0 ? <p className="muted">No overlap found yet.</p> : null}
              </div>
            </div>
            <div className="post-item">
              <strong>Based on your recent searches</strong>
              <div className="feed" style={{ marginTop: 8 }}>
                {(recentSearches || []).map((s, idx) => (
                  <p key={idx} className="muted">“{s.query}”</p>
                ))}
                {(recentSearches || []).length === 0 ? <p className="muted">Search history will appear here once search is live.</p> : null}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="quick-links-row">
          <Link href="/connections">Find connections</Link>
          <Link href="/search">Search</Link>
          <Link href="/posts">Posts</Link>
          <Link href="/history">History</Link>
          <Link href="/settings">Settings</Link>
        </div>
      </section>
    </div>
  );
}
