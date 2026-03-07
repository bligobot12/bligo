-- Core production schema for Bligo
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  bio text default '',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.conversations (
  id bigint generated always as identity primary key,
  created_at timestamptz default now()
);

create table if not exists public.conversation_members (
  conversation_id bigint references public.conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.bot_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  provider text not null default 'openclaw',
  status text not null default 'disconnected',
  access_token text,
  metadata jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.bot_connections enable row level security;

-- Basic RLS (can be tightened further)
create policy if not exists "profiles selectable by all auth users" on public.profiles
for select to authenticated using (true);

create policy if not exists "profiles insert self" on public.profiles
for insert to authenticated with check (auth.uid() = id);

create policy if not exists "profiles update self" on public.profiles
for update to authenticated using (auth.uid() = id);

create policy if not exists "posts select all auth" on public.posts
for select to authenticated using (true);

create policy if not exists "posts insert self" on public.posts
for insert to authenticated with check (auth.uid() = user_id);

create policy if not exists "posts delete self" on public.posts
for delete to authenticated using (auth.uid() = user_id);

create policy if not exists "members select own memberships" on public.conversation_members
for select to authenticated using (auth.uid() = user_id);

create policy if not exists "members insert self" on public.conversation_members
for insert to authenticated with check (auth.uid() = user_id);

create policy if not exists "messages select where member" on public.messages
for select to authenticated using (
  exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
  )
);

create policy if not exists "messages insert as sender member" on public.messages
for insert to authenticated with check (
  auth.uid() = sender_id and exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
  )
);

create policy if not exists "bot select self" on public.bot_connections
for select to authenticated using (auth.uid() = user_id);

create policy if not exists "bot upsert self" on public.bot_connections
for insert to authenticated with check (auth.uid() = user_id);

create policy if not exists "bot update self" on public.bot_connections
for update to authenticated using (auth.uid() = user_id);
