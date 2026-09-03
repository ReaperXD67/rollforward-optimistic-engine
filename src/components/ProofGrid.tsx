import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, RadioTower, ShieldCheck } from 'lucide-react';

const failureModes = [
  {
    title: 'Slow acknowledgement',
    copy: 'Intent renders immediately while the request remains observable in transport.',
    metric: '3,800 ms',
  },
  {
    title: 'Transient rejection',
    copy: 'The same idempotency key survives bounded backoff, so retry cannot duplicate the effect.',
    metric: 'retry 2/3',
  },
  {
    title: 'Version conflict',
    copy: 'Remote truth replaces a stale base; ambiguous intent rolls back instead of overwriting it.',
    metric: 'HTTP 412',
  },
  {
    title: 'Offline intent',
    copy: 'The causal outbox persists locally and resumes in order when transport returns.',
    metric: 'IndexedDB',
  },
];

const flightFrames = [
  {
    signal: 'operator intent',
    title: 'The screen moves first.',
    copy: 'A pure reducer folds the command over confirmed state. Canonical data is never mutated to fake responsiveness.',
    code: 'project(confirmed, activeIntent)',
    state: 'projected before transport',
  },
  {
    signal: 'conditional dispatch',
    title: 'The write carries its proof.',
    copy: 'One stable command identifier becomes the idempotency key. The resource version becomes an If-Match precondition.',
    code: 'Idempotency-Key + If-Match: "v7"',
    state: 'one write in flight',
  },
  {
    signal: 'network fracture',
    title: 'Failure becomes state.',
    copy: 'Retryable loss keeps the projection visible. Backoff is bounded, attempts are counted, and the original key is preserved.',
    code: '503 → retry_wait → queued',
    state: 'intent survives',
  },
  {
    signal: 'reconciliation',
    title: 'Truth wins without surprise.',
    copy: 'Acknowledgement advances canonical state. A 412 adopts newer truth and settles the conflicting intent explicitly.',
    code: '200 acknowledge | 412 rollback',
    state: 'zero silent writes',
  },
];

const reviewerQuestions = [
  {
    question: 'Can a retry execute twice?',
    answer: 'No. Concurrent duplicates coalesce in flight; settled duplicates replay the original result; mismatched payloads receive 409.',
    evidence: 'server/app.test.ts · idempotency suite',
  },
  {
    question: 'Can another tab rewind truth?',
    answer: 'No. BroadcastChannel delivers canonical releases, and the reducer accepts only versions newer than the local confirmed value.',
    evidence: 'engine.test.ts · monotonic merge',
  },
  {
    question: 'Can reset lose a race?',
    answer: 'No. Client epochs ignore obsolete responses while server generations fence commands dispatched before the reset boundary.',
    evidence: 'app.test.ts · reset generation fence',
  },
];

