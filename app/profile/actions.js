'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../../lib/supabase/server';

export async function addSkillAction(userId, skill) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user || session.user.id !== userId) return;

  const cleanSkill = String(skill || '').trim();
  if (!cleanSkill) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('skills')
    .eq('user_id', userId)
    .maybeSingle();

  const updated = [...new Set([...(profile?.skills || []), cleanSkill])];

  await supabase
    .from('profiles')
    .update({ skills: updated })
    .eq('user_id', userId);

  revalidatePath(`/profile/${userId}`);
}

export async function removeSkillAction(userId, skill) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user || session.user.id !== userId) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('skills')
    .eq('user_id', userId)
    .maybeSingle();

  const updated = (profile?.skills || []).filter((s) => s !== skill);

  await supabase
    .from('profiles')
    .update({ skills: updated })
    .eq('user_id', userId);

  revalidatePath(`/profile/${userId}`);
}
