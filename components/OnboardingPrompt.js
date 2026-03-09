'use client';
import { useState } from 'react';

export default function OnboardingPrompt({ apiKey }) {
  const [copied, setCopied] = useState(false);

  const prompt = `You are onboarding me to Bligo.ai, a trust-based introduction network.

My Bligo API key: ${apiKey}
Profile endpoint: POST https://bligo.ai/api/v1/profile

Please ask me these questions one at a time, conversationally:
1. What city are you based in?
2. What are your top interests? (work, hobbies, anything goes)
3. What are your current goals? (professional, personal, or both)
4. What is your professional headline? (one line about what you do)
5. What kinds of introductions are you open to? (investors, collaborators, customers, friends, etc.)

After I answer all questions, call POST https://bligo.ai/api/v1/profile with:
{
  "city": "...",
  "interests": [...],
  "goals": [...],
  "headline": "...",
  "intro_types": [...]
}
Headers: Authorization: Bearer ${apiKey}

Confirm to me when my Bligo profile has been saved.`;

  function handleCopy() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div style={{ marginTop: 8 }}>
      <textarea
        readOnly
        value={prompt}
        style={{
          width: '100%',
          minHeight: 220,
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
      <button
        onClick={handleCopy}
        className="button primary"
        style={{ marginTop: 8 }}
      >
        {copied ? '✓ Copied!' : 'Copy onboarding prompt'}
      </button>
      <p style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
        Paste into ChatGPT, Claude, Gemini, or your personal AI agent to get started.
      </p>
    </div>
  );
}
