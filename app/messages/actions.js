export const runtime = 'edge';

'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

function enc(v) {
  return encodeURIComponent(v || 'Unexpected error');
}

export async function createConversationAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/messages?error=' + enc('Supabase env not configured'));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const otherUserId = String(formData.get('other_user_id') || '').trim();
  if (!otherUserId || otherUserId === user.id) {
    redirect('/messages?error=' + enc('Pick a valid user to start conversation.'));
  }

  const { data: convo, error: convoErr } = await supabase
    .from('conversations')
    .insert({})
    .select('id')
    .single();

  if (convoErr || !convo) {
    redirect('/messages?error=' + enc(convoErr?.message || 'Failed to create conversation'));
  }

  const { error: selfMemberErr } = await supabase
    .from('conversation_members')
    .insert({ conversation_id: convo.id, user_id: user.id });

  if (selfMemberErr) {
    redirect('/messages?error=' + enc(selfMemberErr.message));
  }

  const { error: otherMemberErr } = await supabase
    .from('conversation_members')
    .insert({ conversation_id: convo.id, user_id: otherUserId });

  if (otherMemberErr) {
    redirect('/messages?error=' + enc(otherMemberErr.message));
  }

  redirect(`/messages?c=${convo.id}`);
}

export async function sendMessageAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/messages?error=' + enc('Supabase env not configured'));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const conversationId = Number(formData.get('conversation_id'));
  const body = String(formData.get('message_body') || '').trim();
  if (!conversationId || !body) {
    redirect('/messages?error=' + enc('Conversation and message are required.'));
  }

  const { data: member, error: memberErr } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberErr || !member) {
    redirect('/messages?error=' + enc('You do not have access to this conversation.'));
  }

  const { error: msgErr } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  });

  if (msgErr) {
    redirect(`/messages?c=${conversationId}&error=${enc(msgErr.message)}`);
  }

  redirect(`/messages?c=${conversationId}`);
}
