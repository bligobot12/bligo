import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import Avatar from '../../components/Avatar';
import { respondToIntroAction, runMatchingNowAction } from '../matching/actions';

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect('/login');

  const userId = session.user.id;

  const { data: matches } = await supabase
    .from('match_candidates')
    .select(`
      id, score, score_breakdown, reason_why_now, shared_signals, status, created_at,
      profiles:user_b_id (user_id, display_name, first_name, last_name, avatar_url, headline, job_title, industry, location_city, location_state)
    `)
    .eq('user_a_id', userId)
    .eq('status', 'pending')
    .order('score', { ascending: false })
    .limit(20);

  return (
    <section style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Your Matches</h1>
          <p className="muted" style={{ marginTop: 4 }}>AI-curated introductions based on your profile and network.</p>
        </div>
        <form action={runMatchingNowAction}>
          <button className="button" type="submit">🔄 Refresh matches</button>
        </form>
      </div>

      {(!matches || matches.length === 0) && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontSize: 24, marginBottom: 12 }}>🤝</p>
          <h3>No matches yet</h3>
          <p className="muted">Add more to your profile or connect with more people to improve your matches.</p>
          <a href="/skills/add" className="button primary" style={{ marginTop: 16, display: 'inline-block' }}>Add skills to improve matches</a>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(matches || []).map((match) => {
          const profile = Array.isArray(match.profiles) ? match.profiles[0] : match.profiles;
          if (!profile) return null;

          const name = profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown';
          const breakdown = match.score_breakdown || {};

          return (
            <div key={match.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <a href={`/profile/${profile.user_id}`}>
                  <Avatar src={profile.avatar_url} name={name} size={48} />
                </a>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <a href={`/profile/${profile.user_id}`} style={{ fontWeight: 700, fontSize: 16 }}>{name}</a>
                      {profile.headline && <p className="muted" style={{ margin: '2px 0', fontSize: 13 }}>{profile.headline}</p>}
                      {(profile.job_title || profile.industry) && (
                        <p className="muted" style={{ margin: '2px 0', fontSize: 13 }}>
                          {[profile.job_title, profile.industry].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {profile.location_city && (
                        <p className="muted" style={{ margin: '2px 0', fontSize: 12 }}>
                          📍 {profile.location_city}{profile.location_state ? `, ${profile.location_state}` : ''}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span
                        style={{
                          background: '#E7F3FF',
                          color: '#1877F2',
                          borderRadius: 20,
                          padding: '4px 10px',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {match.score}% match
                      </span>
                    </div>
                  </div>

                  {match.reason_why_now && (
                    <p style={{ fontSize: 12, color: '#1877F2', marginTop: 8, fontStyle: 'italic' }}>
                      ⚡ {match.reason_why_now}
                    </p>
                  )}

                  {match.shared_signals?.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {match.shared_signals.slice(0, 4).map((s, i) => (
                        <span
                          key={i}
                          style={{
                            background: '#F0F2F5',
                            color: '#65676B',
                            borderRadius: 12,
                            padding: '3px 10px',
                            fontSize: 12,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {Object.keys(breakdown).length > 0 && (
                    <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                      Signals: {Object.entries(breakdown).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(' · ')}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <form action={respondToIntroAction}>
                      <input type="hidden" name="match_candidate_id" value={match.id} />
                      <input type="hidden" name="response" value="accept" />
                      <button className="button primary" type="submit" style={{ fontSize: 13, padding: '6px 14px' }}>
                        ✓ Accept intro
                      </button>
                    </form>
                    <form action={respondToIntroAction}>
                      <input type="hidden" name="match_candidate_id" value={match.id} />
                      <input type="hidden" name="response" value="decline" />
                      <button className="button" type="submit" style={{ fontSize: 13, padding: '6px 14px' }}>
                        ✗ Pass
                      </button>
                    </form>
                    <a href={`/profile/${profile.user_id}`} className="button" style={{ fontSize: 13, padding: '6px 14px' }}>
                      View profile
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
