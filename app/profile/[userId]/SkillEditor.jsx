'use client';

import { useState, useTransition } from 'react';
import { addSkillAction, removeSkillAction } from '../actions';

export default function SkillEditor({ initialSkills = [], userId }) {
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();

  const addSkill = (skill) => {
    const clean = String(skill || '').trim();
    if (!clean) return;
    startTransition(async () => {
      await addSkillAction(userId, clean);
      setValue('');
    });
  };

  const removeSkill = (skill) => {
    startTransition(async () => {
      await removeSkillAction(userId, skill);
    });
  };

  return (
    <div>
      <input
        className="input"
        placeholder="Add skill..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addSkill(value);
          }
        }}
        disabled={isPending}
        style={{ marginBottom: 8 }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {(initialSkills || []).map((skill) => (
          <button
            key={skill}
            type="button"
            onClick={() => removeSkill(skill)}
            className="signal-chip"
            style={{ cursor: 'pointer' }}
            disabled={isPending}
            title="Click to remove"
          >
            {skill} ×
          </button>
        ))}
      </div>
    </div>
  );
}
