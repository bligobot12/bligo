'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { runMatchingForUser } from '../../lib/matching/runMatchingForUser';

function enc(v) {
  return encodeURIComponent(v || 'Unexpected error');
}

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
    ? `You should meet ${displayName} now because ${reasonParts.join(', ')}. [rule-based]`
    : `You should meet ${displayName} now based on overlapping profile signals. [rule-based]`;
}

async function generateReasonWhyNow({ displayName, me, other, sharedInterests, sharedGoals, sameCity, mutualConnections }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const fallback = buildRuleBasedReason(displayName, sharedInterests, sharedGoals, sameCity, mutualConnections);

  if (!apiKey) return `${fallback} [ai: unavailable - missing ANTHROPIC_API_KEY]`;

  const prompt = [
    'Write one concise, warm reason for why these two people should be introduced now.',
    'Keep it specific, practical, and under 150 tokens.',
    'Do not mention scores or internal model logic.',
    `Person A: ${me.display_name || 'Unknown'}, city=${me.city || 'unknown'}, interests=${(me.interests || []).join(', ') || 'none'}, goals=${(me.goals || []).join(', ') || 'none'}`,
    `Person B: ${displayName}, city=${other.city || 'unknown'}, interests=${(other.interests || []).join(', ') || 'none'}, goals=${(other.goals || []).join(', ') || 'none'}`,
    `Shared interests: ${sharedInterests.join(', ') || 'none'}`,
    `Shared goals: ${sharedGoals.join(', ') || 'none'}`,
    `Same city: ${sameCity ? 'yes' : 'no'}`,
    `Mutual connections: ${mutualConnections.length}`,
  ].join('\n');

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.warn('[matching] anthropic error', resp.status, body);
      return `${fallback} [ai: fallback - api error]`;
    }

    const data = await resp.json();
    const text = data?.content?.find((c) => c?.type === 'text')?.text?.trim();
    if (!text) return `${fallback} [ai: fallback - empty response]`;
    return `${text} [ai: claude-sonnet-4-20250514]`;
  } catch (error) {
    console.warn('[matching] anthropic request failed', error);
    return `${fallback} [ai: fallback - request failed]`;
  }
}

export async function generateMatchCandidatesAction() {
  console.log('[matching] generate start');
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: 'Supabase env not configured' };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return { ok: false, error: 'Not authenticated' };

  const result = await runMatchingForUser(supabase, user.id);
  if (!result?.ok) return { ok: false, error: result?.error || 'Matching failed' };

  console.log('[matching] generated', result.count);
  return { ok: true, count: result.count };
}

export async function runMatchingNowAction() {
  const result = await generateMatchCandidatesAction();
  if (!result?.ok) {
    redirect('/home?error=' + enc(result?.error || 'Matching failed'));
  }
  redirect('/home?matched=1&match_count=' + encodeURIComponent(String(result.count || 0)));
}

export async function respondToIntroAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/home?error=' + enc('Supabase env not configured'));

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect('/login');

  const matchCandidateId = String(formData.get('match_candidate_id') || '').trim();
  const response = String(formData.get('response') || '').trim().toLowerCase();

  if (!matchCandidateId || !['accept', 'decline'].includes(response)) {
    redirect('/home?error=' + enc('Invalid intro response payload.'));
  }

  const { data: candidate, error: candidateError } = await supabase
    .from('match_candidates')
    .select('id, user_a_id, user_b_id, status')
    .eq('id', matchCandidateId)
    .eq('user_a_id', user.id)
    .maybeSingle();

  if (candidateError || !candidate) {
    redirect('/home?error=' + enc(candidateError?.message || 'Match candidate not found.'));
  }

  // Check if response already exists
  const { data: existing } = await supabase
    .from('intro_responses')
    .select('id')
    .eq('match_candidate_id', matchCandidateId)
    .eq('responding_user_id', user.id)
    .maybeSingle();

  const { error: responseError } = existing
    ? await supabase.from('intro_responses').update({ response }).eq('id', existing.id)
    : await supabase.from('intro_responses').insert({ match_candidate_id: matchCandidateId, responding_user_id: user.id, response });

  if (responseError) {
    redirect('/home?error=' + enc(responseError.message));
  }

  const nextStatus = response === 'accept' ? 'accepted' : 'declined';
  const { error: statusError } = await supabase
    .from('match_candidates')
    .update({ status: nextStatus })
    .eq('id', matchCandidateId)
    .eq('user_a_id', user.id);

  if (statusError) {
    redirect('/home?error=' + enc(statusError.message));
  }

  if (response === 'accept') {
    const now = new Date().toISOString();

    const { error: c1Error } = await supabase.from('connections').upsert(
      {
        from_user_id: candidate.user_a_id,
        to_user_id: candidate.user_b_id,
        status: 'accepted',
        updated_at: now,
      },
      { onConflict: 'from_user_id,to_user_id' }
    );
    if (c1Error) redirect('/home?error=' + enc(c1Error.message));

    const { error: c2Error } = await supabase.from('connections').upsert(
      {
        from_user_id: candidate.user_b_id,
        to_user_id: candidate.user_a_id,
        status: 'accepted',
        updated_at: now,
      },
      { onConflict: 'from_user_id,to_user_id' }
    );
    if (c2Error) redirect('/home?error=' + enc(c2Error.message));
  }

  redirect('/home?responded=1');
}
