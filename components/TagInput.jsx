'use client';

import { useMemo, useState } from 'react';

function normalizeTag(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

export default function TagInput({
  name,
  label,
  defaultTags = [],
  placeholder = '',
}) {
  const [tags, setTags] = useState(
    (defaultTags || []).map(normalizeTag).filter(Boolean)
  );
  const [value, setValue] = useState('');

  const serialized = useMemo(() => tags.join(', '), [tags]);

  function addTag(raw) {
    const next = normalizeTag(raw);
    if (!next) return;
    const exists = tags.some((t) => t.toLowerCase() === next.toLowerCase());
    if (exists) return;
    setTags((prev) => [...prev, next]);
  }

  return (
    <div>
      <label className="muted">{label}</label>
      <div className="post-item" style={{ marginTop: 6 }}>
        <div className="actions" style={{ marginTop: 0, marginBottom: 8 }}>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="button"
              onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              title="Remove tag"
            >
              {tag} ×
            </button>
          ))}
          {tags.length === 0 ? <span className="muted">No tags added yet.</span> : null}
        </div>
        <input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(value);
              setValue('');
            }
            if (e.key === ',' && value.trim()) {
              e.preventDefault();
              addTag(value);
              setValue('');
            }
          }}
          placeholder={placeholder}
        />
      </div>
      <input type="hidden" name={name} value={serialized} />
    </div>
  );
}
