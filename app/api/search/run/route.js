import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { createAdminClient } from '../../../../lib/supabase/admin';

const INTENT_WEIGHTS = {
  trade_service: { location: 40, skills: 30, trust: 15, posts: 10, recency: 5 },
  investment: { location: 5, skills: 35, trust: 25, posts: 25, recency: 10 },
  advisory: { location: 0, skills: 40, trust: 30, posts: 20, recency: 10 },
  partnership: { location: 10, skills: 30, trust: 30, posts: 20, recency: 10 },
  virtual_service: { location: 0, skills: 45, trust: 25, posts: 20, recency: 10 },
  vendor_supplier: { location: 20, skills: 35, trust: 20, posts: 15, recency: 10 },
};

function buildMatchReason(candidate, scoreBreakdown) {
  const reasons = [];
  if ((scoreBreakdown?.skills ?? 0) > 10) reasons.push('strong skills overlap');
  if ((scoreBreakdown?.location ?? 0) > 10) reasons.push(`nearby in ${candidate.location_city || candidate.city || 'your area'}`);
  if ((scoreBreakdown?.trust ?? 0) > 10) reasons.push('in your trusted network');
  if ((scoreBreakdown?.posts ?? 0) > 10) reasons.push('active with matching interests');
  if (candidate.reason_why_now) reasons.push(candidate.reason_why_now);
  if (reasons.length === 0) return 'matches your profile';
  return reasons.slice(0, 2).join(' · ');
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json().catch(() => ({}));
  const {
    query = '',
    intent_type = 'trade_service',
    intent_tags = [],
    location = '',
    max_results = 20,
  } = body;
  const weights = INTENT_WEIGHTS[intent_type] || INTENT_WEIGHTS.trade_service;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 });

  const { data: profiles } = await admin
    .from('profiles')
    .select('user_id, display_name, first_name, last_name, specialty, skills, signals, job_title, industry, location_city, location_state, city, last_seen_notifications, interests, avatar_url, headline')
    .neq('user_id', userId);

  const { data: myConns } = await admin
    .from('connections')
    .select('from_user_id, to_user_id')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .eq('status', 'accepted');

  const friendIds = new Set((myConns || []).map((c) =>
    c.from_user_id === userId ? c.to_user_id : c.from_user_id
  ));

  const { data: fofConns } = friendIds.size
    ? await admin
        .from('connections')
        .select('from_user_id, to_user_id')
        .in('from_user_id', [...friendIds])
        .eq('status', 'accepted')
    : { data: [] };

  const fofIds = new Set((fofConns || []).flatMap((c) =>
    [c.from_user_id, c.to_user_id].filter((id) => id !== userId && !friendIds.has(id))
  ));

  const { data: recentPosts } = await admin
    .from('posts')
    .select('user_id, content')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(500);

  const postsByUser = {};
  for (const p of recentPosts || []) {
    if (!postsByUser[p.user_id]) postsByUser[p.user_id] = [];
    postsByUser[p.user_id].push(String(p.content || '').toLowerCase());
  }

  const intentLower = (intent_tags || []).map((t) => String(t || '').toLowerCase());
  const locationLower = String(location || '').toLowerCase();
  const queryLower = String(query || '').toLowerCase();
  const results = [];

  for (const profile of profiles || []) {
    const profileTags = [
      ...(profile.specialty || []),
      ...(profile.skills || []),
      ...((profile.signals || []).map((s) => s.tag)),
      ...(profile.interests || []),
      profile.job_title,
      profile.industry,
    ].filter(Boolean).map((t) => String(t).toLowerCase());

    const tagMatches = intentLower.filter((t) =>
      profileTags.some((pt) => pt.includes(t) || t.includes(pt))
    ).length;
    const skillScore = Math.min(weights.skills, tagMatches * (weights.skills / 3));

    const userPosts = postsByUser[profile.user_id] || [];
    const postMatch = userPosts.some((p) =>
      intentLower.some((t) => p.includes(t)) || (queryLower && p.includes(queryLower))
    );
    const postScore = postMatch ? weights.posts : 0;

    const trustScore = friendIds.has(profile.user_id)
      ? weights.trust
      : fofIds.has(profile.user_id)
        ? Math.round(weights.trust * 0.6)
        : 0;

    const profileCity = String(profile.location_city || profile.city || '').toLowerCase();
    const profileState = String(profile.location_state || '').toLowerCase();
    const locationScore = weights.location === 0
      ? 0
      : locationLower && profileCity.includes(locationLower)
        ? weights.location
        : locationLower && profileState.includes(locationLower)
          ? Math.round(weights.location * 0.5)
          : 0;

    const lastSeen = profile.last_seen_notifications ? new Date(profile.last_seen_notifications) : null;
    const daysSince = lastSeen ? (Date.now() - lastSeen.getTime()) / 86400000 : 999;
    const recencyScore = daysSince < 7 ? weights.recency : daysSince < 30 ? Math.round(weights.recency * 0.5) : 0;

    const total = Math.round(skillScore + postScore + trustScore + locationScore + recencyScore);
    if (total < 15) continue;

    const name = profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown';
    const degree = friendIds.has(profile.user_id) ? 1 : fofIds.has(profile.user_id) ? 2 : null;

    const why = [
      tagMatches > 0 && `${tagMatches} skill match${tagMatches > 1 ? 'es' : ''}`,
      postScore > 0 && 'relevant posts',
      degree === 1 && '1st degree',
      degree === 2 && '2nd degree',
      locationScore > 0 && 'nearby',
    ].filter(Boolean).join(' · ');

    results.push({
      user_id: profile.user_id,
      display_name: name,
      avatar_url: profile.avatar_url,
      specialty: profile.specialty || [],
      job_title: profile.job_title,
      headline: profile.headline,
      score: total,
      score_breakdown: {
        skills: Math.round(skillScore),
        posts: postScore,
        trust: trustScore,
        location: locationScore,
        recency: recencyScore,
      },
      why,
      match_reason: buildMatchReason(profile, {
        skills: Math.round(skillScore),
        posts: postScore,
        trust: trustScore,
        location: locationScore,
        recency: recencyScore,
      }),
      degree,
    });
  }

  results.sort((a, b) => b.score - a.score);
  const top = results.slice(0, max_results);

  await admin.from('searches').insert({
    user_id: userId,
    query,
    results: top,
    structured_intent: { intent_tags, location, intent_type },
  });

  return NextResponse.json({ results: top, total: top.length });
}
