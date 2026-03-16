'use client';

import { useState } from 'react';

export default function InvitePage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState([]);

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteLink = `${siteUrl}/signup`;

  async function handleSend(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setStatus(null);

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: 'error', text: data.error || 'Failed to send invite' });
      } else {
        setStatus({ type: 'success', text: `Invite sent to ${email.trim()}` });
        setSent((prev) => [...prev, email.trim()]);
        setEmail('');
        setMessage('');
      }
    } catch {
      setStatus({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSending(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setStatus({ type: 'success', text: 'Invite link copied to clipboard!' });
    } catch {
      setStatus({ type: 'error', text: 'Could not copy link. Select and copy manually.' });
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2>Invite a Friend</h2>
      <p className="muted">Grow your network by inviting people you trust. Better connections = better matches.</p>

      <section className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Share your invite link</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="input"
            readOnly
            value={inviteLink}
            style={{ flex: 1, background: '#F0F2F5' }}
            onClick={(e) => e.target.select()}
          />
          <button className="button primary" onClick={handleCopyLink}>Copy</button>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Send an email invite</h3>
        <form onSubmit={handleSend} className="form-col">
          <input
            className="input"
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <textarea
            className="input"
            placeholder="Add a personal note (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            style={{ resize: 'vertical' }}
          />
          <button className="button primary" type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </section>

      {status && (
        <div
          className="card"
          style={{
            marginTop: 12,
            background: status.type === 'success' ? '#E7F3FF' : '#FFF0F0',
            border: `1px solid ${status.type === 'success' ? '#BDD7FF' : '#FFB3B3'}`,
          }}
        >
          <p style={{ margin: 0 }}>{status.text}</p>
        </div>
      )}

      {sent.length > 0 && (
        <section className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Invites sent this session</h3>
          {sent.map((e, i) => (
            <p key={i} className="muted" style={{ margin: '4px 0' }}>{e}</p>
          ))}
        </section>
      )}
    </div>
  );
}
