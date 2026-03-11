'use client';
import { useState } from 'react';

export default function EditProfile({ profile }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.target);
    await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(fd)),
    });
    setSaving(false);
    setOpen(false);
    window.location.reload();
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="button" type="button" onClick={() => setOpen((v) => !v)}>
        {open ? 'Close' : 'Edit profile'}
      </button>
      {open && (
        <div className="card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 560, maxWidth: '90vw', zIndex: 20 }}>
          <form onSubmit={handleSubmit} className="form-col">
            <input className="input" name="headline" defaultValue={profile?.headline || ''} placeholder="Headline — e.g. Builder · Founder · Dad" />
            <input className="input" name="display_name" defaultValue={profile?.display_name || ''} placeholder="Display name" />
            <textarea className="input" name="job_title" defaultValue={profile?.job_title || ''} rows={3} placeholder="Job title(s)" style={{ width: '100%', resize: 'vertical' }} />
            <input className="input" name="industry" defaultValue={profile?.industry || ''} placeholder="Industry" />
            <input className="input" name="location_city" defaultValue={profile?.location_city || profile?.city || ''} placeholder="City" />
            <input className="input" name="location_state" defaultValue={profile?.location_state || ''} placeholder="State" />
            <textarea className="input" name="bio" defaultValue={profile?.bio || ''} placeholder="Bio" rows={4} style={{ width: '100%', resize: 'vertical' }} />
            <button className="button primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
