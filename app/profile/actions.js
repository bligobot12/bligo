'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../../lib/supabase/server';

function toClean(v) {
  return String(v || '').trim();
}

export async function updateProfileAction(formData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  if (!userId) return;

  await supabase
    .from('profiles')
    .update({
      display_name: toClean(formData.get('display_name')) || null,
      job_title: toClean(formData.get('job_title')) || null,
      industry: toClean(formData.get('industry')) || null,
      location_city: toClean(formData.get('location_city')) || null,
      location_state: toClean(formData.get('location_state')) || null,
      bio: toClean(formData.get('bio')) || null,
    })
    .eq('user_id', userId);

  revalidatePath(`/profile/${userId}`);
}

export async function addSpecialtyAction(formData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  if (!userId) return;

  const specialty = toClean(formData.get('specialty'));
  if (!specialty) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('specialty')
    .eq('user_id', userId)
    .maybeSingle();

  const updated = [...new Set([...(profile?.specialty || []), specialty])];

  await supabase
    .from('profiles')
    .update({ specialty: updated })
    .eq('user_id', userId);

  revalidatePath(`/profile/${userId}`);
}

export async function removeSpecialtyAction(formData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  if (!userId) return;

  const specialty = toClean(formData.get('specialty'));

  const { data: profile } = await supabase
    .from('profiles')
    .select('specialty')
    .eq('user_id', userId)
    .maybeSingle();

  const updated = (profile?.specialty || []).filter((s) => s !== specialty);

  await supabase
    .from('profiles')
    .update({ specialty: updated })
    .eq('user_id', userId);

  revalidatePath(`/profile/${userId}`);
}
