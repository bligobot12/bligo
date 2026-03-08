import Link from 'next/link';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

import { createClient } from '../../lib/supabase/server';
import { sendConnectionRequestAction } from './actions';

export default async function ConnectionsPage({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const params = await searchParams;
  const q = String(params?.q || '').trim();
  const error = params?.error ? decodeURIComponent(params.error) : '';
  const sent = params?.sent === '1';

  let people = [];
  if (q.length > 0) {
    const { data, error: peopleError } = await supabase
      .from('profiles')
      .select('user_id, username, display_name')
      .neq('user_id', user.id)
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(25);

    if (!peopleError) people = data || [];
  }

  const ids = people.map((p) => p.user_id);

  let connectionRows = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from('connections')
      .select('from_user_id, to_user_id, status')
      .or(
        ids
          .map((id) => `and(from_user_id.eq.${user.id},to_user_id.eq.${id})`)
          .concat(ids.map((id) => `and(from_user_id.eq.${id},to_user_id.eq.${user.id})`))
          .join(',')
      );
    connectionRows = data || [];
  }

  const connectionMap = new Map();
  for (const row of connectionRows) {
    const otherId = row.from_user_id === user.id ? row.to_user_id : row.from_user_id;
    connectionMap.set(otherId, row.status || 'pending');
  }

  return (
    <div className="form-col" style={{ maxWidth: 860 }}>
      <section className="card">
        <h2>Connections</h2>
        <p className="muted">Search by username or display name and send a connection request.</p>

        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}
        {sent ? <p style={{ color: '#8fd19e' }}>Connection request sent.</p> : null}

        <form className="form-col" action="/connections" method="GET" style={{ marginTop: 8 }}>
          <input className="input" name="q" placeholder="Search users..." defaultValue={q} />
          <div className="actions">
            <button className="button primary" type="submit">Search</button>
            <Link className="button" href="/home">Back home</Link>
          </div>
        </form>

        <div className="feed" style={{ marginTop: 12 }}>
          {q.length === 0 ? <p className="muted">Enter a search query to find people.</p> : null}
          {q.length > 0 && people.length === 0 ? <p className="muted">No users found.</p> : null}

          {people.map((p) => {
            const status = connectionMap.get(p.user_id);
            const canSend = !status || status === 'declined';
            return (
              <div key={p.user_id} className="post-item" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <strong>{p.display_name || p.username || p.user_id}</strong>
                  <p className="muted">@{p.username || 'no-username'}</p>
                </div>

                {canSend ? (
                  <form action={sendConnectionRequestAction}>
                    <input type="hidden" name="to_user_id" value={p.user_id} />
                    <button className="button" type="submit">Send request</button>
                  </form>
                ) : (
                  <span className="muted" style={{ textTransform: 'capitalize' }}>{status}</span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
