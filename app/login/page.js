import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import LoginForm from '../../components/LoginForm';

export default async function LoginPage({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) {
    return <section className="card"><p>Auth is not configured in deployment environment.</p></section>;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/home');

  const params = await searchParams;
  const error = params?.error ? decodeURIComponent(params.error) : '';
  const message = params?.message ? decodeURIComponent(params.message) : '';

  return <LoginForm error={error} message={message} />;
}
