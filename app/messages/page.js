import Link from 'next/link';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

import { createClient } from '../../lib/supabase/server';
import { createConversationAction, sendMessageAction } from './actions';

export default async function MessagesPage({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const params = await searchParams;
  const selectedConversationId = Number(params?.c || 0);
  const error = params?.error ? decodeURIComponent(params.error) : '';

  const { data: people } = await supabase
    .from('profiles')
    .select('id, username, display_name, full_name, avatar_url')
    .neq('id', user.id)
    .order('created_at', { ascending: false });

  const { data: myMemberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id);

  const conversationIds = (myMemberships || []).map((m) => m.conversation_id);

  let otherMembersByConversation = {};
  if (conversationIds.length) {
    const { data: members } = await supabase
      .from('conversation_members')
      .select('conversation_id, user_id, profiles:user_id(username,display_name,full_name,avatar_url)')
      .in('conversation_id', conversationIds)
      .neq('user_id', user.id);

    for (const m of members || []) {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      otherMembersByConversation[m.conversation_id] = {
        user_id: m.user_id,
        name: p?.display_name || p?.full_name || p?.username || 'Unknown',
        avatar_url: p?.avatar_url || null,
      };
    }
  }

  let messages = [];
  if (selectedConversationId && conversationIds.includes(selectedConversationId)) {
    const { data } = await supabase
      .from('messages')
      .select('id, body, sender_id, created_at, profiles:sender_id(username,display_name,full_name,avatar_url)')
      .eq('conversation_id', selectedConversationId)
      .order('created_at', { ascending: true });

    messages = data || [];
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '320px 1fr', alignItems: 'start' }}>
      <section className="card">
        <h3>New conversation</h3>
        <form action={createConversationAction} className="form-col" style={{ marginTop: 8 }}>
          <select className="input" name="other_user_id" required>
            <option value="">Select a user</option>
            {(people || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || p.full_name || p.username || p.id}
              </option>
            ))}
          </select>
          <button className="button primary" type="submit">Start conversation</button>
        </form>

        <h3 style={{ marginTop: 18 }}>Conversations</h3>
        <div className="feed" style={{ marginTop: 8 }}>
          {conversationIds.map((cid) => {
            const other = otherMembersByConversation[cid];
            return (
              <Link key={cid} className="post-item" href={`/messages?c=${cid}`}>
                <strong>{other?.name || `Conversation ${cid}`}</strong>
                <p className="muted">#{cid}</p>
              </Link>
            );
          })}
          {conversationIds.length === 0 ? <p className="muted">No conversations yet.</p> : null}
        </div>
      </section>

      <section className="card">
        <h3>Thread</h3>
        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}

        {!selectedConversationId ? (
          <p className="muted">Select or create a conversation.</p>
        ) : !conversationIds.includes(selectedConversationId) ? (
          <p className="muted">Conversation not accessible.</p>
        ) : (
          <>
            <div className="message-list" style={{ marginTop: 8, maxHeight: 420 }}>
              {messages.map((m) => {
                const sender = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                const senderName = sender?.display_name || sender?.full_name || sender?.username || 'Unknown';
                const mine = m.sender_id === user.id;
                return (
                  <div key={m.id} className="message-item" style={{ background: mine ? '#1f2e5f' : '#142045' }}>
                    <strong>{mine ? 'You' : senderName}</strong>: {m.body}
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{new Date(m.created_at).toLocaleString()}</div>
                  </div>
                );
              })}
              {messages.length === 0 ? <p className="muted">No messages yet.</p> : null}
            </div>

            <form action={sendMessageAction} className="form-col" style={{ marginTop: 10 }}>
              <input type="hidden" name="conversation_id" value={selectedConversationId} />
              <textarea className="input" rows={3} name="message_body" placeholder="Type a message..." required />
              <div className="actions">
                <button className="button primary" type="submit">Send</button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
