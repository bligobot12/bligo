'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { generateMatchCandidatesAction } from '../matching/actions';

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
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect('/login');

  // Always use authenticated user id (auth.uid) as canonical profile owner
  const currentUserId = user.id;

  const firstName = String(formData.get('first_name') || '').trim();
  const lastName = String(formData.get('last_name') || '').trim();
  const displayName = `${firstName} ${lastName}`.trim();
  const headline = String(formData.get('headline') || '').trim();
  const city = String(formData.get('city') || '').trim();
  const industry = String(formData.get('industry') || '').trim();
  const jobTitle = String(formData.get('job_title') || '').trim();
  const locationCity = String(formData.get('location_city') || city).trim();
  const locationState = String(formData.get('location_state') || '').trim();
  if (!firstName || !lastName) {
    redirect('/onboarding?error=' + encodeURIComponent('First and last name are required.'));
  }

  const interests = parseList(formData.get('interests'));
  const goals = parseList(formData.get('goals'));
  const visibilityRaw = String(formData.get('visibility') || 'connections').trim();
  const visibility = visibilityRaw || 'connections';

  const payload = {
    id: currentUserId,
    user_id: currentUserId,
    first_name: firstName,
    last_name: lastName,
    display_name: displayName || null,
    headline: headline || null,
    city: city || null,
    industry: industry || null,
    job_title: jobTitle || null,
    location_city: locationCity || null,
    location_state: locationState || null,
    interests,
    goals,
    visibility,
    onboarding_complete: false,
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' });

  if (error) {
    // Fallback for any env still keyed by id conflict
    const fallback = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    error = fallback.error;
  }

  if (error) {
    redirect('/onboarding?error=' + encodeURIComponent(error.message));
  }

  redirect('/onboarding');
}

export async function saveIntroPreferencesAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/onboarding?error=' + encodeURIComponent('Supabase env not configured.'));

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect('/login');

  const currentUserId = user.id;

  const introTypes = parseList(formData.get('intro_types'));
  const preferredLocations = parseList(formData.get('preferred_locations'));
  const notes = String(formData.get('notes') || '').trim();
  const openToMeeting = String(formData.get('open_to_meeting') || 'true') !== 'false';

  const { error } = await supabase.from('intro_preferences').upsert(
    {
      user_id: currentUserId,
      intro_types: introTypes.length > 0 ? introTypes : ['general'],
      preferred_locations: preferredLocations,
      notes: notes || null,
      open_to_meeting: openToMeeting,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    redirect('/onboarding?error=' + encodeURIComponent(error.message));
  }

  let { error: profileError } = await supabase
    .from('profiles')
    .update({ onboarding_complete: true, user_id: currentUserId, updated_at: new Date().toISOString() })
    .eq('user_id', currentUserId);

  if (profileError) {
    // fallback if older rows were keyed only by id
    const fallback = await supabase
      .from('profiles')
      .update({ onboarding_complete: true, user_id: currentUserId, updated_at: new Date().toISOString() })
      .eq('id', currentUserId);
    profileError = fallback.error;
  }

  if (profileError) {
    redirect('/onboarding?error=' + encodeURIComponent(profileError.message));
  }

  // Re-run matching after onboarding/profile signal updates
  await generateMatchCandidatesAction();

  redirect('/home?onboarded=1');
}
