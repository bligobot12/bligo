-- Vertical Slice 0 foundation fix: profiles + intro_preferences aligned to live MVP contract

alter table public.profiles
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists display_name text,
  add column if not exists headline text,
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists skills text[],
  add column if not exists interests text[],
  add column if not exists goals text[],
  add column if not exists visibility text default 'connections',
  add column if not exists onboarding_complete boolean default false;

update public.profiles
set user_id = id
where user_id is null;

create unique index if not exists profiles_user_id_key on public.profiles(user_id);

create table if not exists public.intro_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  intro_types text[],
  open_to_meeting boolean default true,
  preferred_locations text[],
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.intro_preferences
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists intro_types text[],
  add column if not exists open_to_meeting boolean default true,
  add column if not exists preferred_locations text[],
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.intro_preferences
  alter column user_id set not null;

alter table public.intro_preferences
  drop constraint if exists intro_preferences_user_id_key;
alter table public.intro_preferences
  add constraint intro_preferences_user_id_key unique (user_id);

alter table public.intro_preferences enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "profiles select self" on public.profiles;
drop policy if exists "profiles insert self" on public.profiles;
drop policy if exists "profiles update self" on public.profiles;
drop policy if exists "profiles selectable by all auth users" on public.profiles;

create policy "profiles select self"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = id);

create policy "profiles insert self"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id or auth.uid() = id);

create policy "profiles update self"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id or auth.uid() = id)
  with check (auth.uid() = user_id or auth.uid() = id);

drop policy if exists "Users can view own intro_preferences" on public.intro_preferences;
drop policy if exists "Users can insert own intro_preferences" on public.intro_preferences;
drop policy if exists "Users can update own intro_preferences" on public.intro_preferences;
drop policy if exists "intro_preferences select self" on public.intro_preferences;
drop policy if exists "intro_preferences insert self" on public.intro_preferences;
drop policy if exists "intro_preferences update self" on public.intro_preferences;

create policy "Users can view own intro_preferences"
 on public.intro_preferences for select
 using (auth.uid() = user_id);

create policy "Users can insert own intro_preferences"
 on public.intro_preferences for insert
 with check (auth.uid() = user_id);

create policy "Users can update own intro_preferences"
 on public.intro_preferences for update
 using (auth.uid() = user_id)
 with check (auth.uid() = user_id);

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
