-- Vertical Slice 1: auth + profile + avatar storage

-- 1) Profile contract alignment
alter table public.profiles
  add column if not exists user_id uuid,
  add column if not exists display_name text;

update public.profiles
set user_id = id
where user_id is null;

alter table public.profiles
  alter column user_id set not null;

create unique index if not exists profiles_user_id_key on public.profiles(user_id);

-- Keep user_id aligned to auth users and profile primary key
alter table public.profiles
  drop constraint if exists profiles_user_id_fkey;
alter table public.profiles
  add constraint profiles_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

-- 2) Storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3) Storage policies for avatars
-- Public read
create policy if not exists "avatars public read"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder user_id/*
create policy if not exists "avatars upload own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update/delete only their own files
create policy if not exists "avatars update own folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy if not exists "avatars delete own folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4) Profile policies should allow self updates by user_id (new contract) OR id (legacy)
drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self" on public.profiles
for insert to authenticated
with check (auth.uid() = user_id or auth.uid() = id);

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
for update to authenticated
using (auth.uid() = user_id or auth.uid() = id)
with check (auth.uid() = user_id or auth.uid() = id);
