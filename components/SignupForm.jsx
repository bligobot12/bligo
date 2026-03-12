'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupForm({ error: initialError }) {
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.target);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: fd.get('email'),
        password: fd.get('password'),
        first_name: fd.get('first_name'),
        last_name: fd.get('last_name'),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Signup failed');
      setLoading(false);
    } else {
      window.location.href = '/onboarding';
    }
  }

  return (
    <section className="card" style={{ maxWidth: 520 }}>
      <h2>Create account</h2>
      <form className="form-col" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input className="input" name="first_name" placeholder="First name" required />
          <input className="input" name="last_name" placeholder="Last name" required />
        </div>
        <input className="input" name="email" placeholder="Email" required />
        <input className="input" type="password" name="password" placeholder="Password" minLength={8} required />
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}
        <button className="button primary" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        <p className="muted">
          Already have one? <Link href="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
}
