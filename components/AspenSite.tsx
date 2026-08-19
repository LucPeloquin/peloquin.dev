'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const practiceAreas = [
  {
    id: '01',
    title: 'Quantitative Research',
    blurb:
      'Researchers who own a signal end to end, from first idea to live capital.',
    bullets: ['Signal research', 'Portfolio construction', 'Systematic equities and futures', 'PhD and post-doc moves'],
  },
  {
    id: '02',
    title: 'Engineering & Infrastructure',
    blurb:
      'The engineers who keep a strategy alive in production: execution, market data, and research platforms.',
    bullets: ['Low-latency C++', 'Execution and order routing', 'Market data pipelines', 'Research platform teams'],
  },
  {
    id: '03',
    title: 'AI & Machine Learning',
    blurb:
      'Researchers and engineers moving between frontier labs, venture-backed teams, and funds.',
    bullets: ['Applied AI engineering', 'ML and deep learning research', 'Training infrastructure', 'Founding technical hires'],
  },
  {
    id: '04',
    title: 'Leadership & Team Builds',
    blurb: 'Whole functions, not single seats. Searches that compound over years.',
    bullets: ['Heads of research', 'Engineering leadership', 'New desk buildouts', 'Multi-year hiring plans'],
  },
];

const clients = ['Headlands', 'Two Sigma', 'EQR - Citadel', 'Vatic Labs', 'GQS - Citadel', 'Syntria'];

export default function AspenSite() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 1100);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      {loading ? (
        <div className="loader-screen" aria-label="Site loading">
          <Image src="/images/placeholder.png" alt="Loading placeholder" width={240} height={240} priority />
        </div>
      ) : null}

      <main className="aspen-shell">
        <nav className="aspen-nav">
          <div className="aspen-logo">Aspen Search</div>
          <div className="aspen-links">
            <a href="#about">About</a>
            <a href="#clients">Clients</a>
            <a href="#team">Team</a>
          </div>
        </nav>

        <section className="hero">
          <p className="kicker">placingwinners.</p>
          <h1>
            Aspen
            <br />
            Search
          </h1>
          <p className="hero-copy">
            Placing software engineers, quantitative researchers, and AI/ML scientists into the firms shaping markets
            and technology since 2006.
          </p>
          <button className="cta">Start a conversation</button>
        </section>

        <section id="about" className="metrics">
          <article>
            <h3>500+</h3>
            <p>Placements since 2006</p>
          </article>
          <article>
            <h3>$1M-5M</h3>
            <p>Range of recent offers</p>
          </article>
          <article>
            <h3>19+</h3>
            <p>Years inside these hiring rooms</p>
          </article>
        </section>

        <section className="areas">
          <h2>Connecting top-tier talent</h2>
          <div className="area-grid">
            {practiceAreas.map((area) => (
              <article key={area.id} className="area-card">
                <p className="area-index">{area.id}</p>
                <h3>{area.title}</h3>
                <p>{area.blurb}</p>
                <ul>
                  {area.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="clients" className="clients">
          <h2>Clients</h2>
          <p>
            Our client relationships have existed for nearly two decades. We work with firms that pay the top of the
            market, run the best research environments, and treat hiring as a long game.
          </p>
          <div className="client-grid">
            {clients.map((client) => (
              <div key={client} className="client-pill">
                {client}
              </div>
            ))}
          </div>
        </section>

        <section id="team" className="team">
          <h2>Small team. High Signal.</h2>
          <p>
            Aspen is run by partners who do the work themselves. No spray-and-pray outreach. Every search is run from
            intake to offer by the same people you meet first.
          </p>
        </section>
      </main>
    </>
  );
}
