export const runtime = 'edge';

'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

function enc(v) {
  return encodeURIComponent(v || 'Unexpected error');
}

export async function sendConnectionRequestAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/connections?error=' + enc('Supabase env not configured'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const toUserId = String(formData.get('to_user_id') || '').trim();
  if (!toUserId || toUserId === user.id) {
    redirect('/connections?error=' + enc('Pick a valid user.'));
  }

  const { error } = await supabase
    .from('connections')
    .upsert(
      {
        from_user_id: user.id,
        to_user_id: toUserId,
        status: 'pending',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'from_user_id,to_user_id' }
    );

  if (error) {
    redirect('/connections?error=' + enc(error.message));
  }

  redirect('/connections?sent=1');
}

export async function acceptConnectionRequestAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/home?error=' + enc('Supabase env not configured'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const fromUserId = String(formData.get('from_user_id') || '').trim();
  if (!fromUserId) redirect('/home?error=' + enc('Missing request id.'));

  const { error } = await supabase
    .from('connections')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', user.id)
    .eq('status', 'pending');

  if (error) redirect('/home?error=' + enc(error.message));

  redirect('/home?accepted=1');
}

export async function declineConnectionRequestAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/home?error=' + enc('Supabase env not configured'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const fromUserId = String(formData.get('from_user_id') || '').trim();
  if (!fromUserId) redirect('/home?error=' + enc('Missing request id.'));

  const { error } = await supabase
    .from('connections')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', user.id)
    .eq('status', 'pending');

  if (error) redirect('/home?error=' + enc(error.message));

  redirect('/home?declined=1');
}
