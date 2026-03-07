'use client';

import { useState } from 'react';
import { useApp } from '../../providers';

export default function PostsPage() {
  const { currentUser, state, addPost } = useApp();
  const [text, setText] = useState('');

  if (!currentUser) return null;

  return (
    <>
      <section className="card">
        <h2>Create post</h2>
        <div className="form-col">
          <textarea className="input" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="What are you building today?" />
          <button className="button primary" onClick={() => { addPost(text); setText(''); }}>Publish</button>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h3>Feed</h3>
        <div className="feed">
          {state.posts.map((p) => {
            const user = state.users.find((u) => u.id === p.userId);
            return (
              <article key={p.id} className="post-item">
                <strong>{user?.name || 'Unknown'}</strong>
                <p>{p.text}</p>
                <small className="muted">{new Date(p.createdAt).toLocaleString()}</small>
              </article>
            );
          })}
          {state.posts.length === 0 ? <p className="muted">No posts yet.</p> : null}
        </div>
      </section>
    </>
  );
}
