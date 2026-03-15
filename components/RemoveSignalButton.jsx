'use client';

import { useState } from 'react';

export default function RemoveSignalButton({ tag }) {
  const [removed, setRemoved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    const res = await fetch('/api/skills/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tag }),
    });

    if (res.ok) setRemoved(true);
    setLoading(false);
  }

  if (removed) return <span style={{ fontSize: 12, color: '#65676B' }}>Removed</span>;

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      style={{
        background: 'none',
        border: 'none',
        color: '#FA3E3E',
        cursor: 'pointer',
        fontSize: 13,
        padding: '4px 8px',
      }}
    >
      {loading ? '...' : '✕ Remove'}
    </button>
  );
}
