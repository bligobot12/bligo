import { createClient } from '../../../lib/supabase/server';
import { sendConnectionRequestAction } from '../../connections/actions';
import Avatar from '../../../components/Avatar';
import Link from 'next/link';

export default async function PublicProfilePage({ params }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const viewer = session?.user || null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, display_name, first_name, last_name, headline, avatar_url, industry, job_title, location_city, location_state, city, bio, specialty, skills, interests, goals')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return <div style={{padding:40}}><p className="muted">Profile not found.</p></div>;

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

  const chips = (items) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {(items || []).map(i => <span key={i} className="signal-chip">{i}</span>)}
      {!(items || []).length && <p className="muted">None yet.</p>}
    </div>
  );

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
          {isOwn && <Link className="button" href="/settings">Edit profile</Link>}
        </div>
      </section>

      {(profile.specialty || []).length > 0 && (
        <section className="card">
          <h3>Specialty</h3>
          {chips(profile.specialty)}
        </section>
      )}

      <section className="card">
        <h3>Skills</h3>
        {chips(profile.skills)}
        {isOwn && (
          <form method="POST" action={`/api/v1/profile`} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <input className="input" name="skill" placeholder="Add a skill..." style={{ flex: 1 }} />
            <button className="button" type="submit">Add</button>
          </form>
        )}
      </section>

      {((profile.interests || []).length > 0 || (profile.goals || []).length > 0) && (
        <section className="card">
          <h3>Interests & goals</h3>
          {chips(profile.interests)}
          {chips(profile.goals)}
        </section>
      )}

      <section className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/connections">{friendsCount || 0} friends</Link>
        {!isOwn && (
          <a href={`/messages/${userId}`} className="button">Message</a>
        )}
      </section>

      {(posts || []).length > 0 && (
        <section className="card">
          <h3>Posts</h3>
          {posts.map(post => (
            <div key={post.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #2a2a2a' }}>
              <p style={{ margin: 0 }}>{post.content}</p>
              <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>{new Date(post.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
