export const runtime = 'edge';

export default function AboutPage() {
  return (
    <>
      <section className="hero">
        <h1>About Bligo</h1>
        <p>
          Bligo is being built to make discovery less random and more intentional.
          We’re focused on helping people find relevant opportunities, communities,
          and conversations with less friction.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h3>Current phase</h3>
          <p>Production foundation deployed. Core pages and brand system in progress.</p>
        </article>
        <article className="card">
          <h3>Next up</h3>
          <p>Authentication, data model, onboarding flow, and user dashboard.</p>
        </article>
        <article className="card">
          <h3>Goal</h3>
          <p>A fast, trustworthy platform for real AI-assisted relationship building.</p>
        </article>
      </section>
    </>
  );
}
