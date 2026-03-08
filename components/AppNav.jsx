'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../app/providers';

const links = [
  { href: '/app', label: 'Dashboard' },
  { href: '/app/profile', label: 'Profile' },
  { href: '/app/posts', label: 'Posts' },
  { href: '/app/bot', label: 'Connect Bot' },
  { href: '/app/backend-status', label: 'Backend' },
];

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useApp();

  if (!currentUser) return null;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="actions" style={{ marginTop: 0 }}>
        {links.map((l) => (
          <Link key={l.href} className="button" style={{ opacity: pathname === l.href ? 1 : 0.8 }} href={l.href}>
            {l.label}
          </Link>
        ))}
        <button
          className="button"
          onClick={() => {
            logout();
            router.push('/login');
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
