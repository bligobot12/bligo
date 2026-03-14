export const metadata = {
  title: 'Backend Status',
};

export default function BackendStatusPage() {
  const now = new Date().toISOString();

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24, lineHeight: 1.5 }}>
      <h1 style={{ marginTop: 0 }}>Backend Status</h1>
      <p>✅ Backend status page is running.</p>
      <p><strong>Runtime:</strong> Edge</p>
      <p><strong>Checked at:</strong> {now}</p>
      <p>This page does not use filesystem access.</p>
    </main>
  );
}
