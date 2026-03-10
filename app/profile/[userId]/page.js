import { createClient } from '../../../lib/supabase/server';

export default async function PublicProfilePage({ params }) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, display_name, headline, city')
    .eq('user_id', userId)
    .maybeSingle();

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 40 }}>
      <h2>{profile?.display_name || 'User'}</h2>
      <p>{profile?.headline}</p>
      <p>{profile?.city}</p>
    </div>
  );
}
