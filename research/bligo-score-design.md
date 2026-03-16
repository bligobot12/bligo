# Bligo Score — Design Document

## 1. Formula

The Bligo Score is a 0–100 composite of five weighted dimensions:

| Dimension | Max Points | What It Measures |
|-----------|-----------|------------------|
| Profile Completeness | 20 | Display name, headline, city, bio, avatar, job title, industry |
| Skills Depth | 25 | Number of AI-designated signals, average confidence, cluster diversity |
| Network | 20 | Accepted connections count, mutual connection density |
| Activity | 20 | Posts in last 30 days, search activity, intro responses |
| Bot Connected | 15 | Has a connected bot with recent activity |

### Calculation Details

**Profile Completeness (20 pts)**
- 1 pt per non-empty field out of: display_name, headline, city, bio, avatar_url, job_title, industry (7 fields)
- Score = (filled / 7) * 20, rounded

**Skills Depth (25 pts)**
- signal_count_score = min(1, signals.length / 10) * 10
- avg_confidence_score = avg(signal.confidence) * 10
- cluster_diversity_score = min(1, unique_clusters / 5) * 5
- Total = signal_count_score + avg_confidence_score + cluster_diversity_score

**Network (20 pts)**
- connection_score = min(1, accepted_connections / 20) * 12
- mutual_density_score = (connections_with_mutuals / total_connections) * 8
- Total = connection_score + mutual_density_score

**Activity (20 pts)**
- posts_score = min(1, posts_last_30_days / 5) * 8
- search_score = min(1, searches_last_30_days / 3) * 6
- response_score = min(1, intro_responses_last_30_days / 3) * 6
- Total = posts_score + search_score + response_score

**Bot Connected (15 pts)**
- has_bot = bot_connections.status === 'connected' ? 8 : 0
- recent_bot = last_active within 7 days ? 7 : (within 30 days ? 3 : 0)
- Total = has_bot + recent_bot

**Final Score** = sum of all dimensions, capped at 100.

## 2. Display Recommendation

**Ring progress indicator** on the profile card.

- Circular SVG ring around the avatar, filled proportionally to score
- Color gradient: red (0-30) -> yellow (31-60) -> green (61-100)
- Score number displayed below the avatar: "Bligo Score: 73"
- On hover/tap: breakdown tooltip showing 5 dimension scores

Why ring over other options:
- **Bar chart**: Takes too much horizontal space, feels like a report card
- **Number only**: No visual context for what "73" means
- **Badge**: Too gamified, invites comparison anxiety
- Ring is subtle, informational, and maps naturally to avatar placement

## 3. Visibility

**Self-only by default.** Your Bligo Score is visible only to you on your own profile and in settings.

Others see:
- A subtle "Active" badge if score > 50
- A "Highly Active" badge if score > 80
- No numeric score shown to others

Rationale: Showing exact scores to others creates comparison anxiety and status games. The badge system encourages engagement without creating a hierarchy.

## 4. Effect on Match Ranking

Yes, but as a **tiebreaker only** — not a primary factor.

- Match scoring remains based on mutual need (skills, interests, goals, network proximity)
- When two candidates have similar match scores (within 0.05), prefer the one with a higher Bligo Score
- This rewards engaged users without penalizing new users in matching

Implementation: In `runMatchingForUser.js`, after computing the final score:
```
// Tiebreaker: add tiny Bligo Score bonus (max 0.02)
score += (otherBligoScore / 100) * 0.02;
```

## 5. Gaming Prevention

**Diminishing returns on every dimension:**
- Profile completeness: Binary per field — no way to inflate
- Skills depth: Controlled by AI bots, not user-editable. Signal decay cron reduces stale signals
- Network: Mutual density rewards quality over quantity. 100 connections with 0 mutuals scores poorly
- Activity: Capped at 5 posts and 3 searches per month — posting 50 times doesn't help
- Bot connected: Binary — either connected or not

**Additional safeguards:**
- Score recalculated server-side only, never from client input
- No public leaderboard or ranking
- Score not shown to others (no incentive to inflate for status)
- Signal decay naturally reduces scores of inactive users

## 6. Minimum Viable Implementation Plan

### Schema Changes

```sql
-- Add bligo_score column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bligo_score integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bligo_score_breakdown jsonb DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bligo_score_updated_at timestamptz;
```

### Code Changes

1. **New file: `lib/scoring/computeBligoScore.js`**
   - Export `computeBligoScore(supabase, userId)` that returns `{ score, breakdown }`
   - Queries profiles, connections, posts, searches, bot_connections
   - Returns the 5-dimension breakdown and total

2. **New API route: `app/api/cron/update-scores/route.js`**
   - Protected by CRON_SECRET
   - Iterates all profiles, computes score, updates bligo_score column
   - Run daily via Cloudflare Cron Trigger

3. **Update `app/profile/[userId]/page.js`**
   - If viewing own profile, show ring indicator with score
   - Fetch bligo_score from profile data

4. **Update `app/settings/page.js`**
   - Show detailed breakdown of your Bligo Score with tips to improve

5. **Update `lib/matching/runMatchingForUser.js`**
   - Add tiebreaker: fetch bligo_score for candidates, add tiny bonus

### Rollout Plan

1. Add schema column (migration)
2. Deploy computeBligoScore function
3. Deploy cron route, add Cloudflare Cron Trigger for daily 3am UTC
4. Deploy profile ring display (self-only)
5. Deploy settings breakdown page
6. Enable tiebreaker in matching (1 week after score data stabilizes)
