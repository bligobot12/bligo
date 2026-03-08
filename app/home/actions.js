'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

function cleanUsername(v) {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function saveProfileBasicsAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/onboarding?error=' + encodeURIComponent('Supabase env not configured.'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const username = cleanUsername(formData.get('username')) || `user_${user.id.slice(0, 8)}`;
  const displayName = String(formData.get('display_name') || '').trim();
  const headline = String(formData.get('headline') || '').trim();
  const city = String(formData.get('city') || '').trim();
  const interests = parseList(formData.get('interests'));
  const goals = parseList(formData.get('goals'));
  const visibilityRaw = String(formData.get('visibility') || 'connections').trim();
  const visibility = visibilityRaw || 'connections';

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    user_id: user.id,
    username,
    display_name: displayName || null,
    headline: headline || null,
    city: city || null,
    interests,
    goals,
    visibility,
    onboarding_complete: false,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect('/onboarding?error=' + encodeURIComponent(error.message));
  }

  redirect('/onboarding?step=2');
}

export async function saveIntroPreferencesAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/onboarding?step=2&error=' + encodeURIComponent('Supabase env not configured.'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const introTypes = parseList(formData.get('intro_types'));
  const preferredLocations = parseList(formData.get('preferred_locations'));
  const notes = String(formData.get('notes') || '').trim();
  const openToMeeting = String(formData.get('open_to_meeting') || 'true') !== 'false';

  const { error } = await supabase.from('intro_preferences').upsert(
    {
      user_id: user.id,
      intro_types: introTypes.length > 0 ? introTypes : ['general'],
      preferred_locations: preferredLocations,
      notes: notes || null,
      open_to_meeting: openToMeeting,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    redirect('/onboarding?step=2&error=' + encodeURIComponent(error.message));
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ onboarding_complete: true, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (profileError) {
    redirect('/onboarding?step=2&error=' + encodeURIComponent(profileError.message));
  }

  redirect('/home?onboarded=1');
}
