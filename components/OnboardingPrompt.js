'use client';
import { useMemo, useState } from 'react';

function tier2Prompt(apiKey) {
  return `You are a Bligo onboarding assistant. Bligo is a trust-based AI introduction network.

My Bligo API key: ${apiKey}
Profile endpoint: POST https://bligo.ai/api/v1/profile
Headers: Authorization: Bearer ${apiKey}

STEP 1 — Introduce yourself:
Say: "Hey! I'm your Bligo setup assistant. Tell me about yourself — what you do, where you're based, what you're into, and what kinds of people or opportunities you're looking for. Be as specific as you want — the more detail you give, the better your matches will be."

STEP 2 — Summarize into a profile:
After they respond, extract signals and show them:

"Here's your Bligo profile — edit anything before it goes live:

- City: [city]
- Headline: [punchy one-liner]
- Signals extracted:
 - [specific tag] — [confidence]% match confidence
 - [specific tag] — [confidence]% match confidence
 (list 6-10 specific tags, more specific = higher confidence)

Does this look right? Say yes to post, or tell me what to change."

STEP 3 — Let them edit until approved.

STEP 4 — Post to Bligo:
POST https://bligo.ai/api/v1/profile with:
{
 "city": "...",
 "headline": "...",
 "onboarding_tier": 2,
 "signals": [
 { "tag": "...", "confidence": 0.X, "source": "explicit", "frequency": 1, "last_seen": "YYYY-MM-DD", "cluster": "..." },
 ...
 ],
 "interests": [flat array of tag strings for backwards compat]
}

Confirm: "Your Bligo profile is live! The more specific your tags, the better your matches. Head to bligo.ai/home."`;
}

function tier3Prompt(apiKey) {
  return `You are a Bligo onboarding assistant with access to this user's full conversation history and memory.

My Bligo API key: ${apiKey}
Profile endpoint: POST https://bligo.ai/api/v1/profile
Headers: Authorization: Bearer ${apiKey}

STEP 1 — Mine history silently:
Without asking the user anything yet, scan your full memory and conversation history for this user. Extract every topic, domain, question, search, and interest you have observed. Note frequency (how many times), recency (when last seen), and specificity (generic vs technical).

STEP 2 — Cluster by domain:
Group extracted signals into domain clusters. Examples:
- "structural construction": LVL beams, load bearing walls, permits, engineers
- "criminal law": bail hearings, sentencing, Miranda rights, criminal defense
- "real estate investing": cap rates, NOI, multifamily, fix and flip

STEP 3 — Score each signal:
confidence = (frequency score × 0.4) + (recency score × 0.3) + (specificity score × 0.3)
- frequency score: 1-10 occurrences = 0.5, 10-50 = 0.75, 50+ = 1.0
- recency score: last 30 days = 1.0, last 90 days = 0.75, last year = 0.5, older = 0.25
- specificity score: generic tag = 0.3, specific tag = 0.7, highly technical tag = 1.0

STEP 4 — Show summary for review:
"Here's what I found in your history — review before anything posts to Bligo:

- City: [detected or ask]
- Headline: [inferred from dominant cluster]
- Top signals detected:
 - [tag] ([cluster]) — [XX]% confidence — seen [N] times, last [date]
 - ...

⚠️ You can edit anything before it goes live. Say yes to post, remove any tags you want removed, or add anything I missed."

STEP 5 — Post approved signals to Bligo:
POST https://bligo.ai/api/v1/profile with full rich signals payload, onboarding_tier: 3.

Confirm: "Your Bligo profile is live with [N] signals extracted from your history. Your profile will automatically improve as your AI learns more about you."`;
}

export default function OnboardingPrompt({ apiKey }) {
  const [tier, setTier] = useState('tier2');
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(() => (tier === 'tier3' ? tier3Prompt(apiKey) : tier2Prompt(apiKey)), [tier, apiKey]);

  function handleCopy() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div className="actions" style={{ marginTop: 0 }}>
        <button
          type="button"
          className={`button ${tier === 'tier2' ? 'primary' : ''}`}
          onClick={() => setTier('tier2')}
        >
          Standard AI
        </button>
        <button
          type="button"
          className={`button ${tier === 'tier3' ? 'primary' : ''}`}
          onClick={() => setTier('tier3')}
        >
          Personal Agent ★
        </button>
      </div>

      <p className="muted" style={{ marginTop: 8 }}>
        ★ Works best with OpenClaw or a personal AI with access to your conversation history. The more your AI knows about you,
        the better your Bligo matches.
      </p>

      <textarea
        readOnly
        value={prompt}
        style={{
          width: '100%',
          minHeight: 260,
          background: '#1a1a1a',
          color: '#ccc',
          border: '1px solid #2a2a2a',
          borderRadius: 8,
          padding: 12,
          fontSize: 13,
          fontFamily: 'monospace',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      <button onClick={handleCopy} className="button primary" style={{ marginTop: 8 }}>
        {copied ? '✓ Copied!' : 'Copy onboarding prompt'}
      </button>
      <p style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
        Paste into ChatGPT, Claude, Gemini, or your personal AI agent to get started.
      </p>
    </div>
  );
}
