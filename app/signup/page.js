import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import SignupForm from '../../components/SignupForm';

export default async function SignupPage({ searchParams }) {
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

  return <SignupForm error={error} />;
}
