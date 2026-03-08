create table if not exists public.match_candidates (
 id uuid primary key default gen_random_uuid(),
 user_a_id uuid references auth.users(id) on delete cascade not null,
 user_b_id uuid references auth.users(id) on delete cascade not null,
 score float not null,
 reason_why_now text,
 reason_trust_path text,
 shared_signals jsonb,
 status text default 'pending',
 created_at timestamptz default now(),
 unique(user_a_id, user_b_id)
);

alter table public.match_candidates enable row level security;

drop policy if exists "users can view own matches" on public.match_candidates;
create policy "users can view own matches"
 on public.match_candidates for select
 to authenticated
 using (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "users can insert own generated matches" on public.match_candidates;
create policy "users can insert own generated matches"
 on public.match_candidates for insert
 to authenticated
 with check (auth.uid() = user_a_id);

drop policy if exists "users can delete own generated matches" on public.match_candidates;
create policy "users can delete own generated matches"
 on public.match_candidates for delete
 to authenticated
 using (auth.uid() = user_a_id);

create table if not exists public.intro_responses (
 id uuid primary key default gen_random_uuid(),
 match_candidate_id uuid references public.match_candidates(id) on delete cascade not null,
 responding_user_id uuid references auth.users(id) on delete cascade not null,
 response text not null,
 responded_at timestamptz default now()
);

alter table public.intro_responses enable row level security;

drop policy if exists "users can insert own responses" on public.intro_responses;
create policy "users can insert own responses"
 on public.intro_responses for insert
 to authenticated
 with check (auth.uid() = responding_user_id);

drop policy if exists "users can view own responses" on public.intro_responses;
create policy "users can view own responses"
 on public.intro_responses for select
 to authenticated
 using (auth.uid() = responding_user_id);
