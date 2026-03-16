function normalizeTextArray(values) {
  return (values || [])
    .map((v) => String(v || '').trim().toLowerCase())
    .filter(Boolean);
}

function normalizeCity(v) {
  return String(v || '').trim().toLowerCase();
}

function normalizeSignalArray(signals) {
  if (!Array.isArray(signals)) return [];
  return signals
    .map((s) => ({
      tag: String(s?.tag || '').trim().toLowerCase(),
      confidence: Math.max(0, Math.min(1, Number(s?.confidence) || 0)),
      cluster: s?.cluster ? String(s.cluster).trim().toLowerCase() : null,
    }))
    .filter((s) => s.tag);
}

function scoreSignalMatch(userASignals, userBSignals) {
  let score = 0;
  const matches = [];

  for (const sigA of userASignals) {
    for (const sigB of userBSignals) {
      if (sigA.tag === sigB.tag) {
        const weight = (sigA.confidence + sigB.confidence) / 2;
        score += weight * 0.5;
        matches.push({ type: 'tag', tag: sigA.tag, weight: Number(weight.toFixed(4)) });
        continue;
      }

      if (sigA.cluster && sigB.cluster && sigA.cluster === sigB.cluster) {
        const weight = (sigA.confidence + sigB.confidence) / 2;
        score += weight * 0.25;
        matches.push({ type: 'cluster', tag: `${sigA.cluster} domain`, weight: Number(weight.toFixed(4)) });
      }
    }
  }

  return {
    score: Number(Math.min(score / 3, 1).toFixed(4)),
    matches,
  };
}

function scoreLegacyMatch(me, other, myNeighbors, otherNeighbors) {
  const myInterests = normalizeTextArray(me.interests);
  const myGoals = normalizeTextArray(me.goals);
  const otherInterests = normalizeTextArray(other.interests);
  const otherGoals = normalizeTextArray(other.goals);

  const sharedInterests = [...new Set(myInterests.filter((v) => otherInterests.includes(v)))];
  const sharedGoals = [...new Set(myGoals.filter((v) => otherGoals.includes(v)))];
  const sameCity = normalizeCity(me.city) && normalizeCity(me.city) === normalizeCity(other.city);
  const mutualConnections = [...myNeighbors].filter((id) => otherNeighbors.has(id));

  const interestsScore = sharedInterests.length > 0
    ? Math.min(1, sharedInterests.length / Math.max(1, Math.min(myInterests.length, otherInterests.length)))
    : 0;
  const goalsScore = sharedGoals.length / Math.max(1, myGoals.length, otherGoals.length);
  const sameCityScore = sameCity ? 1 : 0;
  const mutualScore = mutualConnections.length / Math.max(1, myNeighbors.size, otherNeighbors.size);

  const score = Number(
    Math.max(0, Math.min(1, interestsScore * 0.3 + goalsScore * 0.25 + sameCityScore * 0.2 + mutualScore * 0.25)).toFixed(4)
  );

  return {
    score,
    sharedInterests,
    sharedGoals,
    sameCity,
    mutualConnections,
    breakdown: {
      mode: 'legacy',
      interestsScore,
      goalsScore,
      sameCityScore,
      mutualScore,
    },
  };
}

function buildReason(displayName, details) {
  if (details?.mode === 'signals' && Array.isArray(details.matches) && details.matches.length > 0) {
    const top = details.matches.slice(0, 3).map((m) => m.tag).join(', ');
    return `You should meet ${displayName} now because your expertise signals align (${top}).`;
  }

  const reasonParts = [];
  if (details?.sharedInterests?.length) reasonParts.push(`you both care about ${details.sharedInterests.slice(0, 2).join(' and ')}`);
  if (details?.sharedGoals?.length) reasonParts.push(`you share goals like ${details.sharedGoals.slice(0, 2).join(' and ')}`);
  if (details?.sameCity) reasonParts.push('you are in the same city');
  if (details?.mutualConnections?.length) reasonParts.push(`you have ${details.mutualConnections.length} mutual connection${details.mutualConnections.length > 1 ? 's' : ''}`);
  return reasonParts.length > 0
    ? `You should meet ${displayName} now because ${reasonParts.join(', ')}.`
    : `You should meet ${displayName} now based on overlapping profile signals.`;
}