export function ProofGrid() {
  const [reviewIndex, setReviewIndex] = useState(0);
  const review = reviewerQuestions[reviewIndex];

  return (
    <>
      <section className="system-section" id="system" aria-labelledby="system-title">
        <header className="section-intro">
          <h2 id="system-title">Two realities.<br />One controlled merge.</h2>
          <p>
            Speed is easy when the network behaves. Senior engineering begins when local intent,
            transport uncertainty, and server truth stop agreeing.
          </p>
        </header>

        <div className="proof-grid" aria-label="System capability overview">
          <article className="proof-card proof-primary">
            <div className="proof-title-row">
              <h3>Confirmed state is immutable evidence.</h3>
              <span className="proof-status"><i /> invariant I-01</span>
            </div>
            <div className="dual-state-diagram" aria-label="Confirmed state and projected state remain separate">
              <div className="state-plane state-plane-confirmed">
                <span>Confirmed</span>
                <strong>release v7</strong>
                <small>server acknowledged</small>
              </div>
              <div className="projection-operator" aria-hidden="true">
                <span>+</span><i /><i /><i />
              </div>
              <div className="state-plane state-plane-projected">
                <span>Projected</span>
                <strong>v7 + intent</strong>
                <small>derived every render</small>
              </div>
            </div>
            <p>
              Rollback changes a mutation’s status. It never reconstructs an old UI snapshot,
              because projected state is always derived from confirmed truth plus active intent.
            </p>
          </article>

          <article className="proof-card proof-idempotency">
            <ShieldCheck size={24} aria-hidden="true" />
            <div><span>Duplicate safety</span><strong>1 key / 1 effect</strong></div>
            <p>Fingerprint binding rejects key reuse with different command bodies.</p>
          </article>

          <article className="proof-card proof-broadcast">
            <RadioTower size={24} aria-hidden="true" />
            <div><span>Cross-tab truth</span><strong>monotonic only</strong></div>
            <p>Same-origin peers merge newer canonical versions and ignore stale delivery.</p>
          </article>

          <article className="proof-card proof-ordering">
            <div className="ordering-copy">
              <span>Causal scheduler</span>
              <h3>Parallel across resources.<br />Serialized within one.</h3>
            </div>
            <div className="ordering-lanes" aria-hidden="true">
              {['atlas', 'ledger', 'prism'].map((lane, laneIndex) => (
                <div key={lane}>
                  <span>{lane}</span>
                  <i className={laneIndex === 0 ? 'is-active' : ''} />
                  <i />
                  <i />
                  <Check size={14} />
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="guarantee-marquee" aria-label="System guarantees">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <div className="marquee-set" aria-hidden={copy === 1} key={copy}>
                <span>Idempotent writes</span><i />
                <span>Version preconditions</span><i />
                <span>Deterministic replay</span><i />
                <span>Explicit rollback</span><i />
                <span>Durable local intent</span><i />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flight-recorder" id="flight-recorder" aria-labelledby="flight-title">
        <div className="flight-heading">
          <h2 id="flight-title">Scrub through<br />the failure.</h2>
          <p>One operator action. Four observable phases. No spinner-shaped hand waving.</p>
        </div>
        <div className="flight-window" tabIndex={0} aria-label="Horizontally scrollable failure sequence">
          <div className="flight-track">
            {flightFrames.map((frame, index) => (
              <article className="flight-panel" key={frame.title}>
                <div className="flight-signal"><i /> {frame.signal}</div>
                <div>
                  <span className="flight-count">{String(index + 1).padStart(2, '0')} / 04</span>
                  <h3>{frame.title}</h3>
                  <p>{frame.copy}</p>
                </div>
                <div className="flight-code"><code>{frame.code}</code><strong>{frame.state}</strong></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="failure-section" aria-labelledby="failure-title">
        <div className="failure-heading">
          <h2 id="failure-title">Every ugly edge<br />has a visible state.</h2>
          <p>Focus or hover a fault line to inspect the containment policy.</p>
        </div>
        <div className="failure-accordion" aria-label="Failure modes">
          {failureModes.map((mode) => (
            <article className="failure-slice" key={mode.title} tabIndex={0}>
              <strong className="failure-metric">{mode.metric}</strong>
              <div className="failure-copy">
                <h3>{mode.title}</h3>
                <p>{mode.copy}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="reviewer-carousel" aria-label="Reviewer evidence carousel">
          <div className="reviewer-prompt">
            <span>Ask the implementation</span>
            <h3>{review.question}</h3>
          </div>
          <div className="reviewer-answer">
            <p>{review.answer}</p>
            <code>{review.evidence}</code>
          </div>
          <div className="reviewer-controls">
            <button
              type="button"
              aria-label="Previous reviewer question"
              onClick={() => setReviewIndex((reviewIndex - 1 + reviewerQuestions.length) % reviewerQuestions.length)}
            ><ArrowLeft size={18} aria-hidden="true" /></button>
            <span>{reviewIndex + 1} / {reviewerQuestions.length}</span>
            <button
              type="button"
              aria-label="Next reviewer question"
              onClick={() => setReviewIndex((reviewIndex + 1) % reviewerQuestions.length)}
            ><ArrowRight size={18} aria-hidden="true" /></button>
          </div>
        </div>
      </section>
    </>
  );
}
