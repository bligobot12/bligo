import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { createPostAction } from './actions';
import { searchFromPostAction } from '../search/actions';
import { getDegreLabel } from '../../lib/ui/getDegreeLabel';
import PostCard from '../../components/PostCard';

export default async function PostsPage({ searchParams }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect('/login');

  const { data: connectionRows } = await supabase
    .from('connections')
    .select('from_user_id, to_user_id')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .eq('status', 'accepted');

  const connectedIds = [
    ...new Set((connectionRows || []).map((c) => (c.from_user_id === user.id ? c.to_user_id : c.from_user_id))),
  ];

  const authorIds = [user.id, ...connectedIds];

  const { data: posts } = await supabase
    .from('posts')
    .select('id, user_id, content, post_type, visibility, created_at')
    .in('user_id', authorIds)
    .order('created_at', { ascending: false })
    .limit(60);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, headline')
    .in('user_id', [...new Set((posts || []).map((p) => p.user_id))]);

  const byUser = new Map((profiles || []).map((p) => [p.user_id, p]));

  const params = await searchParams;
  const error = params?.error ? decodeURIComponent(params.error) : '';
  const posted = params?.posted === '1';

  return (
    <div className="form-col" style={{ maxWidth: 900 }}>
      <section className="card">
        <h2>Post</h2>
        <form action={createPostAction} className="form-col" style={{ marginTop: 10 }}>
          <textarea className="input" name="content" rows={4} placeholder="What are you looking for right now?" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select className="input" name="post_type" defaultValue="intent">
              <option value="intent">Intent</option>
              <option value="question">Question</option>
              <option value="update">Update</option>
            </select>
            <select className="input" name="visibility" defaultValue="connections">
              <option value="connections">Connections</option>
              <option value="public">Public</option>
            </select>
          </div>
          <button className="button primary" type="submit">Post</button>
        </form>
        {posted ? <p style={{ color: '#8fd19e' }}>Posted.</p> : null}
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}
      </section>

      <section className="card">
        <h3>Feed</h3>
        <div className="feed" style={{ marginTop: 8 }}>
          {(posts || []).map((post) => {
            const author = byUser.get(post.user_id);
            return <PostCard key={post.id} post={post} author={`${author?.display_name || 'User'} (${getDegreLabel(1)})`} isOwner={post.user_id === user.id} />;
          })}
          {(posts || []).length === 0 ? <p className="muted">No posts yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
