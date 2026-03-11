
import Image from 'next/image';
import Link from 'next/link';

const steps = [
  {
    index: '01 · Activate',
    title: 'Set your intent',
    text: 'Create your profile, define your goals, and control exactly what’s visible and what stays private.',
  },
  {
    index: '02 · Match',
    title: 'Review connections',
    text: 'AI identifies and ranks high-fit matches across your direct and extended network based on your intent.',
  },
  {
    index: '03 · Introduce',
    title: 'Connect with consent',
    text: 'Approve the introduction, send a soft request, and converse only when the other person accepts.',
  },
];

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

const roadmap = [
  { quarter: 'Q1', title: 'Intent Profiles', text: 'Fine-grained controls for what your AI can share publicly vs privately.' },
  { quarter: 'Q2', title: 'Trust Layer', text: 'Mutual-consent intros with transparent reason codes for every match.' },
  { quarter: 'Q3', title: 'Operator Feed', text: 'A live opportunity feed built from your preferences and trusted network graph.' },
];

export default function HomePage() {
  return (
    <>
      <section className="hero hero-split">
        <div>
          <span className="hero-kicker">AI-driven introductions</span>
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
        <div className="hero-image-wrap">
          <Image src="/bot.png" alt="Bligo AI assistant" width={760} height={500} className="hero-image" priority />
        </div>
      </section>

      <section className="section-block">
        <h2>How it works</h2>
        <p className="muted">Tell AI what you’re looking for. Discover your best-fit connections.</p>
        <div className="grid">
          {steps.map((step) => (
            <article className="card" key={step.index}>
              <p className="muted" style={{ marginBottom: 8 }}>{step.index}</p>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
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

      <section className="section-block card">
        <h2>You stay in control.</h2>
        <ul className="bullets">
          <li>Intent and privacy toggles for every data point.</li>
          <li>Audit trail of each approved introduction.</li>
          <li>Both sides must accept before a conversation opens.</li>
          <li>Private, permission-based conversations with explicit acceptance from both sides.</li>
        </ul>
      </section>

      <section className="section-block">
        <h2>What’s next</h2>
        <div className="grid">
          {roadmap.map((item) => (
            <article className="card" key={item.quarter}>
              <p className="muted" style={{ marginBottom: 8 }}>{item.quarter}</p>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
