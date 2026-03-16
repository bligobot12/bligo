import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { createGroupAction } from '../actions';

export default async function NewGroupPage({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=' + encodeURIComponent('Supabase env not configured'));

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 40 }}>
      <p>Please <a href="/login">log in</a> to view this page.</p>
    </div>
  );

  const params = await searchParams;
  const error = params?.error ? decodeURIComponent(params.error) : '';

  return (
    <div className="form-col" style={{ maxWidth: 760 }}>
      <section className="card">
        <h2 style={{ marginBottom: 6 }}>Create a Group</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Build a community around shared goals, projects, neighborhoods, or interests.
        </p>

        {error ? <p style={{ color: '#ff9da3' }}>{error}</p> : null}

        <form action={createGroupAction} className="form-col" style={{ marginTop: 12 }}>
          <label>
            Group Name
            <input className="input" name="name" required placeholder="e.g., Weekend Ski Crew" />
          </label>

          <label>
            Description
            <textarea
              className="input"
              name="description"
              rows={4}
              required
              placeholder="What is this group about, and who should join?"
            />
          </label>

          <label>
            Privacy Type
            <select className="input" name="privacy" required defaultValue="public">
              <option value="public">Public — anyone can join</option>
              <option value="private">Private — join requests require admin approval</option>
            </select>
          </label>

          <label>
            Location (optional)
            <input className="input" name="location" placeholder="e.g., Westchester, NY" />
          </label>

          <label>
            Category (optional)
            <input className="input" name="category" placeholder="e.g., Real Estate, Parents, Startups" />
          </label>

          <label className="muted">Group Image URL (optional)</label>
          <input
            className="input"
            name="avatar_url"
            placeholder="https://... or leave blank for default"
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="button primary" type="submit">Create Group</button>
            <Link className="button" href="/groups">Cancel</Link>
          </div>
        </form>
      </section>
    </div>
  );
}
