export const runtime = 'edge';

import fs from 'fs';
import path from 'path';

export default function BackendStatusPage() {
  const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let schemaExists = false;
  try {
    schemaExists = fs.existsSync(path.join(process.cwd(), 'supabase', 'schema.sql'));
  } catch {}

  return (
    <section className="card">
      <h2>Backend Status</h2>
      <p className="muted">Supabase production backend scaffold has been added.</p>
      <ul>
        <li>Supabase env configured: <strong>{hasEnv ? 'Yes' : 'No'}</strong></li>
        <li>Schema file present: <strong>{schemaExists ? 'Yes' : 'No'}</strong></li>
      </ul>
      <p className="muted">Next step: add keys in env + run schema in Supabase SQL editor.</p>
    </section>
  );
}
