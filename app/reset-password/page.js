'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const supabase = createClient();
    const { error: updateErr } = await supabase.auth.updateUser({ password });

    if (updateErr) {
      setError(updateErr.message);
      setLoading(false);
      return;
    }

    setMessage('Password updated. You can now log in.');
    setLoading(false);
    setTimeout(() => router.push('/login'), 800);
  }

  return (
    <section className="card" style={{ maxWidth: 520 }}>
      <h2>Reset password</h2>
      <p className="muted">Set your new password below.</p>
      <form className="form-col" onSubmit={onSubmit}>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          placeholder="New password"
          required
        />
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}
        {message ? <p style={{ color: '#8fd19e' }}>{message}</p> : null}
        <button className="button primary" type="submit" disabled={loading}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </section>
  );
}
