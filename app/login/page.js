'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useApp } from '../providers';

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser } = useApp();
  const [email, setEmail] = useState('demo@bligo.ai');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');

  if (currentUser) router.push('/app');

  return (
    <section className="card" style={{ maxWidth: 480 }}>
      <h2>Log in</h2>
      <p className="muted">Use demo@bligo.ai / demo1234 or create a new account.</p>
      <div className="form-col">
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}
        <button
          className="button primary"
          onClick={() => {
            const out = login({ email, password });
            if (!out.ok) return setError(out.error);
            router.push('/app');
          }}
        >
          Log in
        </button>
        <p className="muted">No account yet? <Link href="/signup">Sign up</Link></p>
      </div>
    </section>
  );
}
