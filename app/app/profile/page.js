'use client';

import { useRef, useState } from 'react';
import { useApp } from '../../providers';

export default function ProfilePage() {
  const { currentUser, updateProfile } = useApp();
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const fileRef = useRef(null);

  if (!currentUser) return null;

  const onFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  return (
    <section className="card">
      <h2>Profile</h2>
      <div className="form-col">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <textarea className="input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" rows={4} />

        <div className="actions" style={{ alignItems: 'center' }}>
          {avatar ? <img src={avatar} alt="avatar" width={64} height={64} style={{ borderRadius: 999 }} /> : null}
          <input ref={fileRef} type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>

        <button className="button primary" onClick={() => updateProfile({ name, bio, avatar })}>Save profile</button>
      </div>
    </section>
  );
}
