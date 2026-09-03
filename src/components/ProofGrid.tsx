import { Braces, GitCompareArrows, RadioTower, RotateCcw } from 'lucide-react';

const failureModes = [
  {
    title: 'Slow acknowledgement',
    copy: 'Intent renders immediately. The ledger exposes elapsed transport time without blocking the operator.',
    metric: '3,800 ms',
  },
  {
    title: 'Transient rejection',
    copy: 'The same idempotency key survives exponential backoff, so a retry cannot duplicate the operation.',
    metric: 'retry 2/3',
  },
  {
    title: 'Version conflict',
    copy: 'Remote truth replaces the stale base. Ambiguous intent is rolled back instead of silently overwriting it.',
    metric: 'HTTP 412',
  },
  {
    title: 'Offline intent',
    copy: 'A causal outbox preserves operator order and resumes only when transport is explicitly restored.',
    metric: 'local first',
  },
];

export function ProofGrid() {
  return (
    <section className="system-section" id="system" aria-labelledby="system-title">
      <div className="section-intro">
        <p className="overline">The operating model</p>
        <h2 id="system-title" className="word-reveal">
          {'Fast interfaces earn trust only when failure stays legible.'
            .split(' ')
            .map((word, index) => (
              <span key={`${word}-${index}`}>{word} </span>
            ))}
        </h2>
        <p>
          Most optimistic demos stop after the spinner disappears. This one starts where the
          happy path ends.
        </p>
      </div>

      <div className="proof-grid" aria-label="System capability overview">
        <article className="proof-card proof-card-wide stack-card">
          <div className="proof-card-icon"><GitCompareArrows size={22} aria-hidden="true" /></div>
          <div>
            <p className="overline">Two truths, one projection</p>
            <h3>Confirmed state never gets confused with intent.</h3>
          </div>
          <div className="truth-diagram" aria-hidden="true">
            <div><span>canonical</span><strong>v7</strong></div>
            <div className="truth-join"><i /><i /><i /></div>
            <div><span>projected</span><strong>v7 + 2</strong></div>
          </div>
        </article>
        <article className="proof-card proof-card-tall stack-card">
          <div className="proof-card-icon"><Braces size={22} aria-hidden="true" /></div>
          <p className="overline">Pure core</p>
          <h3>One reducer. Every outcome.</h3>
          <pre aria-label="Mutation state flow"><code>{`queued
  -> in_flight
    -> acknowledged
    -> retry_wait
    -> conflict
    -> rolled_back`}</code></pre>
        </article>
        <article className="proof-card proof-card-compact stack-card">
          <div className="proof-card-icon"><RadioTower size={22} aria-hidden="true" /></div>
          <p className="overline">Causal queue</p>
          <h3>Parallel across releases. Ordered within one.</h3>
        </article>
        <article className="proof-card proof-card-wide proof-card-accent stack-card">
          <div className="proof-card-icon"><RotateCcw size={22} aria-hidden="true" /></div>
          <div>
            <p className="overline">Reproducible by design</p>
            <h3>Every failure is a scenario, not a coincidence.</h3>
          </div>
          <div className="seed-readout" aria-label="Example deterministic chaos seed">
            <span>seed</span><strong>43110</strong><small>same input, same failure</small>
          </div>
        </article>
      </div>

      <div className="failure-accordion" aria-label="Failure modes">
        {failureModes.map((mode, index) => (
          <article className="failure-slice" key={mode.title} tabIndex={0}>
            <span className="failure-index">0{index + 1}</span>
            <div className="failure-copy">
              <h3>{mode.title}</h3>
              <p>{mode.copy}</p>
            </div>
            <strong>{mode.metric}</strong>
          </article>
        ))}
      </div>

      <div className="marquee" aria-label="System guarantees">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div className="marquee-set" aria-hidden={copy === 1} key={copy}>
              <span>Idempotent writes</span><i />
              <span>Version preconditions</span><i />
              <span>Deterministic replay</span><i />
              <span>Explicit rollback</span><i />
              <span>Causal ordering</span><i />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

