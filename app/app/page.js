'use client';

import Link from 'next/link';
import { useApp } from '../providers';

export default function DashboardPage() {
  const { currentUser, state } = useApp();

  if (!currentUser) {
    return <section className="card"><p>Please <Link href="/login">log in</Link>.</p></section>;
  }

  const myPosts = state.posts.filter((p) => p.userId === currentUser.id).length;
  const botConnected = !!state.botConnections[currentUser.id]?.connected;

  return (
    <>
      <section className="hero">
        <h1>Welcome back, {currentUser.name}</h1>
        <p>Your core feature stack is now live in MVP form.</p>
      </section>

      <section className="grid">
        <article className="card"><h3>Posts</h3><p>{myPosts} created</p></article>
        <article className="card"><h3>Bot status</h3><p>{botConnected ? 'Connected' : 'Not connected'}</p></article>
      </section>
    </>
  );
}
