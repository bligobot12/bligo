import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import Chat from './Chat';

export default async function ChatPage({ params }) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect('/login');

  const { data: friend } = await supabase
    .from('profiles')
    .select('user_id, display_name, username, headline, avatar_url')
    .eq('user_id', userId)
    .maybeSingle();

  if (!friend) redirect('/messages?error=user-not-found');

  const { data: history } = await supabase
    .from('messages')
    .select('id, from_user_id, to_user_id, content, read, read_at, created_at')
    .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
    .limit(100);

  await supabase
    .from('messages')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('to_user_id', user.id)
    .eq('from_user_id', userId)
    .eq('read', false);

  return (
    <Chat
      currentUserId={user.id}
      friend={friend}
      initialMessages={history || []}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lrpytrtdbnrkcfanicbx.supabase.co'}
      supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6N_Zu4yhsLPmJFlMelV34A_AB965oxj'}
    />
  );
}
