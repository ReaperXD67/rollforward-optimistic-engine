import type { Release, ReleaseCommand } from '../shared/contracts.js';
import { stageProgress, stages } from '../shared/stages.js';

const baseline: Release[] = [
  {
    id: 'rel-atlas',
    title: 'Atlas search relevance',
    service: 'discovery-api',
    owner: 'Aman Kumar',
    stage: 'verifying',
    progress: 58,
    version: 4,
    risk: 'moderate',
    environment: 'canary',
    changedAt: '2026-09-03T06:12:00.000Z',
    changedBy: 'Aman Kumar',
  },
  {
    id: 'rel-ledger',
    title: 'Ledger idempotency keys',
    service: 'payments-core',
    owner: 'Noor Patel',
    stage: 'deploying',
    progress: 74,
    version: 7,
    risk: 'high',
    environment: 'production',
    changedAt: '2026-09-03T06:08:00.000Z',
    changedBy: 'Noor Patel',
  },
  {
    id: 'rel-prism',
    title: 'Prism telemetry envelope',
    service: 'event-router',
    owner: 'Mina Chen',
    stage: 'building',
    progress: 34,
    version: 2,
    risk: 'low',
    environment: 'preview',
    changedAt: '2026-09-03T05:54:00.000Z',
    changedBy: 'Mina Chen',
  },
];

function cloneRelease(release: Release): Release {
  return { ...release };
}

export class ReleaseStore {
  private releases = new Map<string, Release>();

  constructor() {
    this.reset();
  }

  reset(): Release[] {
    this.releases = new Map(baseline.map((release) => [release.id, cloneRelease(release)]));
    return this.list();
  }

  list(): Release[] {
    return [...this.releases.values()].map(cloneRelease);
  }

  get(id: string): Release | undefined {
    const release = this.releases.get(id);
    return release ? cloneRelease(release) : undefined;
  }

  apply(command: ReleaseCommand, expectedVersion: number): Release {
    const current = this.releases.get(command.releaseId);
    if (!current) throw new Error('release_not_found');
    if (current.version !== expectedVersion) throw new Error('version_conflict');

    const next: Release = {
      ...current,
      version: current.version + 1,
      changedAt: new Date().toISOString(),
      changedBy: command.actor,
    };

    if (command.type === 'move_stage') {
      next.stage = command.payload.stage;
      next.progress = Math.max(current.progress, stageProgress(command.payload.stage));
    } else if (command.type === 'set_progress') {
      next.progress = command.payload.progress;
    } else {
      next.owner = command.payload.owner;
    }

    this.releases.set(next.id, next);
    return cloneRelease(next);
  }

  injectRemoteChange(id: string): Release {
    const current = this.releases.get(id);
    if (!current) throw new Error('release_not_found');
    const currentStageIndex = stages.indexOf(current.stage);
    const nextStage = stages[Math.min(stages.length - 1, currentStageIndex + 1)];
    const next: Release = {
      ...current,
      stage: nextStage,
      progress: Math.max(current.progress, stageProgress(nextStage)),
      version: current.version + 1,
      changedAt: new Date().toISOString(),
      changedBy: 'Remote operator',
    };

    this.releases.set(id, next);
    return cloneRelease(next);
  }
}
