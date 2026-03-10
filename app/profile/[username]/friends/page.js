import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { getDegreLabel } from '../../../../lib/ui/getDegreeLabel';

export default async function PublicFriendsPage({ params }) {
  const { username } = await params;
  const admin = createAdminClient();
  if (!admin) notFound();

  const { data: profile } = await admin
    .from('profiles')
    .select('user_id, username, display_name, headline, city')
    .eq('username', username)
    .maybeSingle();

  if (!profile?.user_id) notFound();

  const { data: rows } = await admin
    .from('connections')
    .select('from_user_id, to_user_id')
    .or(`from_user_id.eq.${profile.user_id},to_user_id.eq.${profile.user_id}`)
    .eq('status', 'accepted')
    .limit(200);

  const friendIds = [...new Set((rows || []).map((c) => (c.from_user_id === profile.user_id ? c.to_user_id : c.from_user_id)))];

  const { data: friends } = friendIds.length
    ? await admin
        .from('profiles')
        .select('user_id, username, display_name, headline, city')
        .in('user_id', friendIds)
    : { data: [] };

  return (
    <div className="form-col" style={{ maxWidth: 860 }}>
      <section className="card">
        <h2>{profile.display_name || profile.username}'s friends</h2>
        <p className="muted">Public friend list by username.</p>
        <p className="muted" style={{ fontSize: 12 }}>
          Profile: <code>bligo.ai/profile/{profile.username}</code>
        </p>

        <div className="feed" style={{ marginTop: 12 }}>
          {(friends || []).map((f) => (
            <div key={f.user_id} className="post-item">
              <strong>{f.display_name || f.username} <span className="degree-badge">{getDegreLabel(1)}</span></strong>
              <p className="muted">{f.headline || 'No headline yet'}</p>
              <p className="muted">{f.city || 'City not set'}</p>
              <Link className="button" href={`/profile/${f.username}/friends`}>View friends</Link>
            </div>
          ))}
          {(friends || []).length === 0 ? <p className="muted">No friends yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
