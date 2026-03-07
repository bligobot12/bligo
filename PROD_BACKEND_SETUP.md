# Production Backend Setup (Supabase)

## What was added

- Supabase clients:
  - `lib/supabase/client.js`
  - `lib/supabase/server.js`
- Database schema + RLS:
  - `supabase/schema.sql`
- Env template:
  - `.env.example`

## Steps to activate

1. Create a Supabase project.
2. In Supabase SQL editor, run `supabase/schema.sql`.
3. Copy project URL + anon key into `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Create storage bucket for avatars (suggested: `avatars`, public read).
5. Configure auth providers (Email + optional OAuth).
6. Redeploy Cloudflare Pages after adding env vars in project settings.

## Current blocker

Live production auth/data is blocked until valid Supabase credentials are provided.
The app still runs with local MVP state in parallel until backend wiring is fully switched.
