import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return <div style={{padding:40}}><a href="/login">Log in</a> to view your profile.</div>;
  redirect(`/profile/${user.id}`);
}
