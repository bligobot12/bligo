import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect('/login');

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: profile } = await supabase
    .from('profiles')
    .select('last_seen_notifications')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: matchRows } = await supabase
    .from('match_candidates')
    .select('id, created_at')
    .eq('user_a_id', user.id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: acceptedRows } = await supabase
    .from('connections')
    .select('from_user_id, to_user_id, updated_at')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .eq('status', 'accepted')
    .gte('updated_at', since)
    .order('updated_at', { ascending: false })
    .limit(20);

  const { data: pendingRows } = await supabase
    .from('connections')
    .select('from_user_id, created_at')
    .eq('to_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20);

  const { count: unreadMessageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('to_user_id', user.id)
    .eq('read', false);

  const otherIds = [...new Set([
    ...(acceptedRows || []).map((c) => (c.from_user_id === user.id ? c.to_user_id : c.from_user_id)),
    ...(pendingRows || []).map((c) => c.from_user_id),
  ])];
  const { data: names } = otherIds.length
    ? await supabase.from('profiles').select('user_id, display_name, first_name, last_name').in('user_id', otherIds)
    : { data: [] };
  const byId = new Map((names || []).map((n) => [n.user_id, n.display_name || n.username || 'Someone']));

  const notifications = [
    ...(matchRows || []).map((m) => ({
      type: 'match',
      text: 'Someone new matched your profile',
      href: '/home',
      ts: m.created_at,
    })),
    ...(acceptedRows || []).map((c) => {
      const otherId = c.from_user_id === user.id ? c.to_user_id : c.from_user_id;
      return {
        type: 'accepted',
        text: `${byId.get(otherId) || 'Someone'} accepted your connection request`,
        href: '/connections',
        ts: c.updated_at,
      };
    }),
    ...(pendingRows || []).map((c) => ({
      type: 'request',
      text: `${byId.get(c.from_user_id) || 'Someone'} sent you a friend request`,
      href: '/connections',
      ts: c.created_at,
    })),
    ...(Number(unreadMessageCount) > 0 ? [{
      type: 'messages',
      text: `You have ${unreadMessageCount} unread message${Number(unreadMessageCount) === 1 ? '' : 's'}`,
      href: '/messages',
      ts: new Date().toISOString(),
    }] : []),
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  await supabase
    .from('profiles')
    .update({ last_seen_notifications: new Date().toISOString() })
    .eq('user_id', user.id);

  const unseenCount = notifications.filter((n) => !profile?.last_seen_notifications || new Date(n.ts) > new Date(profile.last_seen_notifications)).length;

  return (
    <div className="form-col" style={{ maxWidth: 900 }}>
      <section className="card">
        <h2>Notifications</h2>
        <p className="muted">{unseenCount > 0 ? `${unseenCount} new` : 'All caught up'}</p>
      </section>
      <section className="card">
        <div className="feed">
          {notifications.map((n, i) => (
            <div key={i} className="post-item">
              <p>{n.text}</p>
              <p className="muted">{new Date(n.ts).toLocaleString()}</p>
              <Link className="button" href={n.href}>Open</Link>
            </div>
          ))}
          {notifications.length === 0 ? <p className="muted">No notifications yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
