'use client';

export default function OnboardingCompleteButton() {
  return (
    <button
      className="button primary"
      style={{ marginTop: 24 }}
      onClick={async () => {
        const res = await fetch('/api/complete-onboarding', { method: 'POST' });
        const text = await res.text();
        if (res.ok) {
          window.location.href = '/home';
        } else {
          alert('Error: ' + res.status + ' — ' + text);
        }
      }}
    >
      Go to my feed →
    </button>
  );
}
