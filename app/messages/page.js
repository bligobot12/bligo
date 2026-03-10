import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import Avatar from '../../components/Avatar';
import { getConversationStatus } from '../../lib/messaging';

export default async function MessagesPage({ searchParams }) {
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

  const params = await searchParams;
  const activeTab = params?.tab === 'requests' ? 'requests' : 'inbox';

  const { data: allMessages } = await supabase
    .from('messages')
    .select('id, from_user_id, to_user_id, content, read, created_at')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  const convMap = new Map();
  for (const msg of allMessages || []) {
    const otherId = msg.from_user_id === user.id ? msg.to_user_id : msg.from_user_id;
    if (!convMap.has(otherId)) convMap.set(otherId, { latest: msg, unread: 0 });
    if (!msg.read && msg.to_user_id === user.id) convMap.get(otherId).unread += 1;
  }

  const partnerIds = Array.from(convMap.keys());
  const { data: partners } = partnerIds.length
    ? await supabase
        .from('profiles')
        .select('user_id, display_name, username, headline, avatar_url')
        .in('user_id', partnerIds)
    : { data: [] };

  const classified = await Promise.all(
    (partners || []).map(async (p) => {
      const status = await getConversationStatus(supabase, user.id, p.user_id);
      return { ...p, convStatus: status, conv: convMap.get(p.user_id) };
    })
  );

  const inbox = classified
    .filter((p) => p.convStatus === 'inbox')
    .sort((a, b) => new Date(b.conv.latest.created_at) - new Date(a.conv.latest.created_at));

  const requests = classified
    .filter((p) => p.convStatus === 'requests')
    .sort((a, b) => new Date(b.conv.latest.created_at) - new Date(a.conv.latest.created_at));

  const requestCount = requests.filter((p) => p.conv.unread > 0).length;
  const inboxUnread = inbox.filter((p) => p.conv.unread > 0).length;

  function ConvCard({ partner }) {
    const conv = partner.conv;
    return (
      <a href={`/messages/${partner.user_id}`} style={{ textDecoration: 'none' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 8 }}>
          <Avatar src={partner.avatar_url} name={partner.display_name || partner.username} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>{partner.display_name || partner.username}</strong>
              {conv.unread > 0 && (
                <span style={{ background: '#6c63ff', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                  {conv.unread}
                </span>
              )}
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conv.latest.content.length > 60 ? `${conv.latest.content.slice(0, 60)}…` : conv.latest.content}
            </p>
          </div>
          <span className="muted" style={{ fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {new Date(conv.latest.created_at).toLocaleDateString()}
          </span>
        </div>
      </a>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 16 }}>Messages</h2>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #2a2a2a', paddingBottom: 0 }}>
        <a
          href="/messages"
          style={{
            padding: '8px 20px', textDecoration: 'none', fontWeight: 600, fontSize: 14,
            borderBottom: activeTab === 'inbox' ? '2px solid #6c63ff' : '2px solid transparent',
            color: activeTab === 'inbox' ? '#fff' : '#888',
          }}
        >
          Inbox {inboxUnread > 0 && (
            <span style={{ background: '#6c63ff', borderRadius: 10, padding: '1px 6px', fontSize: 11, marginLeft: 4 }}>
              {inboxUnread}
            </span>
          )}
        </a>
        <a
          href="/messages?tab=requests"
          style={{
            padding: '8px 20px', textDecoration: 'none', fontWeight: 600, fontSize: 14,
            borderBottom: activeTab === 'requests' ? '2px solid #6c63ff' : '2px solid transparent',
            color: activeTab === 'requests' ? '#fff' : '#888',
          }}
        >
          Requests {requestCount > 0 && (
            <span style={{ background: '#ff6b6b', borderRadius: 10, padding: '1px 6px', fontSize: 11, marginLeft: 4 }}>
              {requestCount}
            </span>
          )}
        </a>
      </div>

      {activeTab === 'inbox' ? (
        inbox.length === 0 ? (
          <div className="card">
            <p className="muted" style={{ textAlign: 'center', padding: '30px 0' }}>
              No messages yet. Find someone on <a href="/search">Search</a> and say hi.
            </p>
          </div>
        ) : inbox.map((p) => <ConvCard key={p.user_id} partner={p} />)
      ) : (
        requests.length === 0 ? (
          <div className="card">
            <p className="muted" style={{ textAlign: 'center', padding: '30px 0' }}>No message requests.</p>
          </div>
        ) : requests.map((p) => <ConvCard key={p.user_id} partner={p} />)
      )}
    </div>
  );
}
