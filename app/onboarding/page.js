import { redirect } from 'next/navigation';


import { createClient } from '../../lib/supabase/server';
import TagInput from '../../components/TagInput';
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
      <p className="muted" style={{ marginTop: -6 }}>
        {step === 1
          ? 'Tell people what you care about so Bligo can find high-fit intros.'
          : 'Set your intro preferences so suggestions are practical and relevant.'}
      </p>
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

          <TagInput
            name="interests"
            label="Interests"
            defaultTags={profile?.interests || []}
            placeholder="e.g. real estate, AI, fitness"
          />

          <TagInput
            name="goals"
            label="Goals"
            defaultTags={profile?.goals || []}
            placeholder="e.g. find local contractors, meet investors"
          />

          <label className="muted">Visibility</label>
          <select className="input" name="visibility" defaultValue={profile?.visibility || 'connections'}>
            <option value="connections">Connections</option>
            <option value="private">Private</option>
          </select>

          <div className="actions">
            <a className="button" href="/home">Back to home</a>
            <button className="button primary" type="submit">Save and continue</button>
          </div>
        </form>
      ) : (
        <div className="form-col">
          <div className="post-item">
            <p className="muted" style={{ marginBottom: 6 }}>Want to skip manual setup?</p>
            <p style={{ marginTop: 0 }}>Connect your AI agent to fill this in automatically.</p>
            <a className="button" href="/settings" style={{ marginTop: 8, display: 'inline-block' }}>Connect your AI agent</a>
          </div>

          <form className="form-col" action={saveIntroPreferencesAction}>
          <TagInput
            name="intro_types"
            label="Intro types"
            defaultTags={prefs?.intro_types || []}
            placeholder="friends, professional, activity"
          />
          <p className="muted" style={{ marginTop: 4 }}>Pick the kinds of introductions you want most (friends, professional, activity, etc.).</p>

          <TagInput
            name="preferred_locations"
            label="Preferred locations"
            defaultTags={prefs?.preferred_locations || []}
            placeholder="White Plains, NYC, Westchester"
          />

          <label className="muted">Open to meeting?</label>
          <select className="input" name="open_to_meeting" defaultValue={prefs?.open_to_meeting === false ? 'false' : 'true'}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>

          <label className="muted">Notes</label>
          <textarea className="input" name="notes" rows={3} defaultValue={prefs?.notes || ''} placeholder="Anything we should consider for intros?" />

          <div className="actions">
            <a className="button" href="/onboarding">Back</a>
            <button className="button primary" type="submit">Finish onboarding</button>
          </div>
          </form>
        </div>
      )}
    </section>
  );
}
