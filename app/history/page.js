import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { deletePostAction } from '../posts/actions';

export default async function HistoryPage({ searchParams }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect('/login');

  const params = await searchParams;
  const tab = params?.tab === 'searches' ? 'searches' : 'posts';
  const error = params?.error ? decodeURIComponent(params.error) : '';
  const deleted = params?.deleted === '1';

  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, post_type, visibility, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const { data: searches } = await supabase
    .from('searches')
    .select('id, query, results, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="form-col" style={{ maxWidth: 920 }}>
      <section className="card">
        <h2>History</h2>
        <div className="actions" style={{ marginTop: 8 }}>
          <Link className="button" href="/history?tab=posts">Posts</Link>
          <Link className="button" href="/history?tab=searches">Searches</Link>
        </div>
        {deleted ? <p style={{ color: '#8fd19e' }}>Post deleted.</p> : null}
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}
      </section>

      {tab === 'posts' ? (
        <section className="card">
          <h3>Your posts</h3>
          <div className="feed" style={{ marginTop: 10 }}>
            {(posts || []).map((post) => (
              <div className="post-item" key={post.id}>
                <p>{post.content}</p>
                <p className="muted">{post.post_type} · {post.visibility} · {new Date(post.created_at).toLocaleString()}</p>
                <form action={deletePostAction} style={{ marginTop: 8 }}>
                  <input type="hidden" name="post_id" value={post.id} />
                  <button className="button" type="submit">Delete</button>
                </form>
              </div>
            ))}
            {(posts || []).length === 0 ? <p className="muted">No posts yet.</p> : null}
          </div>
        </section>
      ) : (
        <section className="card">
          <h3>Your searches</h3>
          <div className="feed" style={{ marginTop: 10 }}>
            {(searches || []).map((s) => {
              const count = (s.results?.first?.length || 0) + (s.results?.second?.length || 0) + (s.results?.third?.length || 0);
              return (
                <div className="post-item" key={s.id}>
                  <p><strong>{s.query}</strong></p>
                  <p className="muted">{new Date(s.created_at).toLocaleString()} · {count} results</p>
                  <Link className="button" href={`/search?q=${encodeURIComponent(s.query)}`}>Search again</Link>
                </div>
              );
            })}
            {(searches || []).length === 0 ? <p className="muted">No searches yet.</p> : null}
          </div>
        </section>
      )}
    </div>
  );
}
