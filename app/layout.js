import './globals.css';
import Link from 'next/link';
import { Providers } from './providers';
import { createClient } from '../lib/supabase/server';

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

  let hasUnreadNotifications = false;

  if (user && supabase) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_seen_notifications')
      .eq('user_id', user.id)
      .maybeSingle();

    const lastSeen = profile?.last_seen_notifications ? new Date(profile.last_seen_notifications) : null;

    const { data: recentMatch } = await supabase
      .from('match_candidates')
      .select('created_at')
      .eq('user_a_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: recentAccepted } = await supabase
      .from('connections')
      .select('updated_at')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestTs = [recentMatch?.created_at, recentAccepted?.updated_at].filter(Boolean).sort().pop();
    hasUnreadNotifications = latestTs ? (!lastSeen || new Date(latestTs) > lastSeen) : false;
  }

  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="site-header">
            <div className="container nav">
              <Link className="brand" href="/home" aria-label="Bligo home">Bligo.ai</Link>
              <nav className="nav-links">
                {user ? (
                  <>
                    <Link href="/home">Home</Link>
                    <Link href="/search">Search</Link>
                    <Link href="/posts">Posts</Link>
                    <Link href="/connections">Friends</Link>
                    <Link href="/history">History</Link>
                    <Link href="/notifications">Notifications{hasUnreadNotifications ? <span className="notif-dot" /> : null}</Link>
                    <Link href="/settings">Settings</Link>
                    <Link href="/logout">Logout</Link>
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
