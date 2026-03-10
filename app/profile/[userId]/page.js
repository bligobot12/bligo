import Link from 'next/link';

import Avatar from '../../../components/Avatar';
import { createClient } from '../../../lib/supabase/server';
import { sendConnectionRequestAction } from '../../connections/actions';
import SkillEditor from './SkillEditor';

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function chips(items = []) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map((item) => (
        <span key={item} className="signal-chip">{item}</span>
      ))}
      {items.length === 0 ? <p className="muted">None added yet.</p> : null}
    </div>
  );
}

function LockedCard({ profile, userId, showConnect = false }) {
  const name = profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Unknown';
  return (
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <Avatar src={profile?.avatar_url} name={name} size={64} />
      <h3>{name}</h3>
      <p className="muted">Connect to view full profile</p>
      {showConnect ? (
        <form action={sendConnectionRequestAction}>
          <input type="hidden" name="to_user_id" value={userId} />
          <button className="button primary">Connect</button>
        </form>
      ) : null}
    </div>
  );
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
    .select('user_id, display_name, first_name, last_name, username, headline, avatar_url, industry, job_title, location_city, location_state, city, bio, specialty, skills, interests, goals')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="card" style={{ maxWidth: 900 }}>
        <h2>Profile</h2>
        <p className="muted">Profile not found.</p>
      </div>
    );
  }

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

  if (!viewer) {
    return (
      <div style={{ maxWidth: 900 }}>
        <LockedCard profile={profile} userId={userId} showConnect={false} />
      </div>
    );
  }

  if (!isOwn && !isFriend) {
    return (
      <div style={{ maxWidth: 900 }}>
        <LockedCard profile={profile} userId={userId} showConnect />
      </div>
    );
  }

  const { count: friendsCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .eq('status', 'accepted');

  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, created_at')
    .eq('user_id', userId)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: botConnection } = await supabase
    .from('bot_connections')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();

  const name = profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || 'Unknown';
  const location = [profile.location_city || profile.city, profile.location_state].filter(Boolean).join(', ');
  const specialty = normalizeArray(profile.specialty);
  const skills = normalizeArray(profile.skills);
  const interests = normalizeArray(profile.interests);
  const goals = normalizeArray(profile.goals);

  return (
    <div className="form-col" style={{ maxWidth: 900 }}>
      <section className="card">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Avatar src={profile.avatar_url} name={name} size={80} />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{name}</h2>
            <p className="muted" style={{ margin: '4px 0' }}>{[profile.job_title, profile.industry].filter(Boolean).join(' · ') || profile.headline || 'No job info yet'}</p>
            <p className="muted" style={{ margin: '4px 0' }}>{location || 'Location not set'}</p>
            <p style={{ margin: '8px 0 0' }}>{profile.bio || 'No bio yet.'}</p>
            <p className="muted" style={{ margin: '8px 0 0' }}>
              {botConnection?.status === 'connected' ? '🟢 Bot connected' : '⚪ Bot not connected'}
            </p>
          </div>
          {isOwn ? <Link className="button" href="/settings/profile">Edit profile</Link> : null}
        </div>
      </section>

      <section className="card">
        <h3>Specialty</h3>
        {chips(specialty)}
      </section>

      <section className="card">
        <h3>Skills</h3>
        {isOwn ? (
          <SkillEditor initialSkills={skills} userId={userId} />
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {skills.map((skill) => (
              <span key={skill} className="signal-chip">{skill}</span>
            ))}
            {skills.length === 0 ? <p className="muted">No skills added yet.</p> : null}
          </div>
        )}
      </section>

      <section className="card">
        <h3>Interests & goals</h3>
        <p className="muted" style={{ marginBottom: 6 }}>Interests</p>
        {chips(interests)}
        <p className="muted" style={{ margin: '12px 0 6px' }}>Goals</p>
        {chips(goals)}
      </section>

      <section className="card">
        <Link href="/connections">{friendsCount || 0} friends</Link>
      </section>

      <section className="card">
        <h3>Public posts</h3>
        {(posts || []).map((post) => (
          <div key={post.id} className="card" style={{ marginBottom: 10 }}>
            <p style={{ margin: 0 }}>{post.content}</p>
            <p className="muted" style={{ margin: '8px 0 0', fontSize: 11 }}>
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
        {(posts || []).length === 0 ? <p className="muted">No public posts yet.</p> : null}
      </section>
    </div>
  );
}
