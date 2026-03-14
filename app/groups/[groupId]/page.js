import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import {
  createGroupPostAction,
  joinPublicGroupAction,
  requestGroupJoinAction,
  reviewGroupJoinRequestAction,
  updateGroupSettingsAction,
} from '../actions';

function fullName(profile) {
  if (!profile) return 'Unknown';
  return profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
}

export default async function GroupDetailPage({ params, searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect('/login');

  const p = await params;
  const groupId = p.groupId;

  const [{ data: group, error: groupErr }, profileRes] = await Promise.all([
    supabase
      .from('groups')
      .select('id, name, description, privacy, creator_id, location, category, created_at')
      .eq('id', groupId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('user_id, display_name, first_name, last_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  if (groupErr) redirect('/groups?error=' + encodeURIComponent(groupErr.message));
  if (!group) redirect('/groups?error=' + encodeURIComponent('Group not found'));

  const [{ data: creator }, { data: members }, { data: meMember }, { data: myPendingRequest }, { data: posts }] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, display_name, first_name, last_name')
      .eq('user_id', group.creator_id)
      .maybeSingle(),
    supabase
      .from('group_members')
      .select('id, user_id, role, status, joined_at, profiles:user_id(user_id, display_name, first_name, last_name, avatar_url)')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true }),
    supabase
      .from('group_members')
      .select('id, role, status')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('group_join_requests')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle(),
    supabase
      .from('posts')
      .select('id, user_id, content, created_at, profiles:user_id(display_name, first_name, last_name)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(40),
  ]);

  const isMember = Boolean(meMember);
  const isAdmin = meMember?.role === 'owner' || meMember?.role === 'admin';

  const pendingRequests = isAdmin
    ? (await supabase
      .from('group_join_requests')
      .select('id, user_id, status, created_at, profiles:user_id(user_id, display_name, first_name, last_name)')
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })).data || []
    : [];

  const paramsQs = await searchParams;
  const error = paramsQs?.error ? decodeURIComponent(paramsQs.error) : '';
  const created = paramsQs?.created === '1';
  const saved = paramsQs?.saved === '1';
  const posted = paramsQs?.posted === '1';

  const memberCount = (members || []).length;

  return (
    <div className="form-col" style={{ maxWidth: 980 }}>
      <section className="card">
        <p className="muted" style={{ marginBottom: 8 }}>
          {group.privacy === 'private' ? 'Private Group' : 'Public Group'} · {memberCount} members
        </p>
        <h2 style={{ marginBottom: 8 }}>{group.name}</h2>
        <p style={{ marginTop: 0 }}>{group.description}</p>
        <p className="muted" style={{ marginTop: 10 }}>
          Created by {fullName(creator)}
          {group.category ? ` · ${group.category}` : ''}
          {group.location ? ` · ${group.location}` : ''}
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {isMember ? <button className="button" type="button" disabled>Joined</button> : null}
          {!isMember && group.privacy === 'public' ? (
            <form action={joinPublicGroupAction}>
              <input type="hidden" name="group_id" value={groupId} />
              <input type="hidden" name="next" value={`/groups/${groupId}`} />
              <button className="button primary" type="submit">Join Group</button>
            </form>
          ) : null}
          {!isMember && group.privacy === 'private' && !myPendingRequest ? (
            <form action={requestGroupJoinAction}>
              <input type="hidden" name="group_id" value={groupId} />
              <input type="hidden" name="next" value={`/groups/${groupId}`} />
              <button className="button primary" type="submit">Request to Join</button>
            </form>
          ) : null}
          {!isMember && group.privacy === 'private' && myPendingRequest ? (
            <button className="button" type="button" disabled>Pending Approval</button>
          ) : null}

          <Link className="button" href="/groups">Back to Groups</Link>
        </div>

        {created ? <p style={{ color: '#8fd19e', marginTop: 10 }}>Group created successfully.</p> : null}
        {saved ? <p style={{ color: '#8fd19e', marginTop: 10 }}>Group settings updated.</p> : null}
        {posted ? <p style={{ color: '#8fd19e', marginTop: 10 }}>Posted to group.</p> : null}
        {error ? <p style={{ color: '#ff9da3', marginTop: 10 }}>{error}</p> : null}
      </section>

      <section className="grid">
        <article className="card">
          <h3 style={{ marginTop: 0 }}>About</h3>
          <p>{group.description}</p>
          <ul className="bullets" style={{ marginTop: 10 }}>
            <li>Category: {group.category || 'General'}</li>
            <li>Location: {group.location || 'Not specified'}</li>
            <li>Rules: Be respectful, stay relevant, help each other.</li>
            <li>Privacy: {group.privacy === 'private' ? 'Members approved by admins.' : 'Anyone can join instantly.'}</li>
          </ul>
        </article>

        <article className="card">
          <h3 style={{ marginTop: 0 }}>Members</h3>
          <div className="form-col" style={{ gap: 8 }}>
            {(members || []).map((member) => {
              const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
              return (
                <div key={member.id} style={{ border: '1px solid #e6ecfa', borderRadius: 10, padding: 10 }}>
                  <strong>{fullName(profile)}</strong>
                  <p className="muted" style={{ marginTop: 4 }}>
                    {member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member'}
                  </p>
                </div>
              );
            })}
            {(members || []).length === 0 ? <p className="muted">No members yet.</p> : null}
          </div>
        </article>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Group Posts</h3>
        {isMember ? (
          <form action={createGroupPostAction} className="form-col" style={{ marginTop: 10 }}>
            <textarea className="input" rows={3} name="content" placeholder="Share an update with this group..." required />
            <input type="hidden" name="group_id" value={groupId} />
            <button className="button primary" type="submit" style={{ width: 'fit-content' }}>Post to Group</button>
          </form>
        ) : (
          <p className="muted">Join the group to post updates.</p>
        )}

        <div className="form-col" style={{ marginTop: 14, gap: 8 }}>
          {(posts || []).map((post) => {
            const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
            return (
              <article key={post.id} style={{ border: '1px solid #e6ecfa', borderRadius: 10, padding: 12 }}>
                <p style={{ marginTop: 0, marginBottom: 8 }}>{post.content}</p>
                <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                  {fullName(author)} · {new Date(post.created_at).toLocaleString()}
                </p>
              </article>
            );
          })}
          {(posts || []).length === 0 ? <p className="muted">No group posts yet.</p> : null}
        </div>
      </section>

      {isAdmin ? (
        <section className="grid">
          <article className="card">
            <h3 style={{ marginTop: 0 }}>Requests (Admin)</h3>
            {(pendingRequests || []).length === 0 ? <p className="muted">No pending requests.</p> : null}
            <div className="form-col" style={{ gap: 8 }}>
              {(pendingRequests || []).map((req) => {
                const requester = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
                return (
                  <div key={req.id} style={{ border: '1px solid #e6ecfa', borderRadius: 10, padding: 10 }}>
                    <p style={{ marginTop: 0 }}>{fullName(requester)}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <form action={reviewGroupJoinRequestAction}>
                        <input type="hidden" name="group_id" value={groupId} />
                        <input type="hidden" name="request_id" value={req.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <button className="button primary" type="submit">Approve</button>
                      </form>
                      <form action={reviewGroupJoinRequestAction}>
                        <input type="hidden" name="group_id" value={groupId} />
                        <input type="hidden" name="request_id" value={req.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <button className="button" type="submit">Reject</button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="card">
            <h3 style={{ marginTop: 0 }}>Settings (Admin)</h3>
            <form action={updateGroupSettingsAction} className="form-col" style={{ marginTop: 8 }}>
              <input type="hidden" name="group_id" value={groupId} />
              <label>
                Group Name
                <input className="input" name="name" defaultValue={group.name} required />
              </label>
              <label>
                Description
                <textarea className="input" name="description" rows={3} defaultValue={group.description} required />
              </label>
              <label>
                Privacy
                <select className="input" name="privacy" defaultValue={group.privacy}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <label>
                Location (optional)
                <input className="input" name="location" defaultValue={group.location || ''} />
              </label>
              <label>
                Category (optional)
                <input className="input" name="category" defaultValue={group.category || ''} />
              </label>
              <button className="button primary" type="submit">Save Group Settings</button>
            </form>
          </article>
        </section>
      ) : null}

      {!isAdmin && group.privacy === 'private' ? (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Private group access</h3>
          <p className="muted">Private groups require approval from an owner or admin before you can view member-only activity.</p>
        </section>
      ) : null}
    </div>
  );
}
