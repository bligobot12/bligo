import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect('/login');
  redirect(`/profile/${user.id}`);
}
