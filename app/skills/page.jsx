'use client';

import { useState, useEffect } from 'react';

export default function SkillsPage() {
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewerUserId, setViewerUserId] = useState(null);

  useEffect(() => {
    fetch('/api/settings/apikey').then((r) => r.json()).then((d) => setApiKey(d.apiKey || ''));
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setViewerUserId(d.userId || null)).catch(() => {});
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
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>AI Skills Training</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          Copy this prompt into OpenClaw, ChatGPT, or any AI assistant. Your bot will ask you questions and automatically push your skills to Bligo.
        </p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 500 }}>
        <h3 style={{ margin: '0 0 8px' }}>🤖 Universal Bot Prompt</h3>
        <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
          Works with: OpenClaw · ChatGPT · Claude · Gemini · any AI assistant
        </p>

        <div style={{ flex: 1, background: '#F0F2F5', borderRadius: 8, padding: 14, overflowY: 'auto', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#050505', border: '1px solid #CED0D4' }}>
          {botPrompt}
        </div>

        <button
          className="button primary"
          style={{ marginTop: 12, width: 'fit-content' }}
          onClick={() => {
            navigator.clipboard.writeText(botPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? '✓ Copied!' : 'Copy prompt'}
        </button>

        <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
          Your API key is embedded in the prompt so your bot can push skills directly to your profile.
        </p>
      </div>

      <div style={{ marginTop: 16, textAlign: 'center', display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="/skills/edit" className="button" style={{ display: 'inline-block' }}>
          ✏️ Edit existing skills
        </a>
        <a href={viewerUserId ? `/profile/${viewerUserId}` : '/profile'} className="muted" style={{ fontSize: 13, alignSelf: 'center' }}>← Back to profile</a>
      </div>
    </div>
  );
}
