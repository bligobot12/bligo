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
    .select('user_id, username, display_name, headline, city, interests, goals, visibility, onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: prefs } = await supabase
    .from('intro_preferences')
    .select('user_id, intro_types, open_to_meeting, preferred_locations, notes')
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

          <label className="muted">Headline</label>
          <input className="input" name="headline" defaultValue={profile?.headline || ''} placeholder="Short intro" />

          <label className="muted">City</label>
          <input className="input" name="city" defaultValue={profile?.city || ''} placeholder="City" />

          <label className="muted">Interests (comma-separated)</label>
          <input className="input" name="interests" defaultValue={(profile?.interests || []).join(', ')} />

          <label className="muted">Goals (comma-separated)</label>
          <input className="input" name="goals" defaultValue={(profile?.goals || []).join(', ')} />

          <label className="muted">Visibility</label>
          <select className="input" name="visibility" defaultValue={profile?.visibility || 'connections'}>
            <option value="connections">Connections</option>
            <option value="private">Private</option>
          </select>

          <button className="button primary" type="submit">Continue</button>
        </form>
      ) : (
        <form className="form-col" action={saveIntroPreferencesAction}>
          <label className="muted">Intro types (comma-separated)</label>
          <input className="input" name="intro_types" defaultValue={(prefs?.intro_types || []).join(', ')} placeholder="friends, professional, activity" />

          <label className="muted">Preferred locations (comma-separated)</label>
          <input className="input" name="preferred_locations" defaultValue={(prefs?.preferred_locations || []).join(', ')} />

          <label className="muted">Open to meeting?</label>
          <select className="input" name="open_to_meeting" defaultValue={prefs?.open_to_meeting === false ? 'false' : 'true'}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>

          <label className="muted">Notes</label>
          <textarea className="input" name="notes" rows={3} defaultValue={prefs?.notes || ''} />

          <div className="actions">
            <a className="button" href="/onboarding">Back</a>
            <button className="button primary" type="submit">Finish onboarding</button>
          </div>
        </form>
      )}
    </section>
  );
}
