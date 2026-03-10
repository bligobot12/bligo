'use client';
import { useState } from 'react';

export default function SkillEditor({ initialSkills = [], userId, addAction, removeAction }) {
  const [skills] = useState(initialSkills);
  const [input, setValue] = useState('');

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {skills.map((skill) => (
          <span key={skill} className="signal-chip" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {skill}
            <form action={removeAction} style={{ display: 'inline' }}>
              <input type="hidden" name="userId" value={userId} />
              <input type="hidden" name="skill" value={skill} />
              <button type="submit" style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '0 2px', fontSize: 12 }}>×</button>
            </form>
          </span>
        ))}
        {skills.length === 0 && <p className="muted">No skills added yet.</p>}
      </div>
      <form action={addAction} style={{ display: 'flex', gap: 8 }}>
        <input type="hidden" name="userId" value={userId} />
        <input
          className="input"
          name="skill"
          value={input}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a skill..."
          style={{ flex: 1 }}
        />
        <button className="button" type="submit">Add</button>
      </form>
    </div>
  );
}
