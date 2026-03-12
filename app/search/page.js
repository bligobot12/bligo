'use client';
import { useState } from 'react';
import Avatar from '../../components/Avatar';

const INTENT_TYPES = [
  { value: 'trade_service', label: '🔨 Local Trade/Service' },
  { value: 'investment', label: '💰 Investment/Capital' },
  { value: 'advisory', label: '🧠 Advisory/Mentorship' },
  { value: 'partnership', label: '🤝 Partnership' },
  { value: 'virtual_service', label: '💻 Virtual Service' },
  { value: 'vendor_supplier', label: '📦 Vendor/Supplier' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [classifying, setClassifying] = useState(false);
  const [classified, setClassified] = useState(null);
  const [intentOverride, setIntentOverride] = useState(null);
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setClassifying(true);
    setResults(null);
    setError(null);
    setClassified(null);

    const classRes = await fetch('/api/search/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const classData = await classRes.json();
    setClassified(classData);
    setIntentOverride(null);
    setClassifying(false);

    await runSearch(classData.intent_type, classData.intent_tags, classData.location);
  }

  async function runSearch(intent_type, intent_tags, location) {
    setSearching(true);
    const res = await fetch('/api/search/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, intent_type, intent_tags, location, max_results: 20 }),
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else setResults(data.results || []);
    setSearching(false);
  }

  async function handleIntentChange(newIntent) {
    setIntentOverride(newIntent);
    if (classified) {
      await runSearch(newIntent, classified.intent_tags, classified.location);
    }
  }

  const activeIntent = intentOverride || classified?.intent_type;

  return (
    <div className="form-col" style={{ maxWidth: 860 }}>
      <section className="card">
        <h2>Search</h2>
        <p className="muted" style={{ marginBottom: 4 }}>
          Describe what you're looking for in plain English.
        </p>
        <p className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
          💡 <strong>Best results:</strong> search using your AI bot via the API — it sends richer context automatically.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="e.g. framing contractor in Westchester, or SaaS startup advisor"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className="button primary"
            onClick={handleSearch}
            disabled={classifying || searching}
          >
            {classifying ? 'Classifying...' : searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {classified && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 13 }}>Searching as:</span>
            <select
              className="input"
              style={{ width: 'auto', fontSize: 13, padding: '4px 8px' }}
              value={activeIntent}
              onChange={(e) => handleIntentChange(e.target.value)}
            >
              {INTENT_TYPES.map((i) => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
            {classified.location && (
              <span className="signal-chip">📍 {classified.location}</span>
            )}
            {classified.intent_tags?.length > 0 && (
              <span className="muted" style={{ fontSize: 12 }}>
                Tags: {classified.intent_tags.join(', ')}
              </span>
            )}
          </div>
        )}
      </section>

      {error && (
        <div className="card" style={{ borderColor: '#ff6b6b' }}>
          <p style={{ color: '#ff6b6b', margin: 0 }}>{error}</p>
        </div>
      )}

      {results !== null && (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>{results.length} result{results.length !== 1 ? 's' : ''}</h3>
          {results.length === 0 && (
            <p className="muted">No matches found. Try broadening your search or removing the location.</p>
          )}
          {results.map((r) => (
            <div key={r.user_id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid #2a2a2a' }}>
              <a href={`/profile/${r.user_id}`}>
                <Avatar src={r.avatar_url} name={r.display_name} size={52} />
              </a>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <a href={`/profile/${r.user_id}`} style={{ fontWeight: 700, fontSize: 15, textDecoration: 'none', color: '#fff' }}>
                    {r.display_name}
                  </a>
                  {r.degree && (
                    <span className="muted" style={{ fontSize: 12 }}>· {r.degree === 1 ? '1st' : '2nd'}</span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#7c6af7', fontWeight: 700 }}>
                    {r.score}pts
                  </span>
                </div>
                {(r.job_title || r.headline) && (
                  <p className="muted" style={{ margin: '3px 0', fontSize: 13 }}>
                    {r.job_title || r.headline}
                  </p>
                )}
                {r.specialty?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '6px 0' }}>
                    {r.specialty.slice(0, 5).map((s) => (
                      <span key={s} className="signal-chip" style={{ fontSize: 11 }}>{s}</span>
                    ))}
                  </div>
                )}
                {r.why && (
                  <p className="muted" style={{ fontSize: 12, margin: '4px 0' }}>✓ {r.why}</p>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <a href={`/profile/${r.user_id}`} className="button" style={{ fontSize: 12, padding: '4px 14px' }}>
                    View profile
                  </a>
                  <a href={`/messages/${r.user_id}`} className="button" style={{ fontSize: 12, padding: '4px 14px' }}>
                    Message
                  </a>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
