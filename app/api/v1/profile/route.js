import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { resolveApiClientUser } from '../../../../lib/apiAuth';

function unauthorized(message) {
  return NextResponse.json({ error: message || 'Unauthorized' }, { status: 401 });
}

function cleanArray(v) {
  return Array.isArray(v) ? v.map((x) => String(x || '').trim()).filter(Boolean) : [];
}

function normalizeSignal(sig, fallbackSource = 'explicit') {
  if (!sig || typeof sig !== 'object') return null;
  const tag = String(sig.tag || '').trim();
  if (!tag) return null;

  const confidenceNum = Number(sig.confidence);
  const confidence = Number.isFinite(confidenceNum)
    ? Math.max(0, Math.min(1, confidenceNum))
    : (fallbackSource === 'bot_training' || fallbackSource === 'guided_chat') ? 0.7 : 0.5;

  return {
    tag,
    confidence,
    source: String(sig.source || fallbackSource || 'explicit'),
    frequency: Math.max(1, Number(sig.frequency) || 1),
    last_seen: String(sig.last_seen || new Date().toISOString().split('T')[0]),
    cluster: sig.cluster ? String(sig.cluster).trim() : null,
  };
}

function convertToSignals(tags, source = 'explicit') {
  return cleanArray(tags).map((tag) => ({
    tag,
    confidence: source === 'explicit' ? 0.5 : 0.8,
    source,
    frequency: 1,
    last_seen: new Date().toISOString().split('T')[0],
    cluster: null,
  }));
}

function interestsFromSignals(signals) {
  return [...new Set((signals || []).map((s) => String(s?.tag || '').trim()).filter(Boolean))];
}

function clustersFromSignals(signals) {
  return [...new Set((signals || []).map((s) => String(s?.cluster || '').trim()).filter(Boolean))];
}

export async function GET(request) {
  const auth = await resolveApiClientUser(request);
  if (auth.status === 401) return unauthorized(auth.error);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status || 500 });

  const { supabase, userId } = auth;

  let profile = null;
  let error = null;
  {
    const resp = await supabase
      .from('profiles')
      .select('user_id, username, display_name, interests, goals, headline, city, updated_at, signals, onboarding_tier, clusters')
      .eq('user_id', userId)
      .maybeSingle();
    profile = resp.data;
    error = resp.error;
  }

  // Backward-compatible fallback if new columns are not migrated yet
  if (error && /signals|onboarding_tier|clusters/i.test(error.message || '')) {
    const fallback = await supabase
      .from('profiles')
      .select('user_id, username, display_name, interests, goals, headline, city, updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    profile = fallback.data;
    error = fallback.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const normalizedSignals = Array.isArray(profile?.signals)
    ? profile.signals.map((s) => normalizeSignal(s)).filter(Boolean)
    : convertToSignals(profile?.interests || [], 'explicit');

  const responseProfile = {
    ...(profile || {}),
    signals: normalizedSignals,
    interests: interestsFromSignals(normalizedSignals),
    onboarding_tier: profile?.onboarding_tier ?? 1,
    clusters: Array.isArray(profile?.clusters) ? profile.clusters : clustersFromSignals(normalizedSignals),
  };

  return NextResponse.json({ profile: responseProfile || null });
}

export async function POST(request) {
  const auth = await resolveApiClientUser(request);
  if (auth.status === 401) return unauthorized(auth.error);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status || 500 });

  const body = await request.json().catch(() => ({}));

  let incomingSignals = [];
  if (Array.isArray(body.signals) && body.signals.length > 0) {
    incomingSignals = body.signals
      .map((s) => normalizeSignal(s, String(s?.source || 'explicit')))
      .filter(Boolean);
  } else if (Array.isArray(body.interests)) {
    incomingSignals = convertToSignals(body.interests, 'explicit');
  }

  const { supabase, userId } = auth;

  let mergedSignals = [];
  if (incomingSignals.length > 0) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('signals')
      .eq('user_id', userId)
      .maybeSingle();

    const existingSignals = Array.isArray(existing?.signals)
      ? existing.signals.map((s) => normalizeSignal(s, String(s?.source || 'explicit'))).filter(Boolean)
      : [];

    mergedSignals = [...existingSignals];
    for (const newSig of incomingSignals) {
      const idx = mergedSignals.findIndex((s) => s.tag === newSig.tag);
      if (idx >= 0) {
        mergedSignals[idx] = {
          ...mergedSignals[idx],
          ...newSig,
          frequency: (Number(mergedSignals[idx]?.frequency) || 1) + 1,
          last_seen: newSig.last_seen || new Date().toISOString().split('T')[0],
        };
      } else {
        mergedSignals.push(newSig);
      }
    }
  }

  const goals = Array.isArray(body.goals) ? cleanArray(body.goals) : undefined;

  const payload = {
    signals: mergedSignals.length > 0 ? mergedSignals : undefined,
    interests: mergedSignals.length > 0 ? interestsFromSignals(mergedSignals) : (Array.isArray(body.interests) ? cleanArray(body.interests) : undefined),
    goals,
    headline: typeof body.headline === 'string' ? body.headline.trim() : undefined,
    city: typeof body.city === 'string' ? body.city.trim() : undefined,
    onboarding_tier: Number.isFinite(Number(body.onboarding_tier)) ? Number(body.onboarding_tier) : undefined,
    clusters: mergedSignals.length > 0 ? clustersFromSignals(mergedSignals) : undefined,
    updated_at: new Date().toISOString(),
  };

  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  if (Object.keys(payload).length === 1) {
    return NextResponse.json({ error: 'No valid profile fields provided' }, { status: 400 });
  }

  let updated = null;
  let error = null;

  {
    const resp = await supabase
      .from('profiles')
      .update(payload)
      .eq('user_id', userId)
      .select('user_id, interests, goals, headline, city, updated_at, signals, onboarding_tier, clusters')
      .maybeSingle();
    updated = resp.data;
    error = resp.error;
  }

  // Fallback if new columns not yet migrated
  if (error && /signals|onboarding_tier|clusters/i.test(error.message || '')) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.signals;
    delete fallbackPayload.onboarding_tier;
    delete fallbackPayload.clusters;

    const fallback = await supabase
      .from('profiles')
      .update(fallbackPayload)
      .eq('user_id', userId)
      .select('user_id, interests, goals, headline, city, updated_at')
      .maybeSingle();
    updated = fallback.data;
    error = fallback.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(body.intro_types)) {
    await supabase
      .from('intro_preferences')
      .upsert({
        user_id: userId,
        intro_types: cleanArray(body.intro_types),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
  }

  await supabase
    .from('bot_connections')
    .update({ status: 'connected', last_active: new Date().toISOString() })
    .eq('user_id', userId);

  const normalizedSignals = Array.isArray(updated?.signals)
    ? updated.signals.map((s) => normalizeSignal(s)).filter(Boolean)
    : convertToSignals(updated?.interests || [], 'explicit');

  return NextResponse.json({
    profile: {
      ...(updated || {}),
      signals: normalizedSignals,
      interests: interestsFromSignals(normalizedSignals),
      onboarding_tier: updated?.onboarding_tier ?? payload.onboarding_tier ?? 1,
      clusters: Array.isArray(updated?.clusters) ? updated.clusters : clustersFromSignals(normalizedSignals),
    } || null,
  });
}
