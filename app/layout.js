export const runtime = 'edge';

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
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="site-header">
            <div className="container nav">
              <Link className="brand" href="/" aria-label="Bligo home">Bligo.ai</Link>
              <nav className="nav-links">
                <Link href="/">Home</Link>
                <Link className="desktop-only" href="/about">About</Link>
                <Link className="desktop-only" href="/contact">Contact</Link>
                {user ? <Link href="/settings">Settings</Link> : null}
                {user ? <Link href="/logout">Logout</Link> : <Link href="/login">Login</Link>}
                <Link className="nav-cta" href="/home">App</Link>
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
