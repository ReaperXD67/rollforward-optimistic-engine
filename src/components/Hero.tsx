import { ArrowDown, CircleDotDashed } from 'lucide-react';

export function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-ambient" aria-hidden="true" />
      <div className="hero-copy">
        <p className="overline">Optimistic operations, without optimistic assumptions</p>
        <h1 id="hero-title">
          Act now. Reconcile <span className="inline-visual" aria-hidden="true" /> truth later.
        </h1>
        <p className="hero-lede">
          A release-command surface that makes speculative state, server truth, conflicts,
          and recovery visible in one deterministic timeline.
        </p>
        <div className="hero-actions">
          <a className="button button-primary" href="#command-deck">
            Stress the system <ArrowDown size={17} aria-hidden="true" />
          </a>
          <a className="button button-secondary" href="#system">
            Read the model
          </a>
        </div>
      </div>
      <div className="hero-media" aria-hidden="true">
        <img
          src="https://picsum.photos/seed/release-command-center/1400/1600"
          alt=""
          width="1400"
          height="1600"
        />
        <div className="hero-media-grid" />
        <div className="signal-card signal-card-top">
          <CircleDotDashed size={17} />
          <span>intent projected</span>
          <strong>12 ms</strong>
        </div>
        <div className="signal-card signal-card-bottom">
          <span className="signal-pulse" />
          <span>server reconciliation</span>
          <strong>healthy</strong>
        </div>
      </div>
      <div className="hero-rail" aria-hidden="true">
        <span>Latency is a state</span>
        <span>Failure is a path</span>
        <span>Truth is versioned</span>
      </div>
    </section>
  );
}

