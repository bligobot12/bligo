'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useApp } from '../providers';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <section className="card" style={{ maxWidth: 520 }}>
      <h2>Create account</h2>
      <div className="form-col">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}
        <button
          className="button primary"
          onClick={() => {
            const out = signup({ name, email, password });
            if (!out.ok) return setError(out.error);
            router.push('/app');
          }}
        >
          Create account
        </button>
        <p className="muted">Already have one? <Link href="/login">Log in</Link></p>
      </div>
    </section>
  );
}
