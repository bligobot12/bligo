-- Vertical Slice 5: Bot connection foundation

create table if not exists public.bot_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  api_key text unique,
  bot_name text,
  bot_type text not null default 'openclaw' check (bot_type in ('openclaw', 'chatgpt', 'claude', 'custom')),
  last_active timestamptz,
  status text not null default 'disconnected',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.bot_connections
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists api_key text,
  add column if not exists bot_name text,
  add column if not exists bot_type text not null default 'openclaw',
  add column if not exists last_active timestamptz,
  add column if not exists status text not null default 'disconnected',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists bot_connections_user_id_key on public.bot_connections(user_id);
create unique index if not exists bot_connections_api_key_key on public.bot_connections(api_key);

alter table public.bot_connections
  drop constraint if exists bot_connections_bot_type_check;

alter table public.bot_connections
  add constraint bot_connections_bot_type_check
  check (bot_type in ('openclaw', 'chatgpt', 'claude', 'custom'));

update public.bot_connections
set status = coalesce(nullif(status, ''), 'disconnected'),
    bot_type = case
      when coalesce(bot_type, '') in ('openclaw', 'chatgpt', 'claude', 'custom') then bot_type
      else 'openclaw'
    end,
    updated_at = now();

alter table public.bot_connections enable row level security;

drop policy if exists "bot_connections select self" on public.bot_connections;
create policy "bot_connections select self"
  on public.bot_connections for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "bot_connections insert self" on public.bot_connections;
create policy "bot_connections insert self"
  on public.bot_connections for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "bot_connections update self" on public.bot_connections;
create policy "bot_connections update self"
  on public.bot_connections for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_bot_connections_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_bot_connections_updated_at on public.bot_connections;
create trigger set_bot_connections_updated_at
before update on public.bot_connections
for each row
execute procedure public.set_bot_connections_updated_at();
