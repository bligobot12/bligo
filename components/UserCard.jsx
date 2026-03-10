import Link from 'next/link';
import Avatar from './Avatar';

export default function UserCard({ user, degree, subtitle, right, children, messageHref, profileHref }) {
  if (!user) return null;
  const name = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown';
  const city = user.location_city || user.city;
  const state = user.location_state;
  const role = [user.job_title, user.industry].filter(Boolean).join(' · ');

  return (
    <div className="post-item" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <Avatar src={user.avatar_url} name={name} size={40} />
      <div style={{ flex: 1 }}>
        <strong>{name} {degree ? <span className="degree-badge">{degree}</span> : null}</strong>
        {subtitle ? <p className="muted" style={{ margin: 0 }}>{subtitle}</p> : null}
        {!subtitle && user.headline ? <p className="muted" style={{ margin: 0 }}>{user.headline}</p> : null}
        {(role || city || state) ? <p className="muted" style={{ margin: 0, fontSize: 12 }}>{[role, [city, state].filter(Boolean).join(', ')].filter(Boolean).join(' • ')}</p> : null}
        {children}
      </div>
      <div className="actions" style={{ marginTop: 0 }}>
        {profileHref ? <Link className="button" href={profileHref}>Profile</Link> : null}
        {messageHref ? <Link className="button" href={messageHref}>Message →</Link> : null}
        {right}
      </div>
    </div>
  );
}
