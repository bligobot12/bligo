import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

const groups = [
  'Westchester Homeowners',
  'Startup Builders',
  'Weekend Ski Crew',
  'Real Estate Investors',
  'NYC Parents',
  'Local Contractors Network',
];

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect('/login');

  return (
    <div className="form-col" style={{ maxWidth: 960 }}>
      <section className="card">
        <h2>Discover Groups</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Explore communities in your extended network. (UI scaffold)
        </p>
      </section>

      <section className="grid" style={{ marginTop: 4 }}>
        {groups.map((name, idx) => (
          <article className="card" key={name}>
            <h3 style={{ marginTop: 0 }}>{name}</h3>
            <p className="muted">{120 + idx * 37} members</p>
            <button className="button primary" type="button">Join</button>
          </article>
        ))}
      </section>
    </div>
  );
}
