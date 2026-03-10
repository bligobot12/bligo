import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { runSearchByQueryAction, searchUsersAction } from './actions';
import { getDegreLabel } from '../../lib/ui/getDegreeLabel';

function TierSection({ title, rows, type, viaById }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      <div className="feed" style={{ marginTop: 8 }}>
        {rows.map((row) => (
          <div key={row.user_id} className="post-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <div>
                <strong>{row.display_name || 'Unnamed user'} <span className="degree-badge">{getDegreLabel(type === 'first' ? 1 : type === 'second' ? 2 : row.via ? 3 : null)}</span></strong>
                <p className="muted">{row.headline || 'No headline yet'}</p>
                <p className="muted">{row.city || 'City not set'}</p>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{row.match_pct}%</div>
            </div>
            {row.via ? <p className="muted" style={{ marginTop: 6 }}>Via {viaById[row.via] || 'a trusted connection'}</p> : null}
            <div className="actions" style={{ marginTop: 10 }}>
              {type === 'first' ? (
                <button className="button" type="button" disabled>Message (soon)</button>
              ) : (
                <Link className="button" href="/connections">Connect</Link>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 ? <p className="muted">No matches in this tier yet.</p> : null}
      </div>
    </section>
  );
}

export default async function SearchPage({ searchParams }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) redirect('/login');

  const params = await searchParams;
  const q = String(params?.q || '').trim();
  const error = params?.error ? decodeURIComponent(params.error) : '';

  let latest = null;
  let actionError = '';

  if (q) {
    const run = await runSearchByQueryAction(q);
    if (run?.error) actionError = run.error;
  }

  const { data: latestSearch } = await supabase
    .from('searches')
    .select('query, results, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  latest = latestSearch;

  const results = latest?.results && typeof latest.results === 'object'
    ? latest.results
    : { first: [], second: [], third: [] };

  const viaIds = [
    ...new Set([...(results.second || []).map((r) => r.via), ...(results.third || []).map((r) => r.via)].filter(Boolean)),
  ];

  const { data: viaProfiles } = viaIds.length
    ? await supabase.from('profiles').select('user_id, display_name, username').in('user_id', viaIds)
    : { data: [] };

  const viaById = Object.fromEntries(
    (viaProfiles || []).map((p) => [p.user_id, p.display_name || p.username || 'connection'])
  );

  return (
    <div className="form-col" style={{ maxWidth: 980 }}>
      <section className="card">
        <h2>Search</h2>
        <p className="muted">Search privately across your trust graph.</p>
        <form action={searchUsersAction} className="form-col" style={{ marginTop: 10 }}>
          <input className="input" name="query" placeholder="Try: founder fintech nyc" defaultValue={q || latest?.query || ''} />
          <div className="actions" style={{ marginTop: 0 }}>
            <button className="button primary" type="submit">Search</button>
          </div>
        </form>
        {error ? <p style={{ color: '#ff9da3', marginTop: 8 }}>{error}</p> : null}
        {actionError ? <p style={{ color: '#ff9da3', marginTop: 8 }}>{actionError}</p> : null}
      </section>

      <TierSection title="Your connections (1st)" rows={results.first || []} type="first" viaById={viaById} />
      <TierSection title="Friends of friends (2nd)" rows={results.second || []} type="second" viaById={viaById} />
      <TierSection title="Extended network (3rd+)" rows={results.third || []} type="third" viaById={viaById} />
    </div>
  );
}
