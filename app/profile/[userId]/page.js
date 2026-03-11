import { createClient } from '../../../lib/supabase/server';
import { sendConnectionRequestAction } from '../../connections/actions';
import Avatar from '../../../components/Avatar';
import Link from 'next/link';
import EditProfile from './EditProfile';
import { addSpecialtyAction, removeSpecialtyAction, updateProfileAction } from '../actions';

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

  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, created_at')
    .eq('user_id', userId)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(10);

  const { count: friendsCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .eq('status', 'accepted');

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
            <p className="muted" style={{ margin: '4px 0' }}>{[profile.job_title, profile.industry].filter(Boolean).join(' · ') || profile.headline}</p>
            <p className="muted" style={{ margin: '4px 0' }}>{location}</p>
            {profile.bio && <p style={{ marginTop: 8 }}>{profile.bio}</p>}
          </div>
          {isOwn && <span className="button" style={{ opacity: 0.85 }}>Own profile</span>}
        </div>
      </section>

      {isOwn ? <EditProfile profile={profile} updateAction={updateProfileAction} /> : null}

      <section className="card">
        <h3>Job</h3>
        <p style={{ margin: 0 }}>{profile.job_title || 'No job title yet'}</p>
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
        <p className="muted" style={{ marginTop: 0 }}>Updated automatically by your connected bots based on your activity.</p>
        {signals.length === 0 ? <p className="muted">No AI-designated skills yet.</p> : null}
        {signals.map((s) => (
          <div key={`${s.tag}-${s.cluster || ''}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="signal-chip">{s.tag}</span>
            <span className="muted" style={{ fontSize: 12 }}>{Math.round((Number(s.confidence) || 0) * 10)}/10</span>
          </div>
        ))}
      </section>

      <section className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/connections">{friendsCount || 0} friends</Link>
        {!isOwn && (
          <a href={`/messages/${userId}`} className="button">Message</a>
        )}
      </section>

      <section className="card">
        <h3>Public posts</h3>
        {(posts || []).length === 0 ? <p className="muted">No public posts yet.</p> : null}
        {(posts || []).map((post) => (
          <div key={post.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #2a2a2a' }}>
            <p style={{ margin: 0 }}>{post.content}</p>
            <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
