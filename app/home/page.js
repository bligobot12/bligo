import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { logoutAction } from '../auth/actions';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, bio, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from('profiles').insert({
      id: user.id,
      username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
      full_name: user.user_metadata?.full_name || null,
    });
  }

  return (
    <section className="card">
      <h2>Home</h2>
      <p className="muted">Authenticated dashboard route is now live at <code>/home</code>.</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Name:</strong> {profile?.full_name || user.user_metadata?.full_name || 'Not set'}</p>
      <form action={logoutAction}>
        <button className="button">Log out</button>
      </form>
    </section>
  );
}
