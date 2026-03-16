import Link from 'next/link';

import Avatar from '../../components/Avatar';
import UserCard from '../../components/UserCard';
import PostCard from '../../components/PostCard';
import { createClient } from '../../lib/supabase/server';
import { createPostAction, deletePostAction, searchFromPostAction } from '../posts/actions';
import {
  acceptConnectionRequestAction,
  declineConnectionRequestAction,
  sendConnectionRequestAction,
} from '../connections/actions';
import { respondToIntroAction, runMatchingNowAction } from '../matching/actions';
import { getDegreLabel } from '../../lib/ui/getDegreeLabel';

export default async function HomePage({ searchParams }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 40 }}>
      <p>Please <a href="/login">log in</a> to view this page.</p>
    </div>
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, display_name, headline, city, avatar_url, onboarding_complete, industry, job_title, location_city, location_state')
    .eq('user_id', user.id)
    .maybeSingle();

  const safeProfile = profile || {
    user_id: user.id,
    first_name: null,
    last_name: null,
    display_name: null,
    headline: null,
    city: null,
    avatar_url: null,
  };

  const { data: botConnection } = await supabase
    .from('bot_connections')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: incomingRequests } = await supabase
    .from('connections')
    .select('from_user_id, profiles:from_user_id(display_name,headline,avatar_url,job_title,industry,location_city,location_state)')
    .eq('to_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: friendConns } = await supabase
    .from('connections')
    .select('from_user_id, to_user_id')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .eq('status', 'accepted');

  const friendIds = new Set((friendConns || []).map((c) =>
    c.from_user_id === user.id ? c.to_user_id : c.from_user_id
  ));

  const directConnectionIds = friendIds;

  const { count: connectionCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .eq('status', 'accepted');

  const { count: matchCount } = await supabase
    .from('match_candidates')
    .select('*', { count: 'exact', head: true })
    .eq('user_a_id', user.id)
    .eq('status', 'pending');

  const { data: suggestedIntros } = await supabase
    .from('match_candidates')
    .select('id, user_a_id, user_b_id, reason_why_now, shared_signals')
    .eq('user_a_id', user.id)
    .eq('status', 'pending')
    .order('score', { ascending: false })
    .limit(3);

  const filteredMatches = (suggestedIntros || []).filter((m) => {
    const otherId = m.user_a_id === user.id ? m.user_b_id : m.user_a_id;
    return !friendIds.has(otherId);
  });

  const matchedIds = filteredMatches.map((row) => row.user_b_id);
  const { data: matchedProfiles } = matchedIds.length
    ? await supabase
        .from('profiles')
        .select('user_id, display_name, headline, avatar_url')
        .in('user_id', matchedIds)
    : { data: [] };
  const matchedById = new Map((matchedProfiles || []).map((p) => [p.user_id, p]));

  const feedIds = [user.id, ...Array.from(directConnectionIds || [])];
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('id, content, post_type, created_at, user_id, profiles:user_id(display_name, headline, avatar_url)')
    .in('user_id', feedIds)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: allDiscoverUsers } = await supabase
    .from('profiles')
    .select('user_id, display_name, headline, city, avatar_url')
    .neq('user_id', user.id)
    .eq('onboarding_complete', true)
    .limit(10);
  const discoverUsers = (allDiscoverUsers || []).filter(u => !directConnectionIds.has(u.user_id)).slice(0, 5);

  const params = await searchParams;
  const accepted = params?.accepted === '1';
  const declined = params?.declined === '1';
  const responded = params?.responded === '1';
  const matched = params?.matched === '1';
  const posted = params?.posted === '1';
  const error = params?.error ? decodeURIComponent(params.error) : '';

  return (
    <>
      <div style={{ maxWidth: 1100, margin: '0 auto 12px' }}>
        {accepted ? <p style={{ color: '#8fd19e' }}>Connection request accepted.</p> : null}
        {declined ? <p style={{ color: '#8fd19e' }}>Connection request declined.</p> : null}
        {responded ? <p style={{ color: '#8fd19e' }}>Intro response saved.</p> : null}
        {matched ? <p style={{ color: '#8fd19e' }}>New matches generated.</p> : null}
        {posted ? <p style={{ color: '#8fd19e' }}>Posted.</p> : null}
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}
      </div>

      <div className="home-grid">
        <aside style={{ position: 'sticky', top: 20 }}>
          <div className="card" style={{ textAlign: 'center', paddingBottom: 16 }}>
            <div style={{ height: 60, background: '#F0F2F5', borderRadius: '8px 8px 0 0', margin: '-16px -16px 0' }} />

            <Avatar src={safeProfile.avatar_url} name={safeProfile.display_name || `${safeProfile.first_name || ""} ${safeProfile.last_name || ""}`.trim() || "You"} size={72} style={{ marginTop: -36, border: '3px solid #111' }} />

            <h3 style={{ margin: '8px 0 2px' }}>
              <Link href={`/profile/${user.id}`}>{safeProfile.display_name || `${safeProfile.first_name || ""} ${safeProfile.last_name || ""}`.trim() || "You"}</Link>
            </h3>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>{safeProfile.headline || 'Add a headline'}</p>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>{safeProfile.city || 'City not set'}</p>

            <div style={{ borderTop: '1px solid #CED0D4', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <Link href="/connections"><strong>{connectionCount || 0}</strong> Friends</Link>
              </div>
              {matchCount > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <span><strong>{matchCount}</strong> Matches</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #CED0D4', marginTop: 12, paddingTop: 12, fontSize: 12 }}>
              {botConnection?.status === 'connected'
                ? <span>🟢 Bot connected</span>
                : <span style={{ color: '#888' }}>⚪ No bot connected</span>}
            </div>

            <div style={{ borderTop: '1px solid #CED0D4', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <a href="/onboarding" className="muted" style={{ fontSize: 13 }}>✏️ Edit profile</a>
              <a href="/settings" className="muted" style={{ fontSize: 13 }}>⚙️ Settings</a>
              <a href="/connections" className="muted" style={{ fontSize: 13 }}>👥 My friends</a>
            </div>
          </div>
        </aside>

        <main>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Avatar src={safeProfile.avatar_url} name={safeProfile.display_name || `${safeProfile.first_name || ""} ${safeProfile.last_name || ""}`.trim() || "You"} size={40} />
              <form action={createPostAction} style={{ flex: 1 }}>
                <input
                  className="input"
                  name="content"
                  placeholder="Post publicly or search privately for what you're looking for"
                  style={{ borderRadius: 20 }}
                />
                <input type="hidden" name="post_type" value="intent" />
                <input type="hidden" name="visibility" value="connections" />
                <button className="button primary" type="submit" style={{ marginTop: 8, width: '100%' }}>Post</button>
              </form>
            </div>
          </div>

          {(incomingRequests || []).length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 12px' }}>Friend requests</h4>
              {(incomingRequests || []).map((req) => {
                const from = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
                return (
                  <UserCard
                    key={req.from_user_id}
                    user={from}
                    degree={getDegreLabel(null)}
                    subtitle={from?.headline || ''}
                    profileHref={`/profile/${req.from_user_id}`}
                    messageHref={`/messages/${req.from_user_id}`}
                    right={<div style={{ display: 'flex', gap: 6 }}>
                      <form action={acceptConnectionRequestAction}><input type="hidden" name="from_user_id" value={req.from_user_id} /><button className="button primary" type="submit" style={{ padding: '4px 12px', fontSize: 12 }}>Accept</button></form>
                      <form action={declineConnectionRequestAction}><input type="hidden" name="from_user_id" value={req.from_user_id} /><button className="button" type="submit" style={{ padding: '4px 12px', fontSize: 12 }}>Decline</button></form>
                    </div>}
                  />
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(recentPosts || []).length === 0 ? (
              <div className="card">
                <p className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>
                  Your feed will fill up as you and your friends post.<br />
                  <strong>Start by posting what you're looking for.</strong>
                </p>
              </div>
            ) : (recentPosts || []).map((post) => {
              const p = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
              return (
                <div key={post.id} className="card">
                  <PostCard post={post} currentUserId={user.id} deleteAction={deletePostAction} />
                </div>
              );
            })}
          </div>
        </main>

        <aside>
          <div className="card" style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 12px' }}>People you should meet</h4>
            {(filteredMatches || []).length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>No suggestions yet — your matches will appear here.</p>
            ) : (filteredMatches || []).map((match) => {
              const matched = matchedById.get(match.user_b_id);
              return (
                <div key={match.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #CED0D4' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Avatar src={matched?.avatar_url} name={matched?.display_name} size={40} />
                    <div style={{ flex: 1 }}>
                      <Link href={`/profile/${match.user_b_id}`}><strong style={{ fontSize: 14 }}>{matched?.display_name || 'Someone new'}</strong></Link>
                      <span className="degree-badge"> {getDegreLabel(2)}</span>
                      <p className="muted" style={{ margin: '2px 0', fontSize: 12 }}>{matched?.headline}</p>
                      <p style={{ margin: '4px 0', fontSize: 12 }}>{match.reason_why_now || 'Strong signal overlap'}</p>
                      <div style={{ marginTop: 4 }}>
                        {(Array.isArray(match.shared_signals) ? match.shared_signals : Object.keys(match.shared_signals || {})).slice(0, 3).map((sig, i) => (
                          <span key={i} className="signal-chip">{String(sig)}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <a className="button" href={`/messages/${match.user_b_id}`} style={{ fontSize: 12 }}>Message →</a>
                    <form action={respondToIntroAction} style={{ flex: 1 }}>
                      <input type="hidden" name="match_candidate_id" value={match.id} />
                      <input type="hidden" name="response" value="accept" />
                      <button className="button primary" type="submit" style={{ width: '100%', fontSize: 12 }}>Connect</button>
                    </form>
                    <form action={respondToIntroAction} style={{ flex: 1 }}>
                      <input type="hidden" name="match_candidate_id" value={match.id} />
                      <input type="hidden" name="response" value="decline" />
                      <button className="button" type="submit" style={{ width: '100%', fontSize: 12 }}>Skip</button>
                    </form>
                  </div>
                </div>
              );
            })}
            <form action={runMatchingNowAction}>
              <button className="button" type="submit" style={{ width: '100%', fontSize: 12, marginTop: 4 }}>Find more matches</button>
            </form>
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 12px' }}>Grow your network</h4>
            {(discoverUsers || []).length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>Invite friends to unlock more connections.</p>
            ) : (discoverUsers || []).slice(0, 3).map((u) => (
              <div key={u.user_id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <Avatar src={u.avatar_url} name={u.display_name} size={36} />
                <div style={{ flex: 1 }}>
                  <Link href={`/profile/${u.user_id}`}><strong style={{ fontSize: 15, fontWeight: 600 }}>{u.display_name} <span className="degree-badge">{getDegreLabel(null)}</span></strong></Link>
                  <p className="muted" style={{ margin: 0, fontSize: 11 }}>{u.city}</p>
                </div>
                <form action={sendConnectionRequestAction}>
                  <input type="hidden" name="to_user_id" value={u.user_id} />
                  <button className="button" type="submit" style={{ fontSize: 11, padding: '3px 10px' }}>+ Connect</button>
                </form>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}