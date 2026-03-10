# LinkedIn Homepage Visual Analysis (Live Capture)

Date/time observed: 2026-03-09 (evening)
URL: `https://www.linkedin.com/feed/`

## Captured screenshots

1. **Full homepage**  
   `/Users/mac/.openclaw/media/browser/8e8e9c3a-35e6-434f-8c97-0db7fa8b1c14.png`

2. **Left profile card (zoomed)**  
   `/Users/mac/.openclaw/media/browser/56bbef9d-bdd2-449f-8db5-d1d7b713c186.png`

3. **Feed post card (zoomed)**  
   `/Users/mac/.openclaw/media/browser/c1e65d84-2a54-47c9-9466-a395458f3386.png`

4. **Right rail suggestions/news (zoomed)**  
   `/Users/mac/.openclaw/media/browser/660386f0-2a70-44b6-9d91-ec23a44f498e.png`

---

## What Mac sees on LinkedIn right now

### 1) Global page structure
- Standard **3-column LinkedIn feed layout**:
  - Left: identity/profile + shortcuts
  - Center: post composer + feed cards
  - Right: LinkedIn News and puzzle/sponsored modules
- Top nav shows activity badges (notably notifications/messages/network activity).

### 2) Left profile card state
- Profile shown as **Luke McGovern**.
- Headline reads: **Owner of White Plains Property & Project Management**.
- Location shown: **White Plains, New York**.
- Page affiliation shown: **White Plains Property Management**.
- Below profile module are utility panels (analytics, company page card, saved/groups/newsletters/events links).

### 3) Center feed state
- Top-center contains a job-intent prompt card: “Hi Luke, are you looking for a job right now?”
- Post composer is immediately visible: **Start a post** with Video/Photo/Write article actions.
- A visible organic feed post from **Keith Simone** (Redfin) is present, with a professional announcement and brand image block.
- Feed appears to include a mix of:
  - 1st-degree connection updates
  - engagement-amplified posts ("X commented/loves this")
  - promoted content.

### 4) Right rail state
- **LinkedIn News** panel is active with "Top stories" list (business + policy + tech topics).
- Story list includes high-reader-count headlines and timestamps.
- "Today’s puzzles" module visible beneath news (Zip teaser).
- Sponsored right-rail unit appears below fold in full-page capture.

---

## UX/Content observations

- Feed prioritization seems to blend personal network updates with monetized/promoted units early.
- Strong emphasis on **engagement actions** (Like/Comment/Repost/Send) and identity cues (verified badges, degree labels).
- Right rail acts as an attention splitter: real-time news + light game + ad inventory.
- For a product inspiration lens: LinkedIn is leaning on a **status + action + discovery** triad:
  - status (profile analytics/identity),
  - action (post composer + social buttons),
  - discovery (news + algorithmic feed + suggestions).

## Quick takeaway
Current LinkedIn home experience is a high-density professional activity board with clear monetization surfaces and strong social proof layers. The immediate visual hierarchy is: **identity first, compose second, feed depth third, news/sponsored context fourth**.

## Bligo: Copy vs Avoid

### COPY from LinkedIn
- **Three-zone hierarchy (identity → compose → feed):** Keep a stable left profile summary, central action/feed area, and lightweight right rail for discovery.
- **Simple post composer first:** A prominent "Start a post" entry point with minimal friction is effective.
- **Post card baseline anatomy:**
  - author avatar + name
  - trust context line (role/headline + recency)
  - short content preview with expand
  - primary action row at bottom
- **Degree visibility pattern:** LinkedIn surfaces degree directly beside names (e.g., "• 1st", "• 2nd"). This is extremely scannable and should map well to Bligo’s 1st/2nd/3rd trust tiers.
- **Lightweight social proof:** Reaction/comment counts work as quick quality signals without requiring full read.
- **Connection prompts embedded in stream:** Contextual prompts near the top (like job-intent nudges) can work for onboarding actions in Bligo.

### AVOID / DO DIFFERENTLY
- **Avoid ad-heavy clutter:** LinkedIn’s promoted units and right-rail ads dilute focus. Bligo should stay high-signal and intent-driven.
- **Avoid too many competing modules:** News, puzzles, creator analytics, company admin widgets create cognitive load. Bligo should keep only connection-relevant modules.
- **Avoid vanity-first metrics overload:** "Profile viewers" and broad analytics are less useful for Bligo’s trust-intro workflow.
- **Avoid ambiguous recommendation logic:** LinkedIn’s People/Feed suggestions often feel opaque. Bligo should show explicit "why this person" reasons from trust graph + signal overlap.
- **Avoid generic engagement loops:** Likes/reposts are not core for Bligo; connection outcomes and intros should be primary.

### BLIGO-SPECIFIC opportunities
- **Trust graph as primary UI primitive:**
  - Every card can show "1st / 2nd / 3rd+" visibly.
  - Show exact path: "Via [name]" for 2nd/3rd tier, not just implied degree.
- **Intro suggestions vs connection requests split clearly:**
  - LinkedIn blends many social actions in one feed.
  - Bligo can separate:
    - *Incoming connection requests* (explicit user actions)
    - *Suggested intros* (algorithmic, explainable recommendations)
- **"People you may know" but explainable:**
  - LinkedIn usually presents PYMK as cards with mutuals and a Connect CTA.
  - Bligo can improve by adding concrete overlap chips (shared signals/interests/goals) + trust-path explanation.
- **Post-to-search conversion loop:**
  - LinkedIn post cards focus on engagement.
  - Bligo can make each post actionable with "Search now →" to immediately discover relevant people.
- **Bot-first workflow advantages:**
  - Convert conversations/messages into structured signals automatically.
  - Trigger background matching and notify only when high-confidence intros appear.
  - Personalize ranking by recent bot-detected intent, not generic feed popularity.
- **What to remove for Bligo simplicity:**
  - games/puzzles/news modules
  - broad creator/company admin clutter on home
  - excessive reaction mechanics
  - non-actionable feed filler
