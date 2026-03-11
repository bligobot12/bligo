'use client';

import { useEffect, useState } from 'react';

export default function AddSkillsPage() {
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/settings/apikey').then((r) => r.json()).then((d) => setApiKey(d.apiKey || '')).catch(() => {});
  }, []);

  const botPrompt = `You are helping me build my Bligo AI skills profile. This works with any AI including ChatGPT, Claude, and OpenClaw. Ask me questions about:
1. Work history & experience
2. Technical skills & tools
3. Industry knowledge
4. Soft skills & strengths
5. Current projects & focus areas
6. Certifications & credentials

After our conversation, extract my skills as a JSON array and call the Bligo API:

POST https://bligo.ai/api/v1/profile
Headers: x-api-key: ${apiKey || 'YOUR_API_KEY'}
Body: {"signals": [{"tag": "skill name", "confidence": 0.0-1.0, "source": "bot_training", "cluster": "category"}]}

Confidence: 0.9+ expert, 0.7-0.9 strong, 0.5-0.7 working knowledge. Extract 8-15 skills.
Start by asking about my current work.`;

  return (
    <div className="form-col" style={{ maxWidth: 860 }}>
      <h2 style={{ marginBottom: 4 }}>Add Skills with Your Bot</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        This is ongoing — come back anytime to run another skills session and keep your profile fresh.
      </p>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>How to add skills</h3>
        <ol style={{ lineHeight: 1.8, paddingLeft: 18 }}>
          <li>Copy your Bligo API key in <a href="/settings/api">Settings → API & Onboarding</a>.</li>
          <li>Copy the bot prompt below.</li>
          <li>Open your bot (ChatGPT, Claude, OpenClaw, Gemini).</li>
          <li>Paste the prompt and start the conversation.</li>
          <li>Your bot pushes the skills to Bligo automatically.</li>
        </ol>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Bot prompt</h3>
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
