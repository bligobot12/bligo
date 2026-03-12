'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginForm({ error: initialError, message }) {
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.target);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: fd.get('email'),
        password: fd.get('password'),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Login failed');
      setLoading(false);
    } else {
      window.location.href = '/home';
    }
  }

  return (
    <section className="card" style={{ maxWidth: 480 }}>
      <h2>Log in</h2>
      <form className="form-col" onSubmit={handleSubmit}>
        <input className="input" name="email" placeholder="Email" required />
        <input className="input" type="password" name="password" placeholder="Password" required />
        {message ? <p style={{ color: '#8fd19e' }}>{message}</p> : null}
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}
        <button className="button primary" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
        <p className="muted">
          <Link href="/forgot-password">Forgot password?</Link>
        </p>
        <p className="muted">
          No account yet? <Link href="/signup">Sign up</Link>
        </p>
      </form>
    </section>
  );
}
