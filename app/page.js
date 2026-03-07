import Link from 'next/link';

const features = [
  {
    title: 'AI Curation',
    text: 'Surface meaningful people, content, and ideas — not just noisy feeds.',
  },
  {
    title: 'Real Connections',
    text: 'Designed for quality interactions and intentional networking.',
  },
  {
    title: 'Fast + Reliable',
    text: 'Built on Next.js and deployed globally on Cloudflare Pages.',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>Real connections, curated by AI.</h1>
        <p>
          Bligo helps people discover the right conversations and opportunities faster.
          This is v1 of the product foundation — live, deployable, and ready to expand.
        </p>
        <div className="actions">
          <Link className="button primary" href="/contact">Join the waitlist</Link>
          <Link className="button" href="/about">See roadmap</Link>
        </div>
      </section>

      <section className="grid">
        {features.map((item) => (
          <article className="card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </section>
    </>
  );
}
