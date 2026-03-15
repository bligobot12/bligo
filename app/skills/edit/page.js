import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import RemoveSignalButton from '../../../components/RemoveSignalButton';

export default async function EditSkillsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('signals, specialty, interests, goals')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const signals = profile?.signals || [];

  return (
    <section className="card" style={{ maxWidth: 640 }}>
      <h2>Edit Your Skills Profile</h2>
      <p className="muted">These are the skills and interests Bligo uses to find your matches. Remove anything that's not accurate.</p>

      {signals.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <p className="muted">No skills yet. <a href="/skills/add">Add skills with your bot →</a></p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {signals.map((signal, i) => (
          <div
            key={`${signal.tag || 'signal'}-${i}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: '#F0F2F5',
              borderRadius: 8,
            }}
          >
            <div>
              <span style={{ fontWeight: 600 }}>{signal.tag}</span>
              <span className="muted" style={{ fontSize: 12, marginLeft: 10 }}>
                {signal.cluster || 'general'} · {Math.round((signal.confidence || 0) * 10)}/10 confidence
              </span>
            </div>
            <RemoveSignalButton tag={signal.tag} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, borderTop: '1px solid #CED0D4', paddingTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href="/skills/add" className="button primary">+ Add more skills with your bot</a>
        <a href="/skills" className="button">Back to Skills</a>
      </div>
    </section>
  );
}
