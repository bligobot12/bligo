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

export async function saveProfileBasicsAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/onboarding?error=' + encodeURIComponent('Supabase env not configured.'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const username = cleanUsername(formData.get('username')) || `user_${user.id.slice(0, 8)}`;
  const displayName = String(formData.get('display_name') || '').trim();
  const bio = String(formData.get('bio') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const goals = String(formData.get('goals') || '').trim();
  const interests = String(formData.get('interests') || '').trim();

  const payload = {
    id: user.id,
    user_id: user.id,
    username,
    display_name: displayName || null,
    full_name: displayName || null,
    bio: bio || null,
    location: location || null,
    goals: goals || null,
    interests: interests || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').upsert(payload);
  if (error) {
    redirect('/onboarding?error=' + encodeURIComponent(error.message));
  }

  redirect('/onboarding?step=2');
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function saveIntroPreferencesAction(formData) {
  const supabase = await createClient();
  if (!supabase) redirect('/onboarding?step=2&error=' + encodeURIComponent('Supabase env not configured.'));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const preferredIndustries = parseList(formData.get('preferred_industries'));
  const preferredLocations = parseList(formData.get('preferred_locations'));
  const introGoal = String(formData.get('intro_goal') || '').trim();
  const dealbreakers = String(formData.get('dealbreakers') || '').trim();
  const visibility = String(formData.get('visibility') || 'private').trim() || 'private';

  const { error } = await supabase.from('intro_preferences').upsert({
    user_id: user.id,
    preferred_industries: preferredIndustries,
    preferred_locations: preferredLocations,
    intro_goal: introGoal || null,
    dealbreakers: dealbreakers || null,
    visibility,
  });

  if (error) {
    redirect('/onboarding?step=2&error=' + encodeURIComponent(error.message));
  }

  redirect('/home?onboarded=1');
}
