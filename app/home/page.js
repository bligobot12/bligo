import { redirect } from 'next/navigation';

export const runtime = 'edge';

import { createClient } from '../../lib/supabase/server';
import { logoutAction } from '../auth/actions';
import { saveProfileAction } from './actions';

export default async function HomePage({ searchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  let { data: profile } = await supabase
    .from('profiles')
    .select('id, user_id, username, display_name, full_name, bio, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const seed = {
      id: user.id,
      user_id: user.id,
      username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
      display_name: user.user_metadata?.full_name || null,
      full_name: user.user_metadata?.full_name || null,
      bio: '',
    };

    const { error } = await supabase.from('profiles').insert(seed);
    if (error) {
      await supabase.from('profiles').insert({
        id: user.id,
        username: seed.username,
        full_name: seed.full_name,
        bio: '',
      });
    }

    const refetch = await supabase
      .from('profiles')
      .select('id, user_id, username, display_name, full_name, bio, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    profile = refetch.data;
  }

  const params = await searchParams;
  const error = params?.error ? decodeURIComponent(params.error) : '';
  const saved = params?.saved === '1';

  const displayName = profile?.display_name || profile?.full_name || '';

  return (
    <section className="card" style={{ maxWidth: 780 }}>
      <h2>Home</h2>
      <p className="muted">Authenticated profile + avatar slice (Supabase-backed).</p>

      {saved ? <p style={{ color: '#8fd19e' }}>Profile saved.</p> : null}
      {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}

      <form action={saveProfileAction} className="form-col" style={{ marginTop: 12 }}>
        <p><strong>Email:</strong> {user.email}</p>

        <label className="muted">Username</label>
        <input className="input" name="username" defaultValue={profile?.username || ''} required />

        <label className="muted">Display name</label>
        <input className="input" name="display_name" defaultValue={displayName} />

        <label className="muted">Bio</label>
        <textarea className="input" name="bio" rows={4} defaultValue={profile?.bio || ''} />

        <label className="muted">Avatar</label>
        <input className="input" type="file" name="avatar" accept="image/*" />

        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="avatar"
            width={88}
            height={88}
            style={{ width: 88, height: 88, borderRadius: 999, border: '1px solid var(--border)', objectFit: 'cover' }}
          />
        ) : null}

        <div className="actions">
          <button className="button primary" type="submit">Save profile</button>
        </div>
      </form>

      <form action={logoutAction} style={{ marginTop: 16 }}>
        <button className="button" type="submit">Log out</button>
      </form>
    </section>
  );
}
