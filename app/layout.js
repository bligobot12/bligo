import './globals.css';
import Image from 'next/image';
import Link from 'next/link';
import { Providers } from './providers';

export const metadata = {
  title: 'Bligo',
  description: 'Discover real connections, curated by AI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="site-header">
            <div className="container nav">
              <Link className="brand" href="/" aria-label="Bligo home">
                <Image src="/logo-cropped.png" alt="Bligo" width={36} height={36} className="brand-logo" />
              </Link>
              <nav className="nav-links">
                <Link href="/">Home</Link>
                <Link className="desktop-only" href="/about">About</Link>
                <Link className="desktop-only" href="/contact">Contact</Link>
                <Link href="/login">Login</Link>
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
