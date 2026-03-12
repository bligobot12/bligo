function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

function splitQuery(query) {
  return String(query || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function buildMatchReason(profile, queryWords, matchPct, tier) {
  const reasons = [];
  const signals = normalizeList(profile.signals).map((s) => String(s?.tag || '').toLowerCase());
  const shared = queryWords.filter((w) => signals.some((t) => t.includes(w) || w.includes(t)));

  if (shared.length > 0) reasons.push('strong skills overlap');
  if (profile.city) reasons.push(`nearby in ${profile.city}`);
  if (tier === 'first' || tier === 'second') reasons.push('in your trusted network');
  if (matchPct >= 70) reasons.push('active with matching interests');
  if (reasons.length === 0) return 'matches your profile';
  return reasons.slice(0, 2).join(' · ');
}

function scoreProfile(profile, queryWords) {
  let score = 0;
  const signals = normalizeList(profile.signals);
  const interests = normalizeList(profile.interests);

  for (const signal of signals) {
    const tag = String(signal?.tag || '').toLowerCase();
    const cluster = String(signal?.cluster || '').toLowerCase();
    const confidence = Number(signal?.confidence) || 0.5;

    for (const word of queryWords) {
      if (!word) continue;
      if (tag && (tag.includes(word) || word.includes(tag))) score += confidence;
      if (cluster && cluster.includes(word)) score += confidence * 0.5;
    }
  }

  for (const interest of interests) {
    const i = String(interest || '').toLowerCase();
    for (const word of queryWords) {
      if (!word) continue;
      if (i.includes(word) || word.includes(i)) score += 0.3;
    }
  }

  const headline = String(profile.headline || '').toLowerCase();
  for (const word of queryWords) {
    if (headline.includes(word)) score += 0.4;
  }

  return Math.min(score, 1);
}

export async function performSearchForUser(supabase, userId, rawQuery) {
  const query = String(rawQuery || '').trim().toLowerCase();
  if (!query) return { error: 'Empty query' };

  const queryWords = splitQuery(query);

  const { data: profileRows } = await supabase
    .from('profiles')
    .select('user_id, display_name, headline, city, signals, interests')
    .eq('onboarding_complete', true)
    .neq('user_id', userId);

  const allProfiles = profileRows || [];

  const { data: connectionRows } = await supabase
    .from('connections')
    .select('from_user_id, to_user_id')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .eq('status', 'accepted');

  const directConnectionIds = new Set(
    (connectionRows || []).map((c) => (c.from_user_id === userId ? c.to_user_id : c.from_user_id))
  );

  const results = { first: [], second: [], third: [] };

  let friendConnections = [];
  if (directConnectionIds.size > 0) {
    const direct = Array.from(directConnectionIds);
    const orParts = direct.flatMap((id) => [`from_user_id.eq.${id}`, `to_user_id.eq.${id}`]);
    const { data } = await supabase
      .from('connections')
      .select('from_user_id, to_user_id')
      .or(orParts.join(','))
      .eq('status', 'accepted');
    friendConnections = data || [];
  }

  const secondTierIds = new Set();
  const connectionPathMap = {};

  for (const conn of friendConnections) {
    const fromDirect = directConnectionIds.has(conn.from_user_id);
    const toDirect = directConnectionIds.has(conn.to_user_id);

    let friendId = null;
    let viaId = null;
    if (fromDirect && conn.to_user_id !== userId) {
      friendId = conn.to_user_id;
      viaId = conn.from_user_id;
    } else if (toDirect && conn.from_user_id !== userId) {
      friendId = conn.from_user_id;
      viaId = conn.to_user_id;
    }

    if (friendId && !directConnectionIds.has(friendId) && friendId !== userId) {
      secondTierIds.add(friendId);
      if (!connectionPathMap[friendId]) connectionPathMap[friendId] = viaId;
    }
  }

  for (const profile of allProfiles) {
    const rawScore = scoreProfile(profile, queryWords);
    if (rawScore <= 0) continue;

    const basePct = Math.round(rawScore * 100);
    const entry = {
      user_id: profile.user_id,
      display_name: profile.display_name,
      headline: profile.headline,
      city: profile.city,
      match_pct: basePct,
      via: connectionPathMap[profile.user_id] || null,
    };

    if (directConnectionIds.has(profile.user_id)) {
      entry.match_reason = buildMatchReason(profile, queryWords, entry.match_pct, 'first');
      results.first.push(entry);
    } else if (secondTierIds.has(profile.user_id)) {
      entry.match_pct = Math.round(basePct * 0.85);
      entry.match_reason = buildMatchReason(profile, queryWords, entry.match_pct, 'second');
      results.second.push(entry);
    } else {
      entry.match_pct = Math.round(basePct * 0.65);
      entry.match_reason = buildMatchReason(profile, queryWords, entry.match_pct, 'third');
      results.third.push(entry);
    }
  }

  results.first.sort((a, b) => b.match_pct - a.match_pct);
  results.second.sort((a, b) => b.match_pct - a.match_pct);
  results.third.sort((a, b) => b.match_pct - a.match_pct);

  const payload = { user_id: userId, query, results };
  const { error: insertError, data: inserted } = await supabase
    .from('searches')
    .insert(payload)
    .select('id')
    .maybeSingle();

  if (insertError) return { error: insertError.message };

  return { query, results, searchId: inserted?.id || null };
}
