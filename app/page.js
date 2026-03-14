
import Image from 'next/image';
import Link from 'next/link';

const useCases = [
  {
    title: 'Professional Introductions',
    subtitle: 'Find the right expert.',
    text: 'Looking for a realtor, attorney, or contractor? Bligo surfaces trusted professionals in your network—friends-of-friends included—based on your exact needs and location.',
  },
  {
    title: 'Shared Plans & Hobbies',
    subtitle: 'Discover who’s doing what you’re doing.',
    text: 'Planning a ski trip? Bligo can show you which connections are heading to the same place—giving you the option to coordinate or connect.',
  },
  {
    title: 'Meaningful New Connections',
    subtitle: 'Meet people who genuinely align.',
    text: 'Love the same restaurants and music? Bligo highlights high-overlap introductions within your extended network so you can open a thoughtful conversation.',
  },
];

const comparisons = [
  {
    label: 'Facebook',
    points: [
      'Built for social posts',
      'Shows profiles',
      'Hard to find the right person',
    ],
  },
  {
    label: 'Indeed',
    points: [
      'Built for job listings',
      'Shows listings and resumes',
      'Limited to hiring',
    ],
  },
  {
    label: 'Bligo',
    points: [
      'Built for real-world connections',
      'Understands what you’re looking for',
      'Finds trusted matches across your network',
    ],
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero hero-split">
        <div>
          <span className="hero-kicker" style={{ background: '#E7F3FF', color: '#1877F2', border: '1px solid #BDD7FF', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>AI-driven introductions</span>
          <h1>Real Connections, Curated by AI</h1>
          <p>
            Bligo helps you unlock new connections across your personal network. Share your intent,
            and AI surfaces high-fit matches within your direct and extended circles.
          </p>
          <div className="actions">
            <Link className="button primary" href="/signup">Sign Up</Link>
            <Link className="button" href="/login">Log In</Link>
          </div>
        </div>
        <div className="hero-image-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
          <Image 
            src="/bot.png" 
            alt="Bligo AI assistant" 
            width={320} 
            height={320} 
            className="hero-image" 
            priority 
            style={{ borderRadius: 16 }} 
          />
        </div>
      </section>

      <section className="section-block">
        <h2>Built for real-world connections.</h2>
        <div className="grid">
          {useCases.map((item) => (
            <article className="card" key={item.title}>
              <p className="muted" style={{ marginBottom: 8 }}>{item.title}</p>
              <h3>{item.subtitle}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <h2>Why Bligo Works Better</h2>
        <p className="muted">Not another feed. Not another job board. A smarter way to connect through trusted people.</p>
        <div className="grid">
          {comparisons.map((item) => (
            <article className="card" key={item.label}>
              <h3>{item.label}</h3>
              <ul className="bullets" style={{ marginTop: 10 }}>
                {item.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="card" style={{ marginTop: 16, borderColor: '#BDD7FF', background: '#F5FAFF' }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#0F3E7A' }}>
            Facebook shows profiles.<br />
            Indeed shows listings.<br />
            Bligo understands what you&apos;re looking for.
          </p>
        </div>
      </section>

      <section className="section-block card">
        <h2>You stay in control.</h2>
        <ul className="bullets">
          <li>Intent and privacy toggles for every data point.</li>
          <li>Audit trail of each approved introduction.</li>
          <li>Both sides must accept before a conversation opens.</li>
          <li>Private, permission-based conversations with explicit acceptance from both sides.</li>
        </ul>
      </section>

    </>
  );
}
