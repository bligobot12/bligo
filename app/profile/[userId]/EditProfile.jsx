'use client';

import { useState } from 'react';

export default function EditProfile({ profile, updateAction }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Profile details</h3>
        <button className="button" type="button" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close editor' : 'Edit profile'}
        </button>
      </div>

      {open ? (
        <form action={updateAction} className="form-col" style={{ marginTop: 12 }}>
          <input className="input" name="display_name" defaultValue={profile?.display_name || ''} placeholder="Display name" />
          <input className="input" name="job_title" defaultValue={profile?.job_title || ''} placeholder="Job title" />
          <input className="input" name="industry" defaultValue={profile?.industry || ''} placeholder="Industry" />
          <input className="input" name="location_city" defaultValue={profile?.location_city || profile?.city || ''} placeholder="City" />
          <input className="input" name="location_state" defaultValue={profile?.location_state || ''} placeholder="State" />
          <textarea className="input" name="bio" defaultValue={profile?.bio || ''} placeholder="Bio" rows={4} />
          <button className="button primary" type="submit">Save profile</button>
        </form>
      ) : null}
    </section>
  );
}
