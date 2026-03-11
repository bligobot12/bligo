import { createClient } from '../../../lib/supabase/server';
import { sendConnectionRequestAction } from '../../connections/actions';
import Avatar from '../../../components/Avatar';
import Link from 'next/link';
import EditProfile from './EditProfile';
import { addSpecialtyAction, removeSpecialtyAction } from '../actions';

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

export default async function PublicProfilePage({ params }) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const viewer = session?.user || null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, display_name, first_name, last_name, headline, avatar_url, industry, job_title, location_city, location_state, city, bio, specialty, skills, interests, goals, signals')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return <div style={{ padding: 40 }}><p className="muted">Profile not found.</p></div>;

  const name = profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown';
  const isOwn = viewer?.id === userId;

  let isFriend = false;
  if (viewer?.id && !isOwn) {
    const { data: conn } = await supabase
      .from('connections')
      .select('id')
      .or(`and(from_user_id.eq.${viewer.id},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${viewer.id})`)
      .eq('status', 'accepted')
      .maybeSingle();
    isFriend = Boolean(conn?.id);
  }

  if (!viewer || (!isOwn && !isFriend)) {
    return (
      <div className="card" style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center', padding: 40 }}>
        <Avatar src={profile.avatar_url} name={name} size={64} />
        <h3>{name}</h3>
        <p className="muted">Connect to view full profile</p>
        {viewer && (
          <form action={sendConnectionRequestAction}>
            <input type="hidden" name="to_user_id" value={userId} />
            <button className="button primary">Connect</button>
          </form>
        )}
      </div>
    );
  }

  let postsQuery = supabase
    .from('posts')
    .select('id, content, created_at, visibility')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (!isOwn) postsQuery = postsQuery.eq('visibility', 'public');
  const { data: posts } = await postsQuery;

  const { data: friendConns } = await supabase
    .from('connections')
    .select('from_user_id, to_user_id')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .eq('status', 'accepted');

  const friendIds = (friendConns || []).map((c) =>
    c.from_user_id === userId ? c.to_user_id : c.from_user_id
  );

  const { count: friendsCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .eq('status', 'accepted');

  const { data: friendProfiles } = friendIds.length
    ? await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name, avatar_url')
        .in('user_id', friendIds.slice(0, 8))
    : { data: [] };

  const location = [profile.location_city || profile.city, profile.location_state].filter(Boolean).join(', ');
  const specialties = asArray(profile.specialty);
  const signals = asArray(profile.signals);

  return (
    <div className="form-col" style={{ maxWidth: 860 }}>
      <section className="card">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <Avatar src={profile.avatar_url} name={name} size={80} />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{name}</h2>
            <p className="muted" style={{ margin: '4px 0' }}>{profile.headline || 'Add a headline...'}</p>
            <p className="muted" style={{ margin: '4px 0' }}>{location}</p>
            {profile.bio && <p style={{ marginTop: 8 }}>{profile.bio}</p>}
          </div>
          {isOwn && <EditProfile profile={profile} />}
        </div>
      </section>

      <section className="card">
        <h3>Job</h3>
        <p style={{ margin: 0 }}>{profile.job_title || profile.headline || 'No job title yet'}</p>
        <p className="muted" style={{ marginTop: 4 }}>{profile.industry || 'No industry yet'}</p>

        <h4 style={{ margin: '12px 0 8px' }}>Specialties</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {specialties.map((s) => (
            <span key={s} className="signal-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {s}
              {isOwn ? (
                <form action={removeSpecialtyAction}>
                  <input type="hidden" name="specialty" value={s} />
                  <button type="submit" style={{ border: 'none', background: 'none', color: '#888', cursor: 'pointer', padding: 0 }}>×</button>
                </form>
              ) : null}
            </span>
          ))}
          {specialties.length === 0 ? <p className="muted">No specialties yet.</p> : null}
        </div>

        {isOwn ? (
          <form action={addSpecialtyAction} style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <input className="input" name="specialty" placeholder="Add specialty..." style={{ flex: 1 }} />
            <button className="button" type="submit">Add</button>
          </form>
        ) : null}
      </section>

      <section className="card">
        <h3>AI Designated Skills</h3>
        {isOwn ? <a href="/skills" className="button" style={{ fontSize: 12, marginTop: 8 }}>+ Add AI Skills</a> : null}
        <p className="muted" style={{ marginTop: 8 }}>Updated automatically by your connected bots based on your activity.</p>
        {signals.length === 0 ? <p className="muted">No AI-designated skills yet.</p> : null}
        {signals.map((s) => (
          <div key={s.tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a2e' }}>
            <span className="signal-chip">{s.tag}</span>
            <span style={{ fontSize: 12, color: '#7c6af7', fontWeight: 700 }}>
              {Math.round((Number(s.confidence) || 0.5) * 10)}/10
            </span>
          </div>
        ))}
      </section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{friendsCount || 0} {(friendsCount || 0) === 1 ? 'friend' : 'friends'}</h3>
          {(friendsCount || 0) > 8 && <Link href="/connections" className="muted" style={{ fontSize: 12 }}>See all →</Link>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {(friendProfiles || []).map((f) => {
            const fname = f.display_name || [f.first_name, f.last_name].filter(Boolean).join(' ') || 'Unknown';
            return (
              <Link key={f.user_id} href={`/profile/${f.user_id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                <Avatar src={f.avatar_url} name={fname} size={44} />
                <span style={{ fontSize: 11, color: '#ccc' }}>{fname.split(' ')[0]}</span>
              </Link>
            );
          })}
          {(friendProfiles || []).length === 0 ? <p className="muted">No friends yet.</p> : null}
        </div>
      </section>

      <section className="card">
        <h3>Public posts</h3>
        {(posts || []).length === 0 ? <p className="muted">No public posts yet.</p> : null}
        {(posts || []).map((post) => (
          <div key={post.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Avatar src={profile.avatar_url} name={name} size={36} />
              <div>
                <strong style={{ fontSize: 14 }}>{name}</strong>
                <p className="muted" style={{ margin: 0, fontSize: 11 }}>{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <p style={{ margin: 0 }}>{post.content}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
