import { updatePostAction, deletePostAction, searchFromPostAction } from '../app/posts/actions';

export default function PostCard({ post, author, isOwner = false, showSearch = true, showMeta = true, redirectTo = '/posts' }) {
  return (
    <article className="post-item">
      {author ? <strong>{author}</strong> : null}
      <p style={{ marginTop: 6 }}>{post.content}</p>
      {showMeta ? <p className="muted" style={{ marginTop: 6 }}>{post.post_type} · {post.visibility} · {new Date(post.created_at).toLocaleString()}</p> : null}
      <div className="actions" style={{ marginTop: 8 }}>
        {showSearch ? (
          <form action={searchFromPostAction}>
            <input type="hidden" name="query" value={post.content} />
            <button className="button" type="submit">Search now →</button>
          </form>
        ) : null}
        {isOwner ? (
          <>
            <form action={updatePostAction} className="form-col" style={{ minWidth: 260 }}>
              <input type="hidden" name="post_id" value={post.id} />
              <input className="input" name="content" defaultValue={post.content} />
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <button className="button" type="submit">Save edit</button>
            </form>
            <form action={deletePostAction}>
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <button className="button" type="submit">Delete</button>
            </form>
          </>
        ) : null}
      </div>
    </article>
  );
}
