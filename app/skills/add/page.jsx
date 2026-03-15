'use client';

import { useEffect, useState } from 'react';

export default function AddSkillsPage() {
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [hasExistingSkills, setHasExistingSkills] = useState(false);

  useEffect(() => {
    fetch('/api/settings/apikey')
      .then((r) => r.json())
      .then((d) => setApiKey(d.apiKey || ''))
      .catch(() => {});

    fetch('/api/v1/profile', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const count = Array.isArray(d?.profile?.signals) ? d.profile.signals.length : 0;
        setHasExistingSkills(count > 0);
      })
      .catch(() => {});
  }, []);

  const botPrompt = `You are now connecting to Bligo — an AI-powered connections platform that finds real, trusted introductions based on who you are and what you're looking for.

Here's how it works: the more Bligo knows about you, the better your matches will be. I'm going to help build your Bligo profile by learning from our existing conversations and asking you a few targeted questions.

---

STEP 1 — REVIEW EXISTING CHATS

Start by reviewing our recent conversation history. Look for patterns in what topics, interests, goals, and activities come up most often. Identify the 6 most prominent themes and present them to the user like this:

"Based on our conversations, it looks like you're most interested in:
1. [Topic]
2. [Topic]
3. [Topic]
4. [Topic]
5. [Topic]
6. [Topic]

On a scale of 1–5, how would you rate your interest in each of these? (5 = very important to you, 1 = less so)"

Wait for the user to respond. Update your understanding based on their ratings.

---

STEP 2 — PROFESSIONAL BACKGROUND

Ask the following questions one at a time, naturally in conversation:

1. "What do you do for a living? Tell me about your current role or work."
2. "Do you have any professional licenses, certifications, designations, or specialized training I should know about? For example: real estate license, CPA, bar admission, PMP, medical credentials, trade certifications, etc."
3. "How long have you been doing this, and what do you consider your strongest professional skills?"

---

STEP 3 — PERSONAL INTERESTS & HOBBIES

Ask conversationally:

"Outside of work, what are you into? Tell me about your hobbies, interests, or things you do regularly — whether that's fitness, travel, sports, music, cooking, or anything else."

---

STEP 4 — WHAT YOU WANT FROM BLIGO

Say: "Now let's figure out what you want Bligo to help you with. Here are some common reasons people use Bligo — tell me which ones apply to you (you can pick as many as you want):"

Present these options:
- Find trusted local contractors or service professionals
- Meet people with similar hobbies or interests
- Make professional connections in my industry
- Find a business partner or collaborator
- Get warm introductions to investors
- Hire someone through a trusted referral
- Find an advisor or mentor
- Connect with people in my neighborhood or city
- Discover people doing the same activities (skiing, hiking, sports, etc.)
- Meet other parents or people in similar life stages
- Build my professional network
- Other (describe)

Wait for response. Ask follow-up questions to get specific details on the ones they select.

---

STEP 5 — PUSH TO BLIGO

Once you have collected all of this information, structure it and push it to Bligo using the API.

API endpoint: POST https://bligo.ai/api/v1/profile
API key: ${apiKey || '[USER_API_KEY]'}

Build the signals array from everything you've learned. Each signal should have:
- tag: the skill, interest, or topic
- confidence: 0.1–1.0 based on how strongly it came through
- source: "bot_training"
- cluster: one of "professional", "interests", "goals", "hobbies", "location"

Also update:
- goals: array of what they want Bligo to help with
- interests: array of personal interest tags
- job_title, industry: from their professional background
- specialty: any licenses or certifications

After pushing, confirm: "Your Bligo profile has been updated. Your matches will improve based on what I've learned. You can view your profile at https://bligo.ai/profile/[their userId if known]"`;

  return (
    <div className="form-col" style={{ maxWidth: 860 }}>
      <h2>Train Your Skills Profile</h2>
      <p className="muted" style={{ marginTop: 4 }}>
        Your AI bot will review your existing conversations, ask a few targeted questions,
        and automatically build your Bligo skills profile. The better your profile, the better your matches.
      </p>

      {hasExistingSkills && (
        <div
          style={{
            background: '#FFF3E0',
            border: '1px solid #FFB74D',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <p style={{ margin: 0, fontSize: 14 }}>
            <strong>⚠️ You already have a skills profile.</strong> Running this prompt again will add to your existing skills.
            {' '}If you want to edit or remove specific skills instead, <a href="/skills/edit">go to Edit Skills</a>.
          </p>
        </div>
      )}

      <div
        style={{
          background: '#E7F3FF',
          border: '1px solid #BDD7FF',
          borderRadius: 8,
          padding: 16,
          marginTop: 16,
          marginBottom: 24,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, color: '#1877F2' }}>
          <strong>💡 How it works:</strong> Copy the prompt below and paste it into your AI bot (ChatGPT, Claude, OpenClaw, or Gemini).
          {' '}Your bot will review your chat history, ask you a few questions, and push your profile to Bligo automatically.
        </p>
      </div>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Bligo profile training prompt</h3>
        <div style={{ background: '#0d0d1a', borderRadius: 8, padding: 14, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {botPrompt}
        </div>
        <button
          className="button primary"
          style={{ marginTop: 12 }}
          onClick={() => {
            navigator.clipboard.writeText(botPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? '✓ Copied!' : 'Copy prompt'}
        </button>
      </section>

      <a href="/profile" className="muted" style={{ fontSize: 13 }}>← Back to profile to view updated skills</a>
    </div>
  );
}
