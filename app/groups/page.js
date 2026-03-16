import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { joinPublicGroupAction, requestGroupJoinAction } from './actions';

const FILTERS = ['all', 'public', 'private', 'mine'];

function parseFilter(v) {
  const value = String(v || 'all').toLowerCase();
  return FILTERS.includes(value) ? value : 'all';
}

function displayButton({ isMember, isPending, privacy }) {
  if (isMember) return { label: 'View Group', disabled: false, action: null };
  if (isPending) return { label: 'Pending Approval', disabled: true, action: null };
  if (privacy === 'private') return { label: 'Request to Join', disabled: false, action: 'request' };
  return { label: 'Join Group', disabled: false, action: 'join' };
}

export default async function GroupsPage({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect('/login');

  const params = await searchParams;
  const q = String(params?.q || '').trim();
  const filter = parseFilter(params?.filter);
  const error = params?.error ? decodeURIComponent(params.error) : '';
  const joined = params?.joined === '1';
  const requested = params?.requested === '1';

  let groupsQuery = supabase
    .from('groups')
    .select('id, name, description, privacy, creator_id, location, category, avatar_url, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (q) groupsQuery = groupsQuery.ilike('name', `%${q}%`);
  if (filter === 'public') groupsQuery = groupsQuery.eq('privacy', 'public');
  if (filter === 'private') groupsQuery = groupsQuery.eq('privacy', 'private');

  const { data: allGroups, error: groupErr } = await groupsQuery;
  if (groupErr) redirect('/home?error=' + encodeURIComponent(groupErr.message));

  const groupIds = (allGroups || []).map((g) => g.id);

  const { data: myMemberships } = groupIds.length
    ? await supabase
      .from('group_members')
      .select('group_id, role, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('group_id', groupIds)
    : { data: [] };

  const { data: myRequests } = groupIds.length
    ? await supabase
      .from('group_join_requests')
      .select('group_id, status')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .in('group_id', groupIds)
    : { data: [] };

  const { data: memberRows } = groupIds.length
    ? await supabase
      .from('group_members')
      .select('group_id, user_id')
      .eq('status', 'active')
      .in('group_id', groupIds)
    : { data: [] };

  const creatorIds = [...new Set((allGroups || []).map((g) => g.creator_id).filter(Boolean))];
  const { data: creators } = creatorIds.length
    ? await supabase
      .from('profiles')
      .select('user_id, display_name, first_name, last_name')
      .in('user_id', creatorIds)
    : { data: [] };

  const creatorById = new Map((creators || []).map((p) => [
    p.user_id,
    p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
  ]));

  const memberCount = new Map();
  for (const row of memberRows || []) {
    memberCount.set(row.group_id, (memberCount.get(row.group_id) || 0) + 1);
  }

  const myGroupSet = new Set((myMemberships || []).map((m) => m.group_id));
  const myPendingSet = new Set((myRequests || []).map((r) => r.group_id));

  const filtered = (allGroups || []).filter((g) => (filter === 'mine' ? myGroupSet.has(g.id) : true));

  return (
    <div className="form-col" style={{ maxWidth: 980 }}>
      <section className="card">
        <h2 style={{ marginBottom: 6 }}>Discover Groups</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Groups help you connect around shared interests, needs, industries, and local communities.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
          <Link className="button primary" href="/groups/new">Create Group</Link>
          <form action="/groups" method="get" style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
            <input type="hidden" name="filter" value={filter} />
            <input className="input" name="q" defaultValue={q} placeholder="Search groups..." />
            <button className="button" type="submit">Search</button>
          </form>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {FILTERS.map((f) => (
            <Link
              key={f}
              className="button"
              href={`/groups?filter=${f}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              style={filter === f ? { borderColor: '#5b8cff', color: '#1f58d6' } : undefined}
            >
              {f === 'all' ? 'All' : f === 'mine' ? 'My Groups' : f[0].toUpperCase() + f.slice(1)}
            </Link>
          ))}
        </div>

        {joined ? <p style={{ color: '#8fd19e', marginTop: 12 }}>Joined group successfully.</p> : null}
        {requested ? <p style={{ color: '#8fd19e', marginTop: 12 }}>Join request sent.</p> : null}
        {error ? <p style={{ color: '#ff9da3', marginTop: 12 }}>{error}</p> : null}
      </section>

      <section className="grid" style={{ marginTop: 2 }}>
        {filtered.map((group) => {
          const state = displayButton({
            isMember: myGroupSet.has(group.id),
            isPending: myPendingSet.has(group.id),
            privacy: group.privacy,
          });

          const count = memberCount.get(group.id) || 1;

          return (
            <article className="card" key={group.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#E7F3FF',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #CED0D4',
                    flexShrink: 0,
                  }}
                >
                  {group.avatar_url ? (
                    <img src={group.avatar_url} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 20 }}>👥</span>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15 }}>{group.name}</h3>
                  <span style={{ fontSize: 12, color: '#65676B' }}>{group.privacy === 'public' ? '🌐 Public' : '🔒 Private'}</span>
                </div>
              </div>
              <p className="muted" style={{ marginBottom: 6 }}>
                {group.privacy === 'private' ? 'Private' : 'Public'} · {count} members
              </p>
              <p style={{ marginTop: 8 }}>{group.description}</p>
              <p className="muted" style={{ marginTop: 8 }}>
                Admin: {creatorById.get(group.creator_id) || 'Unknown'}
              </p>

              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <Link className="button" href={`/groups/${group.id}`}>Open Group</Link>

                {state.action === 'join' ? (
                  <form action={joinPublicGroupAction}>
                    <input type="hidden" name="group_id" value={group.id} />
                    <input type="hidden" name="next" value={`/groups?filter=${filter}${q ? `&q=${encodeURIComponent(q)}` : ''}`} />
                    <button className="button primary" type="submit">{state.label}</button>
                  </form>
                ) : null}

                {state.action === 'request' ? (
                  <form action={requestGroupJoinAction}>
                    <input type="hidden" name="group_id" value={group.id} />
                    <input type="hidden" name="next" value={`/groups?filter=${filter}${q ? `&q=${encodeURIComponent(q)}` : ''}`} />
                    <button className="button primary" type="submit">{state.label}</button>
                  </form>
                ) : null}

                {!state.action ? (
                  <button className="button" type="button" disabled={state.disabled}>{state.label}</button>
                ) : null}
              </div>
            </article>
          );
        })}

        {filtered.length === 0 ? (
          <article className="card">
            <h3 style={{ marginTop: 0 }}>No groups found</h3>
            <p className="muted">Try a different search/filter, or create a new group.</p>
            <Link className="button primary" href="/groups/new">Create Group</Link>
          </article>
        ) : null}
      </section>
    </div>
  );
}
