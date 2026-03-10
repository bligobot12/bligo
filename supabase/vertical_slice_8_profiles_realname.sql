-- Vertical Slice 8: real-name and profile enrichment fields
-- Apply on Supabase SQL editor or migration runner.

alter table if exists public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists industry text,
  add column if not exists job_title text,
  add column if not exists location_city text,
  add column if not exists location_state text;

-- backfill display_name from existing full_name where missing
update public.profiles
set display_name = coalesce(display_name, trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')), full_name)
where display_name is null;

-- Messaging migration notes:
-- 1) middleware no longer gates /messages routes server-side
-- 2) message pages rely on session refresh + client auth fallback
-- 3) no schema change required for messaging tables in this slice
