function normalizeTextArray(values) {
  return (values || [])
    .map((v) => String(v || '').trim().toLowerCase())
    .filter(Boolean);
}

function intersection(a, b) {
  const setB = new Set(b);
  return [...new Set(a)].filter((item) => setB.has(item));
}

function normalizeCity(v) {
  return String(v || '').trim().toLowerCase();
}

function buildRuleBasedReason(displayName, sharedInterests, sharedGoals, sameCity, mutualConnections) {
  const reasonParts = [];
  if (sharedInterests.length) reasonParts.push(`you both care about ${sharedInterests.slice(0, 2).join(' and ')}`);
  if (sharedGoals.length) reasonParts.push(`you share goals like ${sharedGoals.slice(0, 2).join(' and ')}`);
  if (sameCity) reasonParts.push('you are in the same city');
  if (mutualConnections.length) reasonParts.push(`you have ${mutualConnections.length} mutual connection${mutualConnections.length > 1 ? 's' : ''}`);
  return reasonParts.length > 0
    ? `You should meet ${displayName} now because ${reasonParts.join(', ')}.`
    : `You should meet ${displayName} now based on overlapping profile signals.`;
}

export async function runMatchingForUser(supabase, currentUserId) {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, display_name, city, interests, goals')
    .not('user_id', 'is', null)
    .neq('user_id', currentUserId);
  if (profilesError) return { ok: false, error: profilesError.message };

  const { data: me, error: meError } = await supabase
    .from('profiles')
    .select('user_id, display_name, city, interests, goals')
    .eq('user_id', currentUserId)
    .maybeSingle();
  if (meError) return { ok: false, error: meError.message };
  if (!me) return { ok: false, error: 'Current user profile not found' };

  const { data: connections, error: connectionsError } = await supabase
    .from('connections')
    .select('from_user_id, to_user_id, status')
    .eq('status', 'accepted');
  if (connectionsError) return { ok: false, error: connectionsError.message };

  const neighbors = new Map();
  const directSet = new Set();
  for (const row of connections || []) {
    if (!neighbors.has(row.from_user_id)) neighbors.set(row.from_user_id, new Set());
    if (!neighbors.has(row.to_user_id)) neighbors.set(row.to_user_id, new Set());
    neighbors.get(row.from_user_id).add(row.to_user_id);
    neighbors.get(row.to_user_id).add(row.from_user_id);
    directSet.add(`${row.from_user_id}:${row.to_user_id}`);
    directSet.add(`${row.to_user_id}:${row.from_user_id}`);
  }

  const myInterests = normalizeTextArray(me.interests);
  const myGoals = normalizeTextArray(me.goals);
  const myCity = normalizeCity(me.city);
  const myNeighbors = neighbors.get(currentUserId) || new Set();

  const scored = [];
  for (const other of profiles || []) {
    if (!other?.user_id || other.user_id === currentUserId) continue;

    const otherInterests = normalizeTextArray(other.interests);
    const otherGoals = normalizeTextArray(other.goals);
    const sharedInterests = intersection(myInterests, otherInterests);
    const sharedGoals = intersection(myGoals, otherGoals);
    const sameCity = myCity && myCity === normalizeCity(other.city);

    const otherNeighbors = neighbors.get(other.user_id) || new Set();
    const mutualConnections = [...myNeighbors].filter((id) => otherNeighbors.has(id));

    const interestsScore = sharedInterests.length > 0
      ? Math.min(1, sharedInterests.length / Math.min(myInterests.length, otherInterests.length))
      : 0;
    const goalsScore = sharedGoals.length / Math.max(1, myGoals.length, otherGoals.length);
    const sameCityScore = sameCity ? 1 : 0;
    const mutualScore = mutualConnections.length / Math.max(1, myNeighbors.size, otherNeighbors.size);

    const score = Number(
      Math.max(0, Math.min(1, interestsScore * 0.3 + goalsScore * 0.25 + sameCityScore * 0.2 + mutualScore * 0.25)).toFixed(4)
    );
    if (score < 0.1) continue;

    const displayName = other.display_name || 'this person';
    const reasonWhyNow = buildRuleBasedReason(displayName, sharedInterests, sharedGoals, sameCity, mutualConnections);

    const isDirect = directSet.has(`${currentUserId}:${other.user_id}`);
    const reasonTrustPath = isDirect
      ? 'Direct connection'
      : mutualConnections.length > 0
        ? 'Friend of a friend'
        : 'Shared interests';

    scored.push({
      user_a_id: currentUserId,
      user_b_id: other.user_id,
      score,
      reason_why_now: reasonWhyNow,
      reason_trust_path: reasonTrustPath,
      shared_signals: { interests: sharedInterests, goals: sharedGoals, same_city: !!sameCity },
      status: 'pending',
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);

  const { error: clearSelfError } = await supabase
    .from('match_candidates')
    .delete()
    .eq('user_a_id', currentUserId)
    .eq('user_b_id', currentUserId);
  if (clearSelfError) return { ok: false, error: clearSelfError.message };

  const { error: clearError } = await supabase.from('match_candidates').delete().eq('user_a_id', currentUserId);
  if (clearError) return { ok: false, error: clearError.message };

  if (top.length > 0) {
    const { error: insertError } = await supabase.from('match_candidates').upsert(top, { onConflict: 'user_a_id,user_b_id' });
    if (insertError) return { ok: false, error: insertError.message };
  }

  return { ok: true, count: top.length };
}
