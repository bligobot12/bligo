import Avatar from './Avatar';

export default function UserCard({ profile, size = 'md', showMessage = false }) {
  const name = profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.username || 'Unknown';

  const subline = [
    profile?.job_title,
    profile?.industry,
    [profile?.location_city, profile?.location_state].filter(Boolean).join(', ')
  ].filter(Boolean).join(' · ') || profile?.headline || profile?.city || '';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Avatar src={profile?.avatar_url} name={name} size={size === 'sm' ? 36 : size === 'lg' ? 64 : 44} />
      <div>
        <strong>{name}</strong>
        {subline && <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>{subline}</p>}
        {showMessage && profile?.user_id && (
          <p style={{ margin: '4px 0 0' }}>
            <a href={`/messages/${profile.user_id}`} className="muted" style={{ fontSize: 12 }}>Message →</a>
          </p>
        )}
      </div>
    </div>
  );
}
