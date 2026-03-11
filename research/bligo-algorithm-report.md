# Bligo Matching & Search Algorithm Report (2026-03-10)

## 1) Current state

### What exists now
- **Intent-aware search path** in `app/api/search/classify/route.js` + `app/api/search/run/route.js`
- Search queries are classified into structured intent (goal, role, industry, urgency cues), then matched against profile/user signals.
- **Signals** are stored on profiles (`profiles.signals`) with fields like `tag`, `confidence`, `source`, `frequency`, `last_seen`, `cluster`.
- Matching surface includes:
  - direct profile relevance
  - signal overlap
  - relationship context (friends/friends-of-friends)
  - recency/freshness from activity

### Effective weighting (observed)
Current scoring is effectively a weighted blend of:
1. **Query-to-signal overlap** (highest)
2. **Profile field text relevance** (headline/industry/job/location)
3. **Trust proximity** (closer graph hops rank higher)
4. **Recent activity / freshness**

### Limitations
- New users can have sparse signals.
- Confidence can become stale without active decay/recalibration.
- Ranking is mostly one-directional (“fit to seeker”) vs mutual need fit.
- Trust edge strength is coarse (connected vs not), not deeply weighted.

---

## 2) Cold start problem (day-1 matching)

Use a staged cold-start strategy:
1. **Profile bootstrap vectors** from onboarding fields (role, industry, location, goals).
2. **Prompted starter signals** from guided skills chat in first session.
3. **Fallback cohort priors** by city + industry + role for initial candidate pools.
4. **Behavioral warm-up** from first search terms and first post intents.

### Practical day-1 rule
`score_day1 = 0.45*profile_semantics + 0.25*location_fit + 0.20*industry_fit + 0.10*graph_proximity`
Then shift weight toward true signals as soon as user has ≥5 high-confidence signals.

---

## 3) Signal decay model

Use exponential decay with source-aware half-life:

`effective_confidence(t) = base_confidence * exp(-lambda * age_days)`

Where:
- `lambda = ln(2)/half_life_days`
- Suggested half-life:
  - explicit/credential signals: 180 days
  - bot_training/guided_chat: 90 days
  - inferred passive signals: 45 days

Reinforcement event (new matching evidence) can boost and reset recency:
- `base_confidence = min(1.0, base_confidence + 0.05..0.15)` depending on evidence quality.

---

## 4) Bidirectional matching

Current ranking should evolve from one-way fit to mutual utility:

`mutual_score(A,B) = 0.5*fit(A->B) + 0.5*fit(B->A)`

Add “need-complement” bonus when one user’s active intent maps strongly to the other’s proven strengths.

---

## 5) Trust path weighting

Graph-aware trust should be stronger than simple hop count.

Suggested edge model:
- `edge_weight = interaction_strength * recency_factor * acceptance_rate`
- Trust path score uses max or top-k path aggregation:
  - direct accepted connection: high prior
  - mutual strong connector: medium-high
  - weak distant path: low

Data structures:
- adjacency lists keyed by `user_id`
- edge metadata table (message volume, accepted intros, recency)
- cached top connectors per user for fast retrieval

---

## 6) “Why now” detection

Create an active-intent detector from:
1. New posts with request/intent language
2. Recent search bursts around same topic
3. Bot updates to profile signals/goals
4. Connection/message activity spikes

Use a short-window urgency score (e.g., 72h):

`why_now = intent_post_score + search_burst_score + bot_update_score + convo_spike_score`

If above threshold, temporarily raise match exposure weight.

---

## 7) Skills chat improvements

1. Improve question quality by adaptive questioning (branch by user context).
2. Confidence calibration by evidence type:
   - certified/license mention > repeated practical experience > weak mention.
3. Multi-session learning:
   - track consistency across sessions before boosting confidence.
4. Bot-specific handling:
   - OpenClaw can perform API writes directly;
   - ChatGPT/Claude flows may require explicit tool/API instructions and verification parsing.

---

## 8) Privacy architecture

Goal: private search intent, warm introductions.

Recommended model:
- Keep raw search text private by default.
- Store only minimal structured intent features for ranking.
- Expose match reasons as abstracted summaries (“shared construction ops + local network overlap”), not raw queries.
- Use consent gates before identity-revealing intros.

---

## 9) Highest-impact next build recommendation

**Build: Mutual-Need + Why-Now re-ranker**

Why this first:
- Directly improves perceived match quality.
- Uses existing signals/search/post data with minimal schema risk.
- Gives immediate product value (“this intro is relevant now, both ways”).

---

## 10) Monetization paths (realistic)

1. **Pro tier for operators/founders**: advanced search + higher intro volume.
2. **Team plans**: shared org intent graph for SMB teams.
3. **Verified experts/profiles**: trust badge + boosted discovery.
4. **Assisted intros concierge**: paid warm-intro facilitation.
5. **API/agent integration tier**: higher bot/API limits and audit tooling.

---

## Implementation notes
- Start with an offline evaluation dataset from recent accepted/ignored intros.
- Track precision@k and acceptance rate before/after re-ranker rollout.
- Roll out behind feature flag for gradual tuning.
