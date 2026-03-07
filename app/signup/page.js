import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { signupAction } from '../auth/actions';

export default async function SignupPage({ searchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/home');

  const params = await searchParams;
  const error = params?.error ? decodeURIComponent(params.error) : '';

  return (
    <section className="card" style={{ maxWidth: 520 }}>
      <h2>Create account</h2>
      <form className="form-col" action={signupAction}>
        <input className="input" name="name" placeholder="Name" required />
        <input className="input" name="email" placeholder="Email" required />
        <input className="input" type="password" name="password" placeholder="Password" minLength={8} required />
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}
        <button className="button primary" type="submit">Create account</button>
        <p className="muted">Already have one? <Link href="/login">Log in</Link></p>
      </form>
    </section>
  );
}