export async function runMatchingForUser(supabase, currentUserId) {
  let profiles = null;
  let me = null;

  {
    const p = await supabase
      .from('profiles')
      .select('user_id, display_name, city, interests, goals, signals, clusters')
      .not('user_id', 'is', null)
      .neq('user_id', currentUserId);
    if (p.error && /signals|clusters/i.test(p.error.message || '')) {
      const fallback = await supabase
        .from('profiles')
        .select('user_id, display_name, city, interests, goals')
        .not('user_id', 'is', null)
        .neq('user_id', currentUserId);
      if (fallback.error) return { ok: false, error: fallback.error.message };
      profiles = fallback.data;
    } else if (p.error) {
      return { ok: false, error: p.error.message };
    } else {
      profiles = p.data;
    }
  }

  {
    const m = await supabase
      .from('profiles')
      .select('user_id, display_name, city, interests, goals, signals, clusters')
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (m.error && /signals|clusters/i.test(m.error.message || '')) {
      const fallback = await supabase
        .from('profiles')
        .select('user_id, display_name, city, interests, goals')
        .eq('user_id', currentUserId)
        .maybeSingle();
      if (fallback.error) return { ok: false, error: fallback.error.message };
      me = fallback.data;
    } else if (m.error) {
      return { ok: false, error: m.error.message };
    } else {
      me = m.data;
    }
  }

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

  const myNeighbors = neighbors.get(currentUserId) || new Set();
  const mySignals = normalizeSignalArray(me.signals);

  const scored = [];
  for (const other of profiles || []) {
    if (!other?.user_id || other.user_id === currentUserId) continue;

    const otherNeighbors = neighbors.get(other.user_id) || new Set();
    const otherSignals = normalizeSignalArray(other.signals);

    let score = 0;
    let details = null;

    if (mySignals.length > 0 && otherSignals.length > 0) {
      const signalResult = scoreSignalMatch(mySignals, otherSignals);
      score = signalResult.score;
      details = { mode: 'signals', matches: signalResult.matches };
    } else {
      const legacy = scoreLegacyMatch(me, other, myNeighbors, otherNeighbors);
      score = legacy.score;
      details = legacy;
    }

    // Bidirectional scoring: also score from the other person's perspective
    let reverseScore = 0;
    if (otherSignals.length > 0 && mySignals.length > 0) {
      reverseScore = scoreSignalMatch(otherSignals, mySignals).score;
    } else {
      reverseScore = scoreLegacyMatch(other, me, otherNeighbors, myNeighbors).score;
    }
    // Mutual need: geometric mean of both directions
    const mutualScore = Math.sqrt(score * reverseScore);

    // Why Now bonus: boost recent activity (posts or signal updates in last 7 days)
    let whyNowBonus = 0;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const sig of otherSignals) {
      if (sig.updated_at && new Date(sig.updated_at).getTime() > sevenDaysAgo) {
        whyNowBonus = 0.1;
        break;
      }
    }

    // Final score: 70% mutual need + 30% forward score + why now bonus (capped at 1)
    score = Number(Math.min(1, mutualScore * 0.7 + score * 0.3 + whyNowBonus).toFixed(4));
    if (details) {
      details.mutualScore = Number(mutualScore.toFixed(4));
      details.whyNowBonus = whyNowBonus;
    }

    if (score < 0.1) continue;

    const displayName = other.display_name || 'this person';
    const reasonWhyNow = buildReason(displayName, details);

    const isDirect = directSet.has(`${currentUserId}:${other.user_id}`);
    const mutualConnections = [...myNeighbors].filter((id) => otherNeighbors.has(id));
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
      shared_signals: details?.mode === 'signals'
        ? { matched: details.matches.map((m) => m.tag) }
        : {
            interests: details.sharedInterests || [],
            goals: details.sharedGoals || [],
            same_city: !!details.sameCity,
          },
      score_breakdown: details,
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
    let insertError = null;
    {
      const resp = await supabase.from('match_candidates').upsert(top, { onConflict: 'user_a_id,user_b_id' });
      insertError = resp.error;
    }

    // fallback if score_breakdown column doesn't exist yet
    if (insertError && /score_breakdown/i.test(insertError.message || '')) {
      const fallbackTop = top.map(({ score_breakdown, ...rest }) => rest);
      const fallback = await supabase.from('match_candidates').upsert(fallbackTop, { onConflict: 'user_a_id,user_b_id' });
      insertError = fallback.error;
    }

    if (insertError) return { ok: false, error: insertError.message };
  }

  return { ok: true, count: top.length };
}
