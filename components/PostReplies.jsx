'use client';

import { useEffect, useMemo, useState } from 'react';
import Avatar from './Avatar';

function timeAgo(iso) {
  if (!iso) return 'just now';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function PostReplies({ postId, currentUserId }) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadReplies() {
    setLoading(true);
    try {
      const resp = await fetch(`/api/posts/${postId}/replies`, { cache: 'no-store' });
      const data = await resp.json();
      if (resp.ok) setReplies(Array.isArray(data.replies) ? data.replies : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReplies();
  }, [postId]);

  const replyCountLabel = useMemo(() => {
    if (loading) return '💬 Replies';
    if (replies.length === 0) return 'Be the first to reply';
    return `💬 ${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}`;
  }, [replies.length, loading]);

  async function submitReply(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const resp = await fetch(`/api/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!resp.ok) return;
      setText('');
      await loadReplies();
      setExpanded(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteReply(replyId) {
    const resp = await fetch(`/api/posts/${postId}/replies/${replyId}`, { method: 'DELETE' });
    if (!resp.ok) return;
    await loadReplies();
  }

  return (
    <div style={{ marginTop: 10, borderTop: '1px solid #232335', paddingTop: 8 }}>
      <button
        className="button"
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{ fontSize: 12, padding: '4px 10px' }}
      >
        {replyCountLabel}
      </button>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {replies.map((reply) => {
              const isOwn = currentUserId && reply.user_id === currentUserId;
              return (
                <div key={reply.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Avatar src={reply.avatar_url} name={reply.display_name || 'Unknown'} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <strong style={{ fontSize: 12 }}>{reply.display_name || 'Unknown'}</strong>
                      <span className="muted" style={{ fontSize: 11 }}>{timeAgo(reply.created_at)}</span>
                      {isOwn && (
                        <button
                          type="button"
                          onClick={() => deleteReply(reply.id)}
                          style={{ marginLeft: 'auto', border: 'none', background: 'none', color: '#ff9da3', cursor: 'pointer', fontSize: 11 }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: 13 }}>{reply.content}</p>
                  </div>
                </div>
              );
            })}
            {!loading && replies.length === 0 ? <p className="muted" style={{ margin: 0, fontSize: 12 }}>No replies yet.</p> : null}
          </div>

          <form onSubmit={submitReply} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <textarea
              className="input"
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a reply..."
            />
            <button className="button primary" type="submit" disabled={submitting} style={{ alignSelf: 'flex-start', fontSize: 12 }}>
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
