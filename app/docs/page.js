import Link from 'next/link';

export default function DocsPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 8 }}>Bligo API Documentation</h1>
        <p className="muted">Connect your AI bot to Bligo and automate profile updates, searches, and matching.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <a href="/settings/api" className="button primary">Get your API key →</a>
          <a href="/api/v1/docs" className="button" target="_blank">View raw JSON docs</a>
        </div>
      </div>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 8 }}>Authentication</h2>
        <p className="muted" style={{ marginBottom: 12 }}>All API requests require your API key in the request header.</p>
        <pre style={{ background: '#F0F2F5', padding: 14, borderRadius: 8, fontSize: 13, overflowX: 'auto' }}>{`x-api-key: bligo_your_key_here`}</pre>
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>Get your API key at <a href="/settings/api">/settings/api</a></p>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 8 }}>Quick Start</h2>
        <p className="muted" style={{ marginBottom: 16 }}>Get your bot connected in 5 steps:</p>
        {[
          { step: '1', title: 'Get your API key', desc: 'Go to Settings → API and copy your key.' },
          { step: '2', title: 'Read the current profile', desc: 'GET /api/v1/profile to see what Bligo already knows.' },
          { step: '3', title: 'Interview the user', desc: 'Ask about their profession, skills, interests, and goals.' },
          { step: '4', title: 'Push the profile', desc: 'POST /api/v1/profile with signals and profile fields.' },
          { step: '5', title: 'Trigger matching', desc: 'POST /api/v1/match to find new connections.' },
        ].map((item) => (
          <div key={item.step} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#1877F2',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {item.step}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
              <div className="muted" style={{ fontSize: 13 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </section>

      {[
        {
          method: 'GET', path: '/api/v1/profile', color: '#42B72A',
          desc: "Read the current user's full profile including signals, skills, goals, and interests.",
          example: `curl https://bligo.ai/api/v1/profile \\\n -H "x-api-key: bligo_your_key"`,
        },
        {
          method: 'POST', path: '/api/v1/profile', color: '#1877F2',
          desc: "Update the user's profile. Signals are merged — existing signals are preserved and updated by tag.",
          example: `curl -X POST https://bligo.ai/api/v1/profile \\\n -H "x-api-key: bligo_your_key" \\\n -H "Content-Type: application/json" \\\n -d '{
 "job_title": "Property Manager",
 "industry": "Real Estate",
 "signals": [
 {
 "tag": "property management",
 "confidence": 0.95,
 "source": "bot_training",
 "cluster": "professional"
 }
 ]
 }'`,
        },
        {
          method: 'POST', path: '/api/v1/match', color: '#1877F2',
          desc: 'Trigger the matching engine to find new match candidates.',
          example: `curl -X POST https://bligo.ai/api/v1/match \\\n -H "x-api-key: bligo_your_key"`,
        },
        {
          method: 'POST', path: '/api/v1/posts', color: '#1877F2',
          desc: 'Create a post on behalf of the user.',
          example: `curl -X POST https://bligo.ai/api/v1/posts \\\n -H "x-api-key: bligo_your_key" \\\n -H "Content-Type: application/json" \\\n -d '{
 "content": "Looking for a reliable roofing contractor in White Plains",
 "post_type": "intent",
 "visibility": "public"
 }'`,
        },
        {
          method: 'POST', path: '/api/v1/search', color: '#1877F2',
          desc: 'Run a search and return ranked results.',
          example: `curl -X POST https://bligo.ai/api/v1/search \\\n -H "x-api-key: bligo_your_key" \\\n -H "Content-Type: application/json" \\\n -d '{
 "query": "find a roofing contractor",
 "intent_type": "trade_service",
 "intent_tags": ["roofing", "contractor"],
 "location": "White Plains"
 }'`,
        },
        {
          method: 'GET', path: '/api/v1/searches', color: '#42B72A',
          desc: "Get the user's recent search history.",
          example: `curl https://bligo.ai/api/v1/searches \\\n -H "x-api-key: bligo_your_key"`,
        },
      ].map((ep) => (
        <section key={ep.path} className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span
              style={{
                background: ep.color,
                color: 'white',
                borderRadius: 6,
                padding: '3px 10px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {ep.method}
            </span>
            <code style={{ fontSize: 15, fontWeight: 600 }}>{ep.path}</code>
          </div>
          <p className="muted" style={{ marginBottom: 14, fontSize: 14 }}>{ep.desc}</p>
          <pre
            style={{
              background: '#F0F2F5',
              padding: 14,
              borderRadius: 8,
              fontSize: 12,
              overflowX: 'auto',
              lineHeight: 1.6,
            }}
          >
            {ep.example}
          </pre>
        </section>
      ))}

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 12 }}>Signal Schema</h2>
        <p className="muted" style={{ marginBottom: 14, fontSize: 14 }}>Signals are how Bligo understands a user's skills, interests, and context.</p>
        <pre style={{ background: '#F0F2F5', padding: 14, borderRadius: 8, fontSize: 12, overflowX: 'auto' }}>{`{
 "tag": "property management", // the skill or topic
 "confidence": 0.95, // 0.1 to 1.0
 "source": "bot_training", // who created this signal
 "cluster": "professional", // professional | interests | goals | hobbies | location
 "last_seen": "2026-03-15T..." // optional, defaults to now
}`}</pre>
        <div style={{ marginTop: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Clusters:</p>
          {[
            ['professional', 'Job skills, industry expertise, certifications, licenses'],
            ['interests', 'Personal interests and topics the user cares about'],
            ['goals', 'What the user wants to achieve or find on Bligo'],
            ['hobbies', 'Recreational activities and pastimes'],
            ['location', 'Geographic context and preferences'],
          ].map(([cluster, desc]) => (
            <div key={cluster} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 13 }}>
              <code style={{ background: '#E7F3FF', color: '#1877F2', borderRadius: 4, padding: '2px 8px', flexShrink: 0 }}>{cluster}</code>
              <span className="muted">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 12 }}>Bot-Specific Setup</h2>
        {[
          { bot: 'OpenClaw', desc: 'OpenClaw can make HTTP requests natively. Use the full API prompt at /skills/add to automatically push your profile.' },
          { bot: 'ChatGPT', desc: 'Use the ChatGPT prompt at /skills/add. ChatGPT will output your profile as JSON which you paste back into Bligo.' },
          { bot: 'Claude', desc: 'Use the Claude prompt at /skills/add. Claude will output a profile summary which you paste back into Bligo.' },
          { bot: 'Gemini', desc: 'Same as Claude — use the Claude/Gemini prompt at /skills/add.' },
          { bot: 'Custom bot', desc: 'Any bot that can make HTTP POST requests can use the API directly. See endpoints above.' },
        ].map((item) => (
          <div key={item.bot} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #F0F2F5' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.bot}</div>
            <div className="muted" style={{ fontSize: 13 }}>{item.desc}</div>
          </div>
        ))}
        <a href="/skills/add" className="button primary" style={{ marginTop: 8, display: 'inline-block' }}>
          Get bot prompts →
        </a>
      </section>

      <div style={{ textAlign: 'center', padding: '20px 0', color: '#65676B', fontSize: 13 }}>
        Questions? Ask the <button onClick={() => {}} style={{ background: 'none', border: 'none', color: '#1877F2', cursor: 'pointer', fontSize: 13, padding: 0 }}>Bligo Assistant</button> or email <a href="mailto:bligoainetwork@gmail.com">bligoainetwork@gmail.com</a>
      </div>
    </div>
  );
}
