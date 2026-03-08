import Link from 'next/link';
import { forgotPasswordAction } from '../auth/actions';

export const runtime = 'edge';

export default async function ForgotPasswordPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error ? decodeURIComponent(params.error) : '';

  return (
    <section className="card" style={{ maxWidth: 500 }}>
      <h2>Forgot password</h2>
      <p className="muted">Enter your account email and we’ll send a reset link.</p>
      <form className="form-col" action={forgotPasswordAction}>
        <input className="input" type="email" name="email" placeholder="Email" required />
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}
        <button className="button primary" type="submit">Send reset link</button>
      </form>
      <p className="muted" style={{ marginTop: 10 }}>
        Back to <Link href="/login">login</Link>
      </p>
    </section>
  );
}
