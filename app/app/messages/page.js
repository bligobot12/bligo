'use client';

import { useMemo, useState } from 'react';
import { useApp } from '../../providers';

export default function MessagesPage() {
  const { currentUser, state, sendMessage } = useApp();
  const [toId, setToId] = useState('u_demo');
  const [text, setText] = useState('');

  const peers = state.users.filter((u) => u.id !== currentUser?.id);
  const thread = useMemo(() => {
    if (!currentUser) return [];
    return state.messages.filter(
      (m) => (m.fromId === currentUser.id && m.toId === toId) || (m.fromId === toId && m.toId === currentUser.id)
    );
  }, [state.messages, currentUser, toId]);

  if (!currentUser) return null;

  return (
    <section className="card">
      <h2>Messages</h2>
      <div className="form-col">
        <select className="input" value={toId} onChange={(e) => setToId(e.target.value)}>
          {peers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
        </select>

        <div className="message-list">
          {thread.map((m) => (
            <div key={m.id} className="message-item">
              <strong>{m.fromId === currentUser.id ? 'You' : 'Them'}:</strong> {m.text}
            </div>
          ))}
          {thread.length === 0 ? <p className="muted">No messages in this thread yet.</p> : null}
        </div>

        <div className="actions">
          <input className="input" style={{ flex: 1 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
          <button className="button primary" onClick={() => { sendMessage({ toId, text }); setText(''); }}>Send</button>
        </div>
      </div>
    </section>
  );
}
