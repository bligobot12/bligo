'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

function enc(v) {
  return encodeURIComponent(v || 'Unexpected error');
}

async function getAuthed() {
  const supabase = await createClient();
  if (!supabase) return { error: 'Supabase env not configured' };
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return { error: 'login' };
  return { supabase, user };
}

export async function createGroupAction(formData) {
  const auth = await getAuthed();
  if (auth.error === 'login') redirect('/login');
  if (auth.error) redirect('/groups/new?error=' + enc(auth.error));

  const { supabase, user } = auth;

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const privacy = String(formData.get('privacy') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const avatar_url = String(formData.get('avatar_url') || '').trim();

  if (!name) redirect('/groups/new?error=' + enc('Group name is required.'));
  if (!description) redirect('/groups/new?error=' + enc('Description is required.'));
  if (!['public', 'private'].includes(privacy)) {
    redirect('/groups/new?error=' + enc('Privacy must be public or private.'));
  }

  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name,
      description,
      privacy,
      creator_id: user.id,
      location: location || null,
      category: category || null,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !group?.id) redirect('/groups/new?error=' + enc(error?.message || 'Failed to create group'));

  const { error: memberErr } = await supabase
    .from('group_members')
    .upsert({
      group_id: group.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
    }, { onConflict: 'group_id,user_id' });

  if (memberErr) {
    redirect(`/groups/${group.id}?error=${enc(memberErr.message)}`);
  }

  redirect(`/groups/${group.id}?created=1`);
}

export async function joinPublicGroupAction(formData) {
  const auth = await getAuthed();
  if (auth.error === 'login') redirect('/login');
  if (auth.error) redirect('/groups?error=' + enc(auth.error));

  const { supabase, user } = auth;
  const groupId = String(formData.get('group_id') || '').trim();
  const next = String(formData.get('next') || '').trim() || '/groups';
  if (!groupId) redirect(next + '?error=' + enc('Missing group id'));

  const { data: group } = await supabase
    .from('groups')
    .select('id, privacy')
    .eq('id', groupId)
    .maybeSingle();

  if (!group) redirect(next + '?error=' + enc('Group not found'));
  if (group.privacy !== 'public') redirect(next + '?error=' + enc('This group requires approval'));

  const { error } = await supabase
    .from('group_members')
    .upsert({ group_id: groupId, user_id: user.id, role: 'member', status: 'active' }, { onConflict: 'group_id,user_id' });

  if (error) redirect(next + '?error=' + enc(error.message));

  await supabase
    .from('group_join_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .eq('status', 'pending');

  redirect(next + (next.includes('?') ? '&' : '?') + 'joined=1');
}

export async function requestGroupJoinAction(formData) {
  const auth = await getAuthed();
  if (auth.error === 'login') redirect('/login');
  if (auth.error) redirect('/groups?error=' + enc(auth.error));

  const { supabase, user } = auth;
  const groupId = String(formData.get('group_id') || '').trim();
  const next = String(formData.get('next') || '').trim() || '/groups';
  if (!groupId) redirect(next + '?error=' + enc('Missing group id'));

  const { data: group } = await supabase
    .from('groups')
    .select('id, privacy')
    .eq('id', groupId)
    .maybeSingle();

  if (!group) redirect(next + '?error=' + enc('Group not found'));
  if (group.privacy !== 'private') redirect(next + '?error=' + enc('This group is public. Join directly.'));

  const { data: existingMember } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (existingMember) redirect(next + (next.includes('?') ? '&' : '?') + 'joined=1');

  const { data: existingPending } = await supabase
    .from('group_join_requests')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingPending) redirect(next + (next.includes('?') ? '&' : '?') + 'requested=1');

  const { error } = await supabase
    .from('group_join_requests')
    .insert({ group_id: groupId, user_id: user.id, status: 'pending' });

  if (error) redirect(next + '?error=' + enc(error.message));

  redirect(next + (next.includes('?') ? '&' : '?') + 'requested=1');
}

