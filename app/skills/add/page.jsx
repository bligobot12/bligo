import { createClient } from '../../../lib/supabase/server';
import SkillsAddTabs from '../../../components/SkillsAddTabs';

export default async function SkillsAddPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 40 }}>
      <p>Please <a href="/login">log in</a> to view this page.</p>
    </div>
  );

  const userId = session.user.id;

  const { data: botConn } = await supabase
    .from('bot_connections')
    .select('api_key')
    .eq('user_id', userId)
    .maybeSingle();

  const apiKey = botConn?.api_key || 'YOUR_API_KEY';

  const { data: profile } = await supabase
    .from('profiles')
    .select('signals')
    .eq('user_id', userId)
    .maybeSingle();

  const hasExistingSkills = (profile?.signals?.length || 0) > 0;

  return (
    <section className="card" style={{ maxWidth: 680 }}>
      <h2>Train Your Skills Profile</h2>
      <p className="muted" style={{ marginTop: 4, marginBottom: 20 }}>
        Your AI bot will review your existing conversations, ask a few targeted questions,
        and automatically build your Bligo skills profile. The better your profile, the better your matches.
      </p>

      <SkillsAddTabs
        apiKey={apiKey}
        userId={userId}
        hasExistingSkills={hasExistingSkills}
      />
    </section>
  );
}
