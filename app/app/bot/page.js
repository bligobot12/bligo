'use client';

import { useApp } from '../../providers';

export default function BotPage() {
  const { currentUser, state, toggleBot } = useApp();
  if (!currentUser) return null;

  const status = state.botConnections[currentUser.id]?.connected || false;

  return (
    <section className="card">
      <h2>Connect Bot</h2>
      <p className="muted">Toggle your bot integration status for your account.</p>
      <div className="actions">
        <span className="pill">Status: {status ? 'Connected' : 'Disconnected'}</span>
        <button className="button primary" onClick={toggleBot}>{status ? 'Disconnect bot' : 'Connect bot'}</button>
      </div>
      <p className="muted" style={{ marginTop: 14 }}>Next: wire this to your live bot credentials and webhook events.</p>
    </section>
  );
}