export async function reviewGroupJoinRequestAction(formData) {
  const auth = await getAuthed();
  if (auth.error === 'login') redirect('/login');
  if (auth.error) redirect('/groups?error=' + enc(auth.error));

  const { supabase, user } = auth;
  const requestId = String(formData.get('request_id') || '').trim();
  const groupId = String(formData.get('group_id') || '').trim();
  const decision = String(formData.get('decision') || '').trim();

  if (!requestId || !groupId || !['approved', 'rejected'].includes(decision)) {
    redirect(`/groups/${groupId}?error=` + enc('Invalid review request'));
  }

  const { data: me } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('role', ['owner', 'admin'])
    .maybeSingle();

  if (!me) redirect(`/groups/${groupId}?error=` + enc('Only admins can review requests'));

  const { data: req, error: reqErr } = await supabase
    .from('group_join_requests')
    .select('id, user_id, status')
    .eq('id', requestId)
    .eq('group_id', groupId)
    .maybeSingle();

  if (reqErr || !req) redirect(`/groups/${groupId}?error=` + enc(reqErr?.message || 'Request not found'));
  if (req.status !== 'pending') redirect(`/groups/${groupId}?error=` + enc('Request already reviewed'));

  const { error: updateErr } = await supabase
    .from('group_join_requests')
    .update({ status: decision, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', requestId)
    .eq('status', 'pending');

  if (updateErr) redirect(`/groups/${groupId}?error=` + enc(updateErr.message));

  if (decision === 'approved') {
    const { error: memberErr } = await supabase
      .from('group_members')
      .upsert({ group_id: groupId, user_id: req.user_id, role: 'member', status: 'active' }, { onConflict: 'group_id,user_id' });
    if (memberErr) redirect(`/groups/${groupId}?error=` + enc(memberErr.message));
  }

  redirect(`/groups/${groupId}?reviewed=1`);
}

export async function updateGroupSettingsAction(formData) {
  const auth = await getAuthed();
  if (auth.error === 'login') redirect('/login');
  if (auth.error) redirect('/groups?error=' + enc(auth.error));

  const { supabase, user } = auth;
  const groupId = String(formData.get('group_id') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const privacy = String(formData.get('privacy') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const category = String(formData.get('category') || '').trim();

  if (!groupId) redirect('/groups?error=' + enc('Missing group id'));

  const { data: me } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('role', ['owner', 'admin'])
    .maybeSingle();

  if (!me) redirect(`/groups/${groupId}?error=` + enc('Only admins can edit this group'));

  if (!name || !description || !['public', 'private'].includes(privacy)) {
    redirect(`/groups/${groupId}?error=` + enc('Name, description, and privacy are required'));
  }

  const { error } = await supabase
    .from('groups')
    .update({
      name,
      description,
      privacy,
      location: location || null,
      category: category || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', groupId);

  if (error) redirect(`/groups/${groupId}?error=` + enc(error.message));

  redirect(`/groups/${groupId}?saved=1`);
}

export async function createGroupPostAction(formData) {
  const auth = await getAuthed();
  if (auth.error === 'login') redirect('/login');
  if (auth.error) redirect('/groups?error=' + enc(auth.error));

  const { supabase, user } = auth;
  const groupId = String(formData.get('group_id') || '').trim();
  const content = String(formData.get('content') || '').trim();

  if (!groupId || !content) redirect(`/groups/${groupId}?error=` + enc('Post content is required'));

  const { data: member } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!member) redirect(`/groups/${groupId}?error=` + enc('Only members can post in this group'));

  const { error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content,
      post_type: 'group',
      visibility: 'group',
      group_id: groupId,
      updated_at: new Date().toISOString(),
    });

  if (error) redirect(`/groups/${groupId}?error=` + enc(error.message));

  redirect(`/groups/${groupId}?posted=1`);
}
