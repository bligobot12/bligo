'use client';
import { useState, useEffect, useRef } from 'react';

const SYSTEM_PROMPT = `You are a professional skills extractor for Bligo, a trust-based networking platform.
Your job is to have a friendly conversation to discover the user's professional skills across 6 categories:
1. Work history & experience
2. Technical skills & tools
3. Industry knowledge
4. Soft skills & strengths
5. Current projects & focus areas
6. Certifications & credentials

Ask one focused question at a time. After 6-8 exchanges, say "I have enough to generate your skills profile" and end with EXACTLY this JSON block on its own line:
SKILLS_JSON:{"signals":[{"tag":"skill name","confidence":0.0-1.0,"source":"guided_chat","cluster":"category"}]}

Confidence guide: 0.9+ = expert/certified, 0.7-0.9 = strong/experienced, 0.5-0.7 = working knowledge, 0.3-0.5 = familiar.
Categories for cluster field: work_history, technical, industry, soft_skills, current_focus, credentials.
Extract 8-15 skills. Be conversational and encouraging. Start by introducing yourself briefly and asking about their current work.`;

export default function SkillsPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch('/api/settings/apikey').then((r) => r.json()).then((d) => setApiKey(d.apiKey || ''));
    startChat();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function startChat() {
    setLoading(true);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: 'Hello, I want to build my skills profile.' }],
      }),
    });
    const data = await res.json().catch(() => ({}));
    const text = data.content?.[0]?.text || 'Hi — let\'s build your skills profile. What are you working on right now?';
    setMessages([
      { role: 'user', content: 'Hello, I want to build my skills profile.' },
      { role: 'assistant', content: text },
    ]);
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: newMessages,
      }),
    });
    const data = await res.json().catch(() => ({}));
    const text = data.content?.[0]?.text || 'Got it — tell me a bit more about your hands-on experience and strongest tools.';
    const updated = [...newMessages, { role: 'assistant', content: text }];
    setMessages(updated);
    setLoading(false);

    if (text.includes('SKILLS_JSON:')) {
      await extractAndSave(text);
    }
  }

  async function extractAndSave(text) {
    try {
      const match = text.match(/SKILLS_JSON:(\{.*\})/s);
      if (!match) return;
      const { signals } = JSON.parse(match[1]);
      setSaving(true);
      await fetch('/api/profile/update-signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals }),
      });
      setSaving(false);
      setSaved(true);
    } catch (e) {
      console.error('Failed to save signals', e);
      setSaving(false);
    }
  }

  const botPrompt = `You are helping me build my Bligo AI skills profile. Ask me questions about:
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
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>AI Skills Training</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          Build your AI Designated Skills profile through conversation. Choose the guided chat below or take the prompt to your own bot.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>💬 Chat with Bligo AI</h3>
            {saved && <span style={{ color: '#4ade80', fontSize: 13 }}>✓ Skills saved to profile!</span>}
            {saving && <span className="muted" style={{ fontSize: 13 }}>Saving skills...</span>}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user' ? '#7c6af7' : '#1e1e2e',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 14,
                lineHeight: 1.5,
              }}>
                {m.content.replace(/SKILLS_JSON:.*/s, '✓ Skills extracted and saved to your profile!')}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#1e1e2e', borderRadius: 12, padding: '10px 14px', fontSize: 14 }}>
                <span className="muted">Thinking...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              style={{ flex: 1, fontSize: 14 }}
              placeholder="Type your answer..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading || saved}
            />
            <button className="button primary" onClick={sendMessage} disabled={loading || saved}>
              Send
            </button>
          </div>
          {!saved && (
            <button
              className="button"
              style={{ marginTop: 8, fontSize: 12 }}
              onClick={() => extractAndSave(messages.findLast((m) => m.role === 'assistant')?.content || '')}
            >
              Save skills now
            </button>
          )}
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
          <h3 style={{ margin: '0 0 8px' }}>🤖 Use your own bot</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
            Copy this prompt into OpenClaw, ChatGPT, or any AI assistant. Your bot will ask you questions and automatically push your skills to Bligo.
          </p>
          <div style={{ flex: 1, background: '#0d0d1a', borderRadius: 8, padding: 14, overflowY: 'auto', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {botPrompt}
          </div>
          <button
            className="button primary"
            style={{ marginTop: 12 }}
            onClick={() => { navigator.clipboard.writeText(botPrompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          >
            {copied ? '✓ Copied!' : 'Copy prompt'}
          </button>
          <p className="muted" style={{ fontSize: 11, marginTop: 8, textAlign: 'center' }}>
            Your API key is embedded in the prompt so your bot can push skills directly to your profile.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <a href="/profile/me" className="muted" style={{ fontSize: 13 }}>← Back to profile</a>
      </div>
    </div>
  );
}
