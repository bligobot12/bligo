'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';

export default function UserMenu({ profileHref, settingsHref = '/settings', logoutHref = '/logout', name, avatarUrl }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDocClick(event) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar src={avatarUrl} name={name || 'You'} size={28} />
        <span className="user-menu-caret">▾</span>
      </button>

      {open ? (
        <div className="user-menu-dropdown" role="menu" aria-label="Profile menu">
          <Link href={profileHref} role="menuitem" onClick={() => setOpen(false)}>Profile</Link>
          <Link href={settingsHref} role="menuitem" onClick={() => setOpen(false)}>Settings</Link>
          <Link href={logoutHref} role="menuitem" onClick={() => setOpen(false)}>Logout</Link>
        </div>
      ) : null}
    </div>
  );
}
