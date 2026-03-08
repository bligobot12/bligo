create table if not exists public.connections (
 id uuid primary key default gen_random_uuid(),
 from_user_id uuid references auth.users(id) on delete cascade not null,
 to_user_id uuid references auth.users(id) on delete cascade not null,
 status text default 'pending',
 created_at timestamptz default now(),
 updated_at timestamptz default now(),
 unique(from_user_id, to_user_id)
);

alter table public.connections enable row level security;

drop policy if exists "users can view own connections" on public.connections;
create policy "users can view own connections"
 on public.connections for select
 to authenticated
 using (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "users can insert own connections" on public.connections;
create policy "users can insert own connections"
 on public.connections for insert
 to authenticated
 with check (auth.uid() = from_user_id);

drop policy if exists "users can update own connections" on public.connections;
create policy "users can update own connections"
 on public.connections for update
 to authenticated
 using (auth.uid() = to_user_id);
