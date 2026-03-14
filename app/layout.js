import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { Providers } from './providers';
import { createClient } from '../lib/supabase/server';
import Avatar from '../components/Avatar';

export const metadata = {
  title: 'Bligo',
  description: 'Discover real connections, curated by AI.',
};

export default async function RootLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  const user = session?.user || null;

  let unreadInbox = 0;
  let unreadRequests = 0;
  let navProfile = null;

  if (user && supabase) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, first_name, last_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    navProfile = profile;

    const { data: unreadRows } = await supabase
      .from('messages')
      .select('from_user_id, to_user_id, read')
      .eq('to_user_id', user.id)
      .eq('read', false)
      .limit(500);

    const uniqueSenders = [...new Set((unreadRows || []).map((r) => r.from_user_id))];

    if (uniqueSenders.length > 0) {
      const checks = await Promise.all(uniqueSenders.map(async (otherId) => {
        const { data: conn } = await supabase
          .from('connections')
          .select('id')
          .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherId}),and(from_user_id.eq.${otherId},to_user_id.eq.${user.id})`)
          .eq('status', 'accepted')
          .maybeSingle();

        if (conn) return { kind: 'inbox', otherId };

        const { data: reply } = await supabase
          .from('messages')
          .select('id')
          .eq('from_user_id', user.id)
          .eq('to_user_id', otherId)
          .limit(1)
          .maybeSingle();

        return { kind: reply ? 'inbox' : 'requests', otherId };
      }));

      unreadInbox = checks.filter((c) => c.kind === 'inbox').length;
      unreadRequests = checks.filter((c) => c.kind === 'requests').length;
    }
  }

  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="site-header">
            <div className="container nav">
              <Link className="brand" href={user ? "/home" : "/"} aria-label="Bligo home">
                <Image src="/bot.png" alt="Bligo" width={180} height={80} style={{ borderRadius: 10 }} />
              </Link>
              <nav className="nav-links">
                {user ? (
                  <>
                    <Link href="/home">Home</Link>
                    <Link href="/groups">Groups</Link>
                    <Link href="/search">Search</Link>
                    <Link href="/posts">Post</Link>
                    <Link href="/messages">Messages{unreadRequests > 0 ? <span className="notif-dot notif-dot-red" /> : unreadInbox > 0 ? <span className="notif-dot notif-dot-purple" /> : null}</Link>
                    <Link href={`/profile/${session.user.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar src={navProfile?.avatar_url} name={navProfile?.display_name || `${navProfile?.first_name || ''} ${navProfile?.last_name || ''}`.trim() || 'You'} size={22} />
                      <span>Profile</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/">Home</Link>
                    <Link className="desktop-only" href="/about">About</Link>
                    <Link className="desktop-only" href="/contact">Contact</Link>
                    <Link href="/login">Login</Link>
                  </>
                )}
              </nav>
            </div>
          </header>

          <main className="main">
            <div className="container">{children}</div>
          </main>

          <footer className="site-footer">
            <div className="container">© {new Date().getFullYear()} bligo. Built on Next.js + Cloudflare Pages.</div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
