'use client';
import Link from 'next/link';
import { useState } from 'react';
import Avatar from './Avatar';

export default function PostCard({ post, currentUserId, deleteAction, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(post.content);
  const [menuOpen, setMenuOpen] = useState(false);

  const p = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const isOwner = currentUserId && post.user_id === currentUserId;

  async function handleSave() {
    if (onUpdate) await onUpdate(post.id, content);
    setEditing(false);
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Avatar src={p?.avatar_url} name={p?.display_name || 'Unknown'} size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href={`/profile/${post.user_id}`}><strong>{p?.display_name || 'Unknown'}</strong></Link>
            <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>
              {new Date(post.created_at).toLocaleDateString()}
            </span>
            {isOwner && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>⋯</button>
                {menuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 24, background: '#1e1e2e', border: '1px solid #2a2a2a', borderRadius: 8, zIndex: 10, minWidth: 120 }}>
                    <button onClick={() => { setEditing(true); setMenuOpen(false); }} style={{ display: 'block', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}>✏️ Edit</button>
                    <form action={deleteAction}>
                      <input type="hidden" name="postId" value={post.id} />
                      <input type="hidden" name="redirectTo" value="/home" />
                      <button type="submit" style={{ display: 'block', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}>🗑️ Delete</button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="muted" style={{ margin: '2px 0 8px', fontSize: 12 }}>{p?.job_title}{p?.industry ? ` · ${p.industry}` : ''}</p>
          {editing ? (
            <div>
              <textarea
                className="input"
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={3}
                style={{ width: '100%', borderRadius: 8, marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="button primary" onClick={handleSave} style={{ fontSize: 12 }}>Save</button>
                <button className="button" onClick={() => { setEditing(false); setContent(post.content); }} style={{ fontSize: 12 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0 }}>{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
