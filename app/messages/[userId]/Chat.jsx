'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Avatar from '../../../components/Avatar';

export default function Chat({ currentUserId, friend, initialMessages, supabaseUrl, supabaseAnonKey, requireClientAuth = false }) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(currentUserId);
  const bottomRef = useRef(null);
  const sbRef = useRef(null);

  useEffect(() => {
    if (!currentUser || requireClientAuth) {
      const sb = createClient(supabaseUrl, supabaseAnonKey);
      sb.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setCurrentUser(session.user.id);
        } else {
          window.location.href = '/login';
        }
      });
    }
  }, [currentUser, requireClientAuth, supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    if (!currentUser) return;

    sbRef.current = createClient(supabaseUrl, supabaseAnonKey);

    const channel = sbRef.current
      .channel(`chat:${[currentUser, friend.user_id].sort().join(':')}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `to_user_id=eq.${currentUser}`,
      }, (payload) => {
        if (payload.new.from_user_id === friend.user_id) {
          setMessages((prev) => [...prev, payload.new]);
          sbRef.current.from('messages')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('id', payload.new.id);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `from_user_id=eq.${currentUser}`,
      }, (payload) => {
        if (payload.new.to_user_id === friend.user_id) {
          setMessages((prev) => prev.map((m) => (
            m.id === payload.new.id ? { ...m, read: payload.new.read, read_at: payload.new.read_at } : m
          )));
        }
      })
      .subscribe();

    return () => {
      if (sbRef.current) sbRef.current.removeChannel(channel);
    };
  }, [currentUser, friend.user_id, supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || sending || !currentUser) return;

    setSending(true);
    const content = input.trim();

    const optimistic = {
      id: `temp-${Date.now()}`,
      from_user_id: currentUser,
      to_user_id: friend.user_id,
      content,
      created_at: new Date().toISOString(),
      read: false,
      read_at: null,
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput('');

    const { data, error } = await sbRef.current
      .from('messages')
      .insert({
        from_user_id: currentUser,
        to_user_id: friend.user_id,
        content,
      })
      .select()
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      alert(`Failed to send: ${error.message}`);
    } else {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data : m)));
    }

    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const lastSentIndex = messages
    .map((m, i) => (m.from_user_id === currentUser ? i : -1))
    .filter((i) => i >= 0)
    .pop();

  if (!currentUser) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 40 }}>
        <p className="muted">Checking your session…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexShrink: 0 }}>
        <a href="/messages" style={{ color: '#888', textDecoration: 'none', fontSize: 20 }}>←</a>
        <Avatar src={friend?.avatar_url} name={friend?.display_name || `${friend?.first_name || ""} ${friend?.last_name || ""}`.trim()} size={40} />
        <div>
          <strong>{friend?.display_name || `${friend?.first_name || ""} ${friend?.last_name || ""}`.trim() || 'Conversation'}</strong>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>{friend?.headline}</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
        {messages.length === 0 && (
          <p className="muted" style={{ textAlign: 'center', marginTop: 60 }}>
            No messages yet — say hi to {friend?.display_name || `${friend?.first_name || ""} ${friend?.last_name || ""}`.trim() || 'them'}!
          </p>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.from_user_id === currentUser;
          const isLastSent = isMe && idx === lastSentIndex;
          return (
            <div key={msg.id}>
              <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', padding: '0 4px' }}>
                {!isMe && (
                  <Avatar src={friend?.avatar_url} name={friend?.display_name} size={28} style={{ marginRight: 8, marginTop: 4, flexShrink: 0 }} />
                )}
                <div style={{
                  maxWidth: '70%',
                  background: isMe ? '#1877F2' : '#F0F2F5',
                  color: '#fff',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '10px 14px',
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.content}
                  <div style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.5)' : '#555', marginTop: 4, textAlign: 'right' }}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>

              {isLastSent && (
                <div style={{ textAlign: 'right', fontSize: 10, color: '#6c63ff', marginTop: 2, paddingRight: 8 }}>
                  {msg.read && msg.read_at
                    ? `Seen at ${formatTime(msg.read_at)}`
                    : String(msg.id).startsWith('temp-') ? 'Sending…' : 'Delivered'}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, marginTop: 8, flexShrink: 0 }}>
        <textarea
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${friend?.display_name || `${friend?.first_name || ""} ${friend?.last_name || ""}`.trim() || 'them'}…`}
          rows={1}
          style={{
            flex: 1,
            borderRadius: 20,
            resize: 'none',
            padding: '10px 16px',
            lineHeight: 1.4,
            maxHeight: 120,
            overflowY: 'auto',
          }}
          disabled={sending}
          autoFocus
        />
        <button
          className="button primary"
          type="submit"
          disabled={sending || !input.trim()}
          style={{ borderRadius: 20, padding: '0 20px', flexShrink: 0, alignSelf: 'flex-end', height: 42 }}
        >
          {sending ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
