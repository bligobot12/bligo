'use client';

import { useState } from 'react';

export default function SkillsAddTabs({ apiKey, userId, hasExistingSkills }) {
  const [activeTab, setActiveTab] = useState('openclaw');
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const tabs = [
    { id: 'openclaw', label: '🤖 OpenClaw / API bots' },
    { id: 'chatgpt', label: '💬 ChatGPT' },
    { id: 'claude', label: '🧠 Claude / Gemini' },
  ];

  const baseInterview = `You are now connecting to Bligo — an AI-powered connections platform that finds real, trusted introductions based on who you are and what you're looking for.

The more Bligo knows about you, the better your matches will be. Let's build your Bligo profile by reviewing our existing conversations and asking a few targeted questions.

---

STEP 1 — REVIEW EXISTING CHATS

Review our recent conversation history. Identify the 6 most prominent themes, interests, goals, or topics that come up most often. Present them like this:

"Based on our conversations, it looks like you're most interested in:
1. [Topic]
2. [Topic]
3. [Topic]
4. [Topic]
5. [Topic]
6. [Topic]

On a scale of 1–5, how would you rate your interest in each? (5 = very important, 1 = less so)"

Wait for response before continuing.

---

STEP 2 — PROFESSIONAL BACKGROUND

Ask these one at a time, naturally:

1. "What do you do for a living? Tell me about your current role."
2. "Do you have any professional licenses, certifications, designations, or specialized training? For example: real estate license, CPA, bar admission, PMP, medical credentials, trade certifications, etc."
3. "How long have you been doing this, and what are your strongest professional skills?"

---

STEP 3 — HOBBIES & INTERESTS

Ask: "Outside of work, what are you into? Hobbies, interests, things you do regularly — fitness, travel, sports, music, cooking, anything."

---

STEP 4 — WHAT YOU WANT FROM BLIGO

Say: "Now let's figure out what you want Bligo to help you with. Which of these apply to you? Pick as many as you want:"

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

Wait for response and ask follow-up questions on what they select.`;

  const openclawPrompt = `${baseInterview}

---

STEP 5 — PUSH TO BLIGO

Once you have collected everything, make this API call:

POST https://bligo.ai/api/v1/profile
Headers:
 Content-Type: application/json
 x-api-key: ${apiKey}

Body:
{
 "signals": [
 // array of { tag, confidence (0.1-1.0), source: "bot_training", cluster: "professional"|"interests"|"goals"|"hobbies" }
 ],
 "goals": [], // array of goal strings from Step 4
 "interests": [], // array of interest tags
 "job_title": "", // from Step 2
 "industry": "", // from Step 2
 "specialty": [] // licenses/certifications from Step 2
}

After pushing successfully, confirm: "Your Bligo profile has been updated! Your matches will now improve. Visit https://bligo.ai/matches to see your matches."`;

  const chatgptPrompt = `${baseInterview}

---

STEP 5 — FORMAT YOUR PROFILE DATA

Once you have collected everything, format the data as JSON exactly like this and show it to the user so they can save it to Bligo:

{
 "signals": [
 { "tag": "example skill", "confidence": 0.9, "source": "bot_training", "cluster": "professional" }
 ],
 "goals": ["find contractors", "meet investors"],
 "interests": ["skiing", "real estate"],
 "job_title": "Property Manager",
 "industry": "Real Estate",
 "specialty": ["Licensed Realtor", "CPM"]
}

Tell the user: "Here is your Bligo profile data. Copy the JSON above and paste it into the box on the Bligo skills page to save it to your profile."`;

  const claudePrompt = `${baseInterview}

---

STEP 5 — SUMMARIZE YOUR PROFILE

Once you have collected everything, output a clean summary like this:

BLIGO PROFILE SUMMARY
Job Title: [title]
Industry: [industry]
Specialty/Licenses: [list]
Top Skills: [list of tags with confidence 1-10]
Interests: [list]
Goals on Bligo: [list]

Tell the user: "Here is your Bligo profile summary. Copy it and paste it into the box on the Bligo skills page — Bligo will read it and update your profile automatically."`;

  function getPrompt() {
    if (activeTab === 'openclaw') return openclawPrompt;
    if (activeTab === 'chatgpt') return chatgptPrompt;
    return claudePrompt;
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(getPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveFromPaste() {
    if (!jsonInput.trim()) return;
    setSaving(true);
    setSaveStatus('');

    try {
      let payload;
      try {
        payload = JSON.parse(jsonInput);
      } catch {
        payload = { raw_summary: jsonInput };
      }

      const res = await fetch('/api/v1/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveStatus('✅ Profile updated successfully! Visit your matches to see improvements.');
        setJsonInput('');
      } else {
        const d = await res.json().catch(() => ({}));
        setSaveStatus(`❌ Error: ${d.error || 'Something went wrong'}`);
      }
    } catch {
      setSaveStatus('❌ Could not save. Make sure you copied the full output from your bot.');
    }
    setSaving(false);
  }

  return (
    <div>
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
            <strong>⚠️ You already have a skills profile.</strong> Running this prompt will add to your existing skills.
            {' '}Want to edit or remove skills instead? <a href="/skills/edit">Edit Skills →</a>
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCopied(false);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 13,
              cursor: 'pointer',
              border: activeTab === tab.id ? 'none' : '1px solid #CED0D4',
              background: activeTab === tab.id ? '#1877F2' : '#F0F2F5',
              color: activeTab === tab.id ? 'white' : '#050505',
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        style={{
          background: '#E7F3FF',
          border: '1px solid #BDD7FF',
          borderRadius: 8,
          padding: 14,
          marginBottom: 16,
          fontSize: 13,
          color: '#1877F2',
        }}
      >
        {activeTab === 'openclaw' && (
          <span>💡 <strong>OpenClaw or any API-enabled bot:</strong> Copy the prompt and paste it into your bot. It will interview you and push your profile to Bligo automatically.</span>
        )}
        {activeTab === 'chatgpt' && (
          <span>💡 <strong>ChatGPT:</strong> Copy the prompt and paste it into ChatGPT. After the interview, ChatGPT will output your profile as JSON. Paste that JSON into the box below to save it.</span>
        )}
        {activeTab === 'claude' && (
          <span>💡 <strong>Claude or Gemini:</strong> Copy the prompt and paste it into Claude or Gemini. After the interview, copy the profile summary it outputs and paste it into the box below.</span>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          readOnly
          value={getPrompt()}
          style={{
            width: '100%',
            height: 200,
            padding: 14,
            background: '#F0F2F5',
            border: '1px solid #CED0D4',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'monospace',
            lineHeight: 1.6,
            resize: 'none',
            color: '#050505',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={copyPrompt}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: copied ? '#42B72A' : '#1877F2',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {copied ? '✓ Copied!' : 'Copy prompt'}
        </button>
      </div>

      {(activeTab === 'chatgpt' || activeTab === 'claude') && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>
            {activeTab === 'chatgpt' ? 'Paste your JSON output here' : 'Paste your profile summary here'}
          </h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
            {activeTab === 'chatgpt'
              ? 'After ChatGPT outputs your profile JSON, paste it below and click Save.'
              : 'After Claude or Gemini outputs your profile summary, paste it below and click Save.'}
          </p>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={activeTab === 'chatgpt'
              ? '{ "signals": [...], "goals": [...], ... }'
              : 'BLIGO PROFILE SUMMARY\nJob Title: ...\n...'}
            style={{
              width: '100%',
              height: 160,
              padding: 14,
              background: '#F0F2F5',
              border: '1px solid #CED0D4',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'monospace',
              lineHeight: 1.6,
              resize: 'vertical',
              color: '#050505',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={saveFromPaste}
            disabled={saving || !jsonInput.trim()}
            style={{
              marginTop: 10,
              background: '#1877F2',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving || !jsonInput.trim() ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save to Bligo profile'}
          </button>
          {saveStatus && (
            <p
              style={{
                marginTop: 10,
                fontSize: 13,
                color: saveStatus.startsWith('✅') ? '#42B72A' : '#FA3E3E',
              }}
            >
              {saveStatus}
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
        <a href="/skills/edit" className="button" style={{ fontSize: 13 }}>✏️ Edit existing skills</a>
        <a href={`/profile/${userId}`} className="button" style={{ fontSize: 13 }}>← Back to profile</a>
      </div>
    </div>
  );
}
