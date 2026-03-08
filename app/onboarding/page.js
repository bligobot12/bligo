import { redirect } from 'next/navigation';

export const runtime = 'edge';

import { createClient } from '../../lib/supabase/server';
import { saveIntroPreferencesAction, saveProfileBasicsAction } from '../home/actions';

export default async function OnboardingPage({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const params = await searchParams;
  const step = params?.step === '2' ? 2 : 1;
  const error = params?.error ? decodeURIComponent(params.error) : '';

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, bio, location, goals, interests')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: prefs } = await supabase
    .from('intro_preferences')
    .select('user_id, preferred_industries, preferred_locations, intro_goal, dealbreakers, visibility')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <section className="card" style={{ maxWidth: 760 }}>
      <h2>Onboarding</h2>
      <p className="muted">Step {step} of 2</p>
      {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}

      {step === 1 ? (
        <form className="form-col" action={saveProfileBasicsAction}>
          <label className="muted">Username</label>
          <input className="input" name="username" defaultValue={profile?.username || user.email?.split('@')[0] || ''} required />

          <label className="muted">Display name</label>
          <input className="input" name="display_name" defaultValue={profile?.display_name || ''} required />

          <label className="muted">Bio</label>
          <textarea className="input" name="bio" rows={3} defaultValue={profile?.bio || ''} />

          <label className="muted">Location</label>
          <input className="input" name="location" defaultValue={profile?.location || ''} placeholder="City, State" />

          <label className="muted">Goals</label>
          <textarea className="input" name="goals" rows={3} defaultValue={profile?.goals || ''} placeholder="What outcomes are you looking for?" />

          <label className="muted">Interests</label>
          <textarea className="input" name="interests" rows={3} defaultValue={profile?.interests || ''} placeholder="Topics, hobbies, industries you care about" />

          <button className="button primary" type="submit">Continue</button>
        </form>
      ) : (
        <form className="form-col" action={saveIntroPreferencesAction}>
          <label className="muted">Preferred industries (comma-separated)</label>
          <input className="input" name="preferred_industries" defaultValue={(prefs?.preferred_industries || []).join(', ')} />

          <label className="muted">Preferred locations (comma-separated)</label>
          <input className="input" name="preferred_locations" defaultValue={(prefs?.preferred_locations || []).join(', ')} />

          <label className="muted">Intro goal</label>
          <textarea className="input" name="intro_goal" rows={3} defaultValue={prefs?.intro_goal || ''} placeholder="Who would you like to be introduced to and why?" />

          <label className="muted">Dealbreakers</label>
          <textarea className="input" name="dealbreakers" rows={3} defaultValue={prefs?.dealbreakers || ''} placeholder="Any constraints to avoid" />

          <label className="muted">Visibility</label>
          <select className="input" name="visibility" defaultValue={prefs?.visibility || 'private'}>
            <option value="private">Private</option>
            <option value="network">Network</option>
            <option value="public">Public</option>
          </select>

          <div className="actions">
            <a className="button" href="/onboarding">Back</a>
            <button className="button primary" type="submit">Finish onboarding</button>
          </div>
        </form>
      )}
    </section>
  );
}
