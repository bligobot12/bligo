import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { generateApiKeyOnboardingAction, saveBotOnboardingAction, completeOnboardingAction } from './actions';
import OnboardingPrompt from '../../components/OnboardingPrompt';
import TagInput from '../../components/TagInput';
import { saveIntroPreferencesAction, saveProfileBasicsAction } from '../home/actions';

export default async function OnboardingPage({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect('/login');

  const { data: connection } = await supabase
    .from('bot_connections')
    .select('user_id, api_key, bot_name, bot_type, status')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, headline, city, interests, goals, visibility')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: prefs } = await supabase
    .from('intro_preferences')
    .select('user_id, intro_types, open_to_meeting, preferred_locations, notes')
    .eq('user_id', user.id)
    .maybeSingle();

  const params = await searchParams;
  const saved = params?.saved === '1';
  const error = params?.error ? decodeURIComponent(params.error) : '';

  return (
    <section className="card" style={{ maxWidth: 760 }}>
      <h2>Welcome to Bligo</h2>
      <p className="muted" style={{ marginTop: 4 }}>
        Connect your AI agent to set up your profile automatically — or fill it in manually below.
      </p>
      {saved ? <p style={{ color: '#8fd19e' }}>Saved!</p> : null}
      {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}

      <div className="post-item" style={{ marginTop: 12, borderColor: '#4b5f9c', background: '#101a3b' }}>
        <p style={{ margin: 0 }}>
          💡 <strong>Tip:</strong> Bligo works best when connected to a personal AI agent that knows your full history.
          Users with personal agents get significantly better matches because profiles are built from real behavior,
          not just what people remember to type.
        </p>
        <a className="button" href="/docs" style={{ marginTop: 10, display: 'inline-block' }}>Learn about personal AI agents →</a>
      </div>

      {/* STEP 1 — API Key */}
      <div className="form-col" style={{ marginTop: 16, borderBottom: '1px solid #2a2a2a', paddingBottom: 24 }}>
        <h3 style={{ marginBottom: 4 }}>Step 1 — Get your API key</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Your API key connects your AI agent (ChatGPT, Claude, Gemini, OpenClaw) to your Bligo profile.
        </p>
        {connection?.api_key ? (
          <p style={{ wordBreak: 'break-all' }}><strong>{connection.api_key}</strong></p>
        ) : (
          <p className="muted">No API key yet — generate one below.</p>
        )}
        <form action={generateApiKeyOnboardingAction} style={{ marginTop: 8 }}>
          <button className="button" type="submit">
            {connection?.api_key ? 'Regenerate API key' : 'Generate API key'}
          </button>
        </form>
      </div>

      {/* STEP 2 — Onboarding Prompt */}
      <div className="form-col" style={{ marginTop: 24, borderBottom: '1px solid #2a2a2a', paddingBottom: 24 }}>
        <h3 style={{ marginBottom: 4 }}>Step 2 — Onboard with your AI</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Copy this prompt and paste it into your AI agent. It will ask you a few questions and build your Bligo profile automatically.
        </p>
        {connection?.api_key ? (
          <OnboardingPrompt apiKey={connection.api_key} />
        ) : (
          <p className="muted">Generate your API key in Step 1 first.</p>
        )}
      </div>

      {/* STEP 3 — Bot Settings */}
      <div className="form-col" style={{ marginTop: 24, borderBottom: '1px solid #2a2a2a', paddingBottom: 24 }}>
        <h3 style={{ marginBottom: 4 }}>Step 3 — Name your bot</h3>
        <p className="muted" style={{ marginTop: 0 }}>Tell us which AI agent you are using.</p>
        <form className="form-col" action={saveBotOnboardingAction}>
          <label className="muted">Bot name</label>
          <input className="input" name="bot_name" defaultValue={connection?.bot_name || ''} placeholder="My Assistant" />
          <label className="muted">Bot type</label>
          <select className="input" name="bot_type" defaultValue={connection?.bot_type || 'chatgpt'}>
            <option value="openclaw">OpenClaw</option>
            <option value="chatgpt">ChatGPT</option>
            <option value="claude">Claude</option>
            <option value="custom">Custom</option>
          </select>
          <button className="button primary" type="submit" style={{ marginTop: 8 }}>Save bot settings</button>
        </form>
      </div>

      {/* MANUAL FALLBACK */}
      <details style={{ marginTop: 24 }}>
        <summary style={{ cursor: 'pointer', color: '#888', fontSize: 14 }}>
          I dont have an AI agent — fill in manually
        </summary>
        <div className="form-col" style={{ marginTop: 16 }}>
          <form className="form-col" action={saveProfileBasicsAction}>
            <label className="muted">Username</label>
            <input className="input" name="username" defaultValue={profile?.username || user.email?.split('@')[0] || ''} required />
            <label className="muted">Display name</label>
            <input className="input" name="display_name" defaultValue={profile?.display_name || ''} required />
            <label className="muted">Headline</label>
            <input className="input" name="headline" defaultValue={profile?.headline || ''} placeholder="Short intro" />
            <label className="muted">City</label>
            <input className="input" name="city" defaultValue={profile?.city || ''} placeholder="City" />
            <TagInput name="interests" label="Interests" defaultTags={profile?.interests || []} placeholder="e.g. real estate, AI, fitness" />
            <TagInput name="goals" label="Goals" defaultTags={profile?.goals || []} placeholder="e.g. find local contractors, meet investors" />
            <label className="muted">Visibility</label>
            <select className="input" name="visibility" defaultValue={profile?.visibility || 'connections'}>
              <option value="connections">Connections</option>
              <option value="private">Private</option>
            </select>
            <button className="button primary" type="submit">Save profile</button>
          </form>

          <form className="form-col" action={saveIntroPreferencesAction} style={{ marginTop: 16 }}>
            <TagInput name="intro_types" label="Intro types" defaultTags={prefs?.intro_types || []} placeholder="friends, professional, activity" />
            <TagInput name="preferred_locations" label="Preferred locations" defaultTags={prefs?.preferred_locations || []} placeholder="White Plains, NYC, Westchester" />
            <label className="muted">Open to meeting?</label>
            <select className="input" name="open_to_meeting" defaultValue={prefs?.open_to_meeting === false ? 'false' : 'true'}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            <label className="muted">Notes</label>
            <textarea className="input" name="notes" rows={3} defaultValue={prefs?.notes || ''} placeholder="Anything we should consider for intros?" />
            <button className="button primary" type="submit">Save preferences</button>
          </form>
        </div>
      </details>

      {/* GO TO FEED — marks onboarding complete */}
      <form action={completeOnboardingAction} style={{ marginTop: 24 }}>
        <button className="button primary" type="submit">Go to my feed →</button>
      </form>
    </section>
  );
}
