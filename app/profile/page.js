import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect('/login');
  redirect(`/profile/${session.user.id}`);
}
