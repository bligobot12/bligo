import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import UserCard from '../../../components/UserCard';
import { sendConnectionRequestAction } from '../../connections/actions';

export default async function PublicProfilePage({ params }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const viewer = session?.user;
  if (!viewer) return <div style={{padding:40}}><p>Please <a href="/login">log in</a> to view profiles.</p></div>;

  const { data: profile } = await supabase.from('profiles')
    .select('user_id, display_name, first_name, last_name, headline, avatar_url, city, location_city, location_state, industry, job_title')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return <div style={{padding:40}}><p className="muted">Profile not found.</p></div>;

  const { data: conn } = await supabase.from('connections')
    .select('status')
    .or(`and(from_user_id.eq.${viewer.id},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${viewer.id})`)
    .limit(1)
    .maybeSingle();

  const { data: myFriends } = await supabase.from('connections').select('from_user_id,to_user_id').or(`from_user_id.eq.${viewer.id},to_user_id.eq.${viewer.id}`).eq('status', 'accepted');
  const { data: theirFriends } = await supabase.from('connections').select('from_user_id,to_user_id').or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`).eq('status', 'accepted');

  const mySet = new Set((myFriends || []).map((c) => (c.from_user_id === viewer.id ? c.to_user_id : c.from_user_id)));
  const theirSet = new Set((theirFriends || []).map((c) => (c.from_user_id === userId ? c.to_user_id : c.from_user_id)));
  const mutualCount = Array.from(mySet).filter((id) => theirSet.has(id)).length;

  const { data: posts } = await supabase.from('posts')
    .select('id,user_id,content,post_type,visibility,created_at')
    .eq('user_id', userId)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="form-col" style={{ maxWidth: 900 }}>
      <section className="card">
        <h2>Profile</h2>
        <UserCard profile={profile} showMessage={viewer.id !== userId} />
        <p className="muted">Connection status: <strong>{conn?.status || 'none'}</strong> · Mutual friends: <strong>{mutualCount}</strong></p>
        <div className="actions">
          {viewer.id !== userId ? (
            <form action={sendConnectionRequestAction}>
              <input type="hidden" name="to_user_id" value={userId} />
              <button className="button" type="submit">Connect</button>
            </form>
          ) : null}
          <Link className="button" href={`/messages/${userId}`}>Message</Link>
        </div>
      </section>

      <section className="card">
        <h3>Public posts</h3>
        {(posts || []).map((post) => (
          <div key={post.id} className="card" style={{ marginBottom: 12 }}>
            <p style={{ margin: 0 }}>{post.content}</p>
            <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        ))}
        {(posts || []).length === 0 ? <p className="muted">No public posts yet.</p> : null}
      </section>
    </div>
  );
}
