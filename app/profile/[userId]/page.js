import { createClient } from '../../../lib/supabase/server';
import Avatar from '../../../components/Avatar';

export default async function PublicProfilePage({ params }) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, display_name, first_name, last_name, headline, avatar_url, city, industry, job_title')
    .eq('user_id', userId)
    .maybeSingle();

  const name = profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User';

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <Avatar src={profile?.avatar_url} name={name} size={80} />
        <h2 style={{ margin: '12px 0 4px' }}>{name}</h2>
        <p className="muted">{[profile?.job_title, profile?.industry].filter(Boolean).join(' · ')}</p>
        <p className="muted">{profile?.city}</p>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <a href={`/messages/${userId}`} className="button">Message</a>
        </div>
      </div>
    </div>
  );
}
