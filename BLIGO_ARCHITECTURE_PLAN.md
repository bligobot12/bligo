# BLIGO Architecture Plan (Authoritative)

**Version:** 1.0  
**Date:** 2026-03-07  
**Source of truth:** MAC directive (platform blueprint)

---

## 1) Authoritative System Design

Bligo is a **modular monolith MVP** in one Next.js codebase:

- Marketing routes + product routes in one app
- Supabase as auth + relational source of truth
- Supabase Storage for media
- Cloudflare Pages for hosting/deploy
- Bot integrations as a first-class integration layer
- Moderation/safety systems included early

### Required route model (authoritative)
- `/` marketing
- `/about` marketing
- `/home` authenticated dashboard
- `/profile/[username]` public profile
- `/messages` messaging
- `/settings` account settings
- `/connect-bot` bot integrations

---

## 2) Current-State Compliance Report

## ✅ Matches (already aligned)

- **Monolithic MVP approach:** single Next.js codebase.
- **Cloudflare Pages deployment pipeline:** GitHub -> Cloudflare deploys.
- **Supabase foundation exists:**
  - `lib/supabase/client.js`
  - `lib/supabase/server.js`
  - `.env` keys configured
- **Relational schema started:**
  - `profiles`, `posts`, `conversations`, `conversation_members`, `messages`, `bot_connections`
- **Core UX surfaces exist (MVP):**
  - profile editing, posts, messaging, bot connection UX
- **Unified codebase for marketing + app already partially done**

## ⚠️ Divergences (must fix)

1. **Route structure mismatch**
   - Current product routes are under `/app/*`
   - Blueprint requires `/home`, `/messages`, `/settings`, `/connect-bot`, `/profile/[username]`

2. **Auth implementation mismatch**
   - Current auth is local browser state (`app/providers.jsx`) not Supabase Auth-backed sessions.

3. **Data layer mismatch**
   - Current posts/messages/profile mostly local-state persisted in browser localStorage.
   - Blueprint requires Supabase Postgres as source of truth.

4. **Schema incompleteness**
   - Missing required entities:
     - `connections`
     - `comments`
     - `reactions`
     - `notifications`
     - `bots`
     - `media_assets`
     - `moderation_flags`
   - Also need explicit `users` mapping strategy via `auth.users` + `profiles`.

5. **Storage mismatch**
   - Avatar upload currently local (data URL), not Supabase Storage.

6. **Moderation/safety gap**
   - No implemented report/block/rate-limit/spam/admin moderation flows yet.

7. **Bot integration depth gap**
   - Current bot connect is UI toggle only.
   - Missing encrypted token storage, scoped permissions, lifecycle states, webhook events, bot audit logs.

8. **Messaging MVP compliance gap**
   - Thread model exists conceptually, but missing DB-backed unread indicators and production session-based messaging flow.

9. **Environment strategy gap**
   - Need explicit local/staging/production separation in config and process.

10. **Observability gap**
   - No Sentry/alerting/health monitoring wired yet.

---

## 3) Migration/Refactor Requirements

### A. Routing refactor
- Introduce blueprint routes now:
  - `/home`, `/messages`, `/settings`, `/connect-bot`, `/profile/[username]`
- Keep `/app/*` as temporary compatibility redirects, then retire.

### B. Auth migration
- Replace local auth with Supabase Auth:
  - email/password sign-up/login
  - session middleware + route protection
  - server-side session checks

### C. Data migration
- Move profile/posts/messages/bot state from local provider into DB CRUD via server actions/route handlers.
- Keep local provider only as temporary fallback during transition.

### D. Schema expansion
- Add missing required tables and RLS policies:
  - connections, comments, reactions, notifications, bots, media_assets, moderation_flags

### E. Storage migration
- Move avatar/media to Supabase Storage bucket(s).
- Persist URLs in `media_assets` and entity records.

### F. Moderation baseline
- Implement report endpoints + moderation flags writes.
- Add block user + simple rate limit policy for post/message actions.

### G. Bot architecture baseline
- Add `bots` metadata table + robust `bot_connections` lifecycle.
- Add webhook endpoint and bot event logging.

---

## 4) Implementation Roadmap (Prioritized)

## Phase 1 — Architecture Compliance Core (immediate)
1. Route migration to blueprint paths (with temporary redirects).
2. Supabase Auth integration + protected routes.
3. DB schema expansion to required core entities.
4. Server-side profile/posts/messages CRUD using Supabase.

**Exit criteria:** user can sign up/login, land on `/home`, create posts, send DMs, and edit profile with DB persistence.

## Phase 2 — Social Graph + Safety Foundations
1. Implement `connections` model and basic first/second-degree queries.
2. Add comments + reactions.
3. Add notifications table + basic notification writes.
4. Add moderation flags + report flows + block user + baseline rate limiting.

**Exit criteria:** graph-aware social interactions are functional and moderation primitives exist.

## Phase 3 — Bot Integration Foundation
1. Add `bots` + enhanced `bot_connections` lifecycle (`connect`,`verify`,`active`,`revoked`).
2. Implement encrypted token handling (server-side only).
3. Add webhook receiver + event logs.
4. Add bot health checks/status surface.

**Exit criteria:** real bot connection pipeline with auditable actions.

## Phase 4 — Platform Hardening
1. Environment split enforcement: local/staging/prod credentials/projects.
2. Monitoring stack: Sentry + Cloudflare analytics + Supabase log review workflows.
3. Background job foundation (notifications, webhook retries, moderation scans).

**Exit criteria:** deploy/observe/recover operational maturity.

---

## 5) Next Prioritized Engineering Tasks (immediate queue)

1. Create new route surface (`/home`, `/messages`, `/settings`, `/connect-bot`, `/profile/[username]`) + temporary `/app/*` redirects.
2. Implement Supabase Auth session middleware and route guards.
3. Expand `supabase/schema.sql` to include missing required entities + RLS stubs.
4. Replace local posts/messages/profile writes with Supabase-backed server actions.
5. Implement Supabase Storage avatar upload and persist to `media_assets` + `profiles.avatar_url`.
6. Add initial moderation endpoints writing to `moderation_flags`.

---

## 6) Decision

This document is now the **active architecture blueprint** for Bligo engineering decisions and implementation sequencing.
