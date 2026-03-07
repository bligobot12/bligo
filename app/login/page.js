import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { loginAction } from '../auth/actions';

export default async function LoginPage({ searchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/home');

  const params = await searchParams;
  const error = params?.error ? decodeURIComponent(params.error) : '';
  const message = params?.message ? decodeURIComponent(params.message) : '';

  return (
    <section className="card" style={{ maxWidth: 480 }}>
      <h2>Log in</h2>
      <div className="form-col">
        <input className="input" name="email" placeholder="Email" form="login-form" />
        <input className="input" type="password" name="password" placeholder="Password" form="login-form" />
        {message ? <p style={{ color: '#8fd19e' }}>{message}</p> : null}
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}
        <form id="login-form" action={loginAction}>
          <button className="button primary" type="submit">Log in</button>
        </form>
        <p className="muted">No account yet? <Link href="/signup">Sign up</Link></p>
      </div>
    </section>
  );
}
