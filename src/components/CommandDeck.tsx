import {
  ArrowRight,
  CloudOff,
  Gauge,
  RefreshCcw,
  ShieldCheck,
  Signal,
  Wifi,
} from 'lucide-react';
import type { ChaosProfile, Release, ReleaseCommand } from '../../shared/contracts';
import { stages } from '../../shared/stages';
import type { EngineState } from '../domain/engine';
import { MutationLedger } from './MutationLedger';

type CreateCommand = <T extends ReleaseCommand['type']>(
  release: Release,
  type: T,
  payload: Extract<ReleaseCommand, { type: T }>['payload'],
) => ReleaseCommand;

const profiles: Array<{ name: string; copy: string; profile: ChaosProfile }> = [
  {
    name: 'Calm edge',
    copy: 'Fast acknowledgements, no injected faults.',
    profile: { seed: 43110, minLatencyMs: 180, maxLatencyMs: 620, failureRate: 0, conflictRate: 0 },
  },
  {
    name: 'Long tail',
    copy: 'Visible latency with occasional retryable loss.',
    profile: { seed: 8, minLatencyMs: 900, maxLatencyMs: 3800, failureRate: 0.24, conflictRate: 0 },
  },
  {
    name: 'Contention',
    copy: 'Concurrent operators create stale writes.',
    profile: { seed: 13, minLatencyMs: 420, maxLatencyMs: 1600, failureRate: 0.08, conflictRate: 0.4 },
  },
];

function ReleaseCard({
  release,
  pending,
  createCommand,
  enqueue,
}: {
  release: Release;
  pending: boolean;
  createCommand: CreateCommand;
  enqueue: (command: ReleaseCommand) => void;
}) {
  const index = stages.indexOf(release.stage);
  const nextStage = stages[Math.min(index + 1, stages.length - 1)];
  const canAdvance = nextStage !== release.stage;

  return (
    <article className={`release-card risk-${release.risk}`}>
      <div className="release-card-topline">
        <span className="service-name">{release.service}</span>
        <span className={`sync-chip ${pending ? 'sync-pending' : ''}`}>
          {pending ? 'projected' : `server v${release.version}`}
        </span>
      </div>
      <div>
        <h3>{release.title}</h3>
        <p>{release.owner} · {release.environment}</p>
      </div>
      <div className="stage-line">
        <div>
          <span>current stage</span>
          <strong>{release.stage}</strong>
        </div>
        <span
          className="stage-progress"
          role="progressbar"
          aria-label={`${release.title} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={release.progress}
          aria-valuetext={`${release.progress} percent complete`}
        >
          <i style={{ width: `${release.progress}%` }} />
        </span>
      </div>
      <div className="release-actions">
        <button
          type="button"
          className="advance-button"
          disabled={!canAdvance}
          onClick={() => enqueue(createCommand(release, 'move_stage', { stage: nextStage }))}
        >
          {canAdvance ? `Advance to ${nextStage}` : 'Release complete'}
          {canAdvance ? <ArrowRight size={15} aria-hidden="true" /> : <ShieldCheck size={15} aria-hidden="true" />}
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={`Increase ${release.title} progress by ten percent`}
          onClick={() =>
            enqueue(
              createCommand(release, 'set_progress', {
                progress: Math.min(100, release.progress + 10),
              }),
            )
          }
        >
          <Gauge size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export function CommandDeck({
  state,
  releases,
  chaos,
  loadError,
  createCommand,
  enqueue,
  updateChaos,
  setOnline,
  reset,
  retryLoad,
  clearSettled,
}: {
  state: EngineState;
  releases: Release[];
  chaos: ChaosProfile;
  loadError?: string;
  createCommand: CreateCommand;
  enqueue: (command: ReleaseCommand) => void;
  updateChaos: (profile: ChaosProfile) => Promise<void>;
  setOnline: (online: boolean) => void;
  reset: () => Promise<void>;
  retryLoad: () => Promise<void>;
  clearSettled: () => void;
}) {
  const activeByRelease = new Set(
    state.mutations
      .filter((mutation) => ['queued', 'in_flight', 'retry_wait'].includes(mutation.status))
      .map((mutation) => mutation.command.releaseId),
  );

  return (
    <section className="command-section" id="command-deck" aria-labelledby="command-title">
      <div className="command-backdrop" aria-hidden="true" />
      <div className="command-heading">
        <div>
          <p className="overline">Interactive command deck</p>
          <h2 id="command-title">Break the network. Keep the intent.</h2>
        </div>
        <p>
          Choose a network profile, move releases, and watch confirmed truth diverge from—and
          reconcile with—the interface in real time.
        </p>
      </div>

      <div className="chaos-toolbar" aria-label="Network simulation controls">
        <div className="connection-toggle">
          <button
            type="button"
            className={state.online ? 'selected' : ''}
            aria-pressed={state.online}
            onClick={() => setOnline(true)}
          >
            <Wifi size={15} aria-hidden="true" /> Connected
          </button>
          <button
            type="button"
            className={!state.online ? 'selected' : ''}
            aria-pressed={!state.online}
            onClick={() => setOnline(false)}
          >
            <CloudOff size={15} aria-hidden="true" /> Offline
          </button>
        </div>
        <div className="profile-controls">
          {profiles.map(({ name, copy, profile }) => {
            const selected = chaos.seed === profile.seed;
            return (
              <button
                type="button"
                key={name}
                className={selected ? 'profile-button selected' : 'profile-button'}
                aria-pressed={selected}
                title={copy}
                onClick={() => void updateChaos(profile)}
              >
                <Signal size={14} aria-hidden="true" /> {name}
              </button>
            );
          })}
        </div>
        <button className="reset-button" type="button" onClick={() => void reset()}>
          <RefreshCcw size={15} aria-hidden="true" /> Reset
        </button>
      </div>

      {loadError ? (
        <div className="error-banner" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={() => void retryLoad()}>
            Retry connection
          </button>
        </div>
      ) : null}

      <div className="command-layout">
        <div className="release-panel">
          <div className="panel-heading">
            <div>
              <p className="overline">Release train</p>
              <h3>Three services in motion</h3>
            </div>
            <div className="truth-key" aria-label="State legend">
              <span><i className="canonical-dot" /> canonical</span>
              <span><i className="projected-dot" /> projected</span>
            </div>
          </div>
          <div className="release-list" aria-live="polite">
            {!state.hydrated
              ? [0, 1, 2].map((index) => <div className="release-card skeleton" key={index} />)
              : releases.map((release) => (
                  <ReleaseCard
                    key={release.id}
                    release={release}
                    pending={activeByRelease.has(release.id)}
                    createCommand={createCommand}
                    enqueue={enqueue}
                  />
                ))}
          </div>
        </div>
        <MutationLedger
          events={state.ledger}
          mutations={state.mutations}
          onClear={clearSettled}
        />
      </div>
    </section>
  );
}
