'use client';
import { useState, useEffect, useRef } from 'react';


export default function SkillsPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewerUserId, setViewerUserId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch('/api/settings/apikey').then((r) => r.json()).then((d) => setApiKey(d.apiKey || ''));
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setViewerUserId(d.userId || null)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function startChat() {
    setLoading(true);
    const res = await fetch('/api/skills/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello, I want to build my skills profile.' }],
      }),
    });
    const data = await res.json().catch(() => ({}));
    const text = data.text || 'Hi — let\'s build your skills profile. What are you working on right now?';
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

    const res = await fetch('/api/skills/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    });
    const data = await res.json().catch(() => ({}));
    const text = data.text || 'Got it — tell me a bit more about your hands-on experience and strongest tools.';
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
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>AI Skills Training</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          Build your AI Designated Skills profile through conversation. Use the guided chat below, or copy the instructions into your preferred AI assistant.
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
            {messages.length === 0 && !loading ? (
              <div style={{ alignSelf: 'center', marginTop: 40 }}>
                <button className="button primary" onClick={startChat}>Start</button>
              </div>
            ) : null}
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
              disabled={loading || saved || messages.length === 0}
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
          <h3 style={{ margin: '0 0 8px' }}>🤖 Universal Bot Prompt</h3>
          <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
            Works with: OpenClaw · ChatGPT · Claude · Gemini · any AI assistant
          </p>
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

      <div style={{ marginTop: 16, textAlign: 'center', display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="/skills/edit" className="button" style={{ display: 'inline-block' }}>
          ✏️ Edit existing skills
        </a>
        <a href={viewerUserId ? `/profile/${viewerUserId}` : '/profile'} className="muted" style={{ fontSize: 13, alignSelf: 'center' }}>← Back to profile</a>
      </div>
    </div>
  );
}
