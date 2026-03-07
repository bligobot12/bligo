'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'bligo_state_v1';

const defaultState = {
  users: [
    {
      id: 'u_demo',
      name: 'Demo User',
      email: 'demo@bligo.ai',
      password: 'demo1234',
      bio: 'Building better connections.',
      avatar: '',
    },
  ],
  currentUserId: null,
  posts: [],
  messages: [],
  botConnections: {},
};

const AppContext = createContext(null);

export function Providers({ children }) {
  const [state, setState] = useState(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const api = useMemo(() => {
    const currentUser = state.users.find((u) => u.id === state.currentUserId) || null;

    return {
      ready,
      state,
      currentUser,
      signup: ({ name, email, password }) => {
        if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          return { ok: false, error: 'Email already exists.' };
        }
        const user = { id: `u_${Date.now()}`, name, email, password, bio: '', avatar: '' };
        setState((s) => ({ ...s, users: [user, ...s.users], currentUserId: user.id }));
        return { ok: true };
      },
      login: ({ email, password }) => {
        const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (!user) return { ok: false, error: 'Invalid email or password.' };
        setState((s) => ({ ...s, currentUserId: user.id }));
        return { ok: true };
      },
      logout: () => setState((s) => ({ ...s, currentUserId: null })),
      updateProfile: ({ name, bio, avatar }) => {
        if (!currentUser) return;
        setState((s) => ({
          ...s,
          users: s.users.map((u) => (u.id === currentUser.id ? { ...u, name, bio, avatar } : u)),
        }));
      },
      addPost: (text) => {
        if (!currentUser || !text.trim()) return;
        const post = { id: `p_${Date.now()}`, userId: currentUser.id, text: text.trim(), createdAt: new Date().toISOString() };
        setState((s) => ({ ...s, posts: [post, ...s.posts] }));
      },
      sendMessage: ({ toId, text }) => {
        if (!currentUser || !toId || !text.trim()) return;
        const msg = { id: `m_${Date.now()}`, fromId: currentUser.id, toId, text: text.trim(), createdAt: new Date().toISOString() };
        setState((s) => ({ ...s, messages: [...s.messages, msg] }));
      },
      toggleBot: () => {
        if (!currentUser) return;
        setState((s) => {
          const current = s.botConnections[currentUser.id]?.connected || false;
          return {
            ...s,
            botConnections: {
              ...s.botConnections,
              [currentUser.id]: { connected: !current, updatedAt: new Date().toISOString() },
            },
          };
        });
      },
    };
  }, [state, ready]);

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within Providers');
  return ctx;
}
