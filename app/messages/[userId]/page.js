import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import Chat from './Chat';

export default async function ChatPage({ params }) {
  const { userId } = await params;
  const supabase = await createClient();
  let {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed?.session;
  }
  const user = session?.user;
  if (!user) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 40 }}>
      <p>Please <a href="/login">log in</a> to view messages.</p>
    </div>
  );

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
