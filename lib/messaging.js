export async function getConversationStatus(supabase, currentUserId, otherUserId) {
  const { data: conn } = await supabase
    .from('connections')
    .select('id')
    .or(`and(from_user_id.eq.${currentUserId},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${currentUserId})`)
    .eq('status', 'accepted')
    .maybeSingle();

  if (conn) return 'inbox';

  const { data: reply } = await supabase
    .from('messages')
    .select('id')
    .eq('from_user_id', currentUserId)
    .eq('to_user_id', otherUserId)
    .limit(1)
    .maybeSingle();

  if (reply) return 'inbox';

  return 'requests';
}
