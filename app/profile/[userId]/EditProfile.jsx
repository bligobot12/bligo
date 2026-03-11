'use client';

import { useState } from 'react';

export default function EditProfile({ profile, updateAction }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button className="button" type="button" onClick={() => setOpen((v) => !v)}>
        {open ? 'Close editor' : 'Edit profile'}
      </button>

      {open ? (
        <div className="card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 560, maxWidth: '90vw', zIndex: 20 }}>
          <form action={updateAction} className="form-col">
            <input className="input" name="display_name" defaultValue={profile?.display_name || ''} placeholder="Display name" />
            <textarea className="input" name="job_title" defaultValue={profile?.job_title || ''} rows={3} placeholder="e.g. Owner - White Plains Property & Project Management&#10;Founder - Bligo.ai" style={{ width: '100%', resize: 'vertical' }} />
            <input className="input" name="industry" defaultValue={profile?.industry || ''} placeholder="Industry" />
            <input className="input" name="location_city" defaultValue={profile?.location_city || profile?.city || ''} placeholder="City" />
            <input className="input" name="location_state" defaultValue={profile?.location_state || ''} placeholder="State" />
            <textarea className="input" name="bio" defaultValue={profile?.bio || ''} placeholder="Bio" rows={4} />
            <button className="button primary" type="submit">Save profile</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
