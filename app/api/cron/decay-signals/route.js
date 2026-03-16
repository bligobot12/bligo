import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase/admin';

const CRON_SECRET = process.env.CRON_SECRET;
const DECAY_FACTOR = 0.95; // 5% decay per run
const MIN_CONFIDENCE = 0.05; // Remove signals below this threshold

export async function GET(request) {
  // Protect endpoint with secret
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');
  const provided = authHeader?.replace('Bearer ', '') || secretParam;

  if (!CRON_SECRET || provided !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 });
  }

  // Fetch all profiles with signals
  const { data: profiles, error: fetchError } = await admin
    .from('profiles')
    .select('user_id, signals')
    .not('signals', 'is', null);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  let updated = 0;
  let removed = 0;

  for (const profile of profiles || []) {
    if (!Array.isArray(profile.signals) || profile.signals.length === 0) continue;

    const decayed = [];
    for (const signal of profile.signals) {
      const conf = Number(signal.confidence || 0) * DECAY_FACTOR;
      if (conf >= MIN_CONFIDENCE) {
        decayed.push({ ...signal, confidence: Number(conf.toFixed(4)) });
      } else {
        removed++;
      }
    }

    // Only update if something changed
    if (decayed.length !== profile.signals.length || decayed.some((s, i) => s.confidence !== profile.signals[i].confidence)) {
      const { error } = await admin
        .from('profiles')
        .update({ signals: decayed })
        .eq('user_id', profile.user_id);

      if (!error) updated++;
    }
  }

  return NextResponse.json({
    ok: true,
    profiles_updated: updated,
    signals_removed: removed,
    decay_factor: DECAY_FACTOR,
  });
}
