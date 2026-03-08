-- Vertical Slice 0: onboarding + profile persistence

-- Profiles table extensions
alter table public.profiles
  add column if not exists user_id uuid,
  add column if not exists display_name text,
  add column if not exists location text,
  add column if not exists goals text,
  add column if not exists interests text;

update public.profiles
set user_id = id
where user_id is null;

alter table public.profiles
  alter column user_id set not null;

create unique index if not exists profiles_user_id_key on public.profiles(user_id);

alter table public.profiles
  drop constraint if exists profiles_user_id_fkey;
alter table public.profiles
  add constraint profiles_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

-- Intro preferences table
create table if not exists public.intro_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_industries text[] not null default '{}',
  preferred_locations text[] not null default '{}',
  intro_goal text,
  dealbreakers text,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intro_preferences_visibility_check check (visibility in ('private', 'network', 'public'))
);

alter table public.intro_preferences enable row level security;

-- RLS policies
alter table public.profiles enable row level security;

drop policy if exists "profiles selectable by all auth users" on public.profiles;
create policy "profiles selectable by all auth users"
on public.profiles
for select to authenticated
using (true);

drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self"
on public.profiles
for insert to authenticated
with check (auth.uid() = user_id or auth.uid() = id);

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self"
on public.profiles
for update to authenticated
using (auth.uid() = user_id or auth.uid() = id)
with check (auth.uid() = user_id or auth.uid() = id);

drop policy if exists "intro_preferences select self" on public.intro_preferences;
create policy "intro_preferences select self"
on public.intro_preferences
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "intro_preferences insert self" on public.intro_preferences;
create policy "intro_preferences insert self"
on public.intro_preferences
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "intro_preferences update self" on public.intro_preferences;
create policy "intro_preferences update self"
on public.intro_preferences
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Keep updated_at fresh
create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_intro_preferences_updated_at on public.intro_preferences;
create trigger set_intro_preferences_updated_at
before update on public.intro_preferences
for each row
execute procedure public.set_current_timestamp_updated_at();
