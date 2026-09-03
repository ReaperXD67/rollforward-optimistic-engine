import { ArrowDown, ArrowRight, LoaderCircle } from 'lucide-react';
import type { Release } from '../../shared/contracts';
import type { EngineState } from '../domain/engine';
import { TruthTunnel } from './TruthTunnel';

export function Hero({
  state,
  releases,
  runningScenario,
  onRunScenario,
}: {
  state: EngineState;
  releases: Release[];
  runningScenario: boolean;
  onRunScenario: () => void;
}) {
  const confirmed = Object.values(state.confirmed);
  const activeMutations = state.mutations.filter((mutation) =>
    ['queued', 'in_flight', 'retry_wait'].includes(mutation.status),
  ).length;

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title" aria-label="Act now. Reconcile truth later.">
          <span className="hero-line"><span>Act now.</span></span>
          <span className="hero-line hero-line-shift"><span>Reconcile</span></span>
          <span className="hero-line"><span>truth later.</span></span>
        </h1>
        <p className="hero-lede copy-reveal">
          A release-command system that responds before the network does—then proves exactly how
          it retried, converged, or rolled back.
        </p>
        <div className="hero-actions copy-reveal">
          <button
            className="button button-primary hero-run"
            type="button"
            disabled={!state.hydrated || runningScenario}
            onClick={onRunScenario}
          >
            {runningScenario ? (
              <><LoaderCircle className="spin" size={17} aria-hidden="true" /> Arming scenario</>
            ) : (
              <>Run the failure path <ArrowRight size={17} aria-hidden="true" /></>
            )}
          </button>
          <a className="button button-secondary" href="#command-deck">
            Enter command deck <ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>
        <div className="hero-contract copy-reveal" aria-label="Live system contract">
          <span><i className={state.online ? 'status-live' : 'status-offline'} /> Real API</span>
          <span>Stable idempotency keys</span>
          <span>{activeMutations ? `${activeMutations} active intent` : 'Canonical state aligned'}</span>
        </div>
      </div>

      <TruthTunnel
        confirmed={confirmed}
        projected={releases}
        mutations={state.mutations}
        online={state.online}
        className="hero-tunnel"
      />

      <div className="hero-index" aria-hidden="true">
        <span>RF / 26</span>
        <span>Scroll to inspect</span>
        <span>Full-stack systems proof</span>
      </div>
    </section>
  );
}
