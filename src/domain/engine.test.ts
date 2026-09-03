import { describe, expect, it } from 'vitest';
import type { Release, ReleaseCommand, Snapshot } from '../../shared/contracts';
import {
  engineReducer,
  initialEngineState,
  nextSendableMutations,
  projectReleases,
} from './engine';

const release: Release = {
  id: 'release-1',
  title: 'Release one',
  service: 'test-service',
  owner: 'Aman Kumar',
  stage: 'planned',
  progress: 0,
  version: 1,
  risk: 'low',
  environment: 'preview',
  changedAt: '2026-09-03T00:00:00.000Z',
  changedBy: 'Aman Kumar',
};

const snapshot: Snapshot = {
  releases: [release],
  chaos: {
    seed: 1,
    minLatencyMs: 0,
    maxLatencyMs: 0,
    failureRate: 0,
    conflictRate: 0,
  },
  serverTime: '2026-09-03T00:00:00.000Z',
};

function command(id: string, progress: number): ReleaseCommand {
  return {
    id,
    releaseId: release.id,
    type: 'set_progress',
    payload: { progress },
    actor: 'Aman Kumar',
    createdAt: '2026-09-03T00:00:01.000Z',
    scenarioSequence: 1,
  };
}

describe('optimistic engine', () => {
  it('projects intent without mutating confirmed server truth', () => {
    const hydrated = engineReducer(initialEngineState, { type: 'hydrate', snapshot });
    const queued = engineReducer(hydrated, { type: 'enqueue', command: command(crypto.randomUUID(), 40) });

    expect(queued.confirmed[release.id].progress).toBe(0);
    expect(projectReleases(queued)[0].progress).toBe(40);
    expect(queued.mutations[0].status).toBe('queued');
  });

  it('serializes mutations for one release while allowing other releases to proceed', () => {
    const secondRelease = { ...release, id: 'release-2', service: 'second-service' };
    const hydrated = engineReducer(initialEngineState, {
      type: 'hydrate',
      snapshot: { ...snapshot, releases: [release, secondRelease] },
    });
    const first = engineReducer(hydrated, {
      type: 'enqueue',
      command: command(crypto.randomUUID(), 20),
    });
    const second = engineReducer(first, {
      type: 'enqueue',
      command: command(crypto.randomUUID(), 30),
    });
    const third = engineReducer(second, {
      type: 'enqueue',
      command: { ...command(crypto.randomUUID(), 50), releaseId: secondRelease.id },
    });

    const sendable = nextSendableMutations(third);
    expect(sendable).toHaveLength(2);
    expect(sendable.map((entry) => entry.command.releaseId)).toEqual(['release-1', 'release-2']);
  });

  it('keeps later optimistic intent after an earlier acknowledgement', () => {
    const firstId = crypto.randomUUID();
    const secondId = crypto.randomUUID();
    let state = engineReducer(initialEngineState, { type: 'hydrate', snapshot });
    state = engineReducer(state, { type: 'enqueue', command: command(firstId, 20) });
    state = engineReducer(state, { type: 'enqueue', command: command(secondId, 60) });
    state = engineReducer(state, { type: 'send', mutationId: firstId, expectedVersion: 1 });
    state = engineReducer(state, {
      type: 'acknowledge',
      mutationId: firstId,
      replayed: false,
      release: { ...release, progress: 20, version: 2 },
    });

    expect(state.confirmed[release.id].progress).toBe(20);
    expect(projectReleases(state)[0].progress).toBe(60);
  });

  it('rolls back ambiguous intent and adopts canonical conflict state', () => {
    const id = crypto.randomUUID();
    let state = engineReducer(initialEngineState, { type: 'hydrate', snapshot });
    state = engineReducer(state, { type: 'enqueue', command: command(id, 80) });
    state = engineReducer(state, {
      type: 'conflict',
      mutationId: id,
      problem: {
        code: 'version_conflict',
        message: 'Remote write won.',
        retryable: false,
      },
      latest: { ...release, progress: 35, version: 2, changedBy: 'Remote operator' },
    });

    expect(projectReleases(state)[0].progress).toBe(35);
    expect(state.mutations[0].status).toBe('conflict');
    expect(state.ledger[0].title).toContain('rolled back');
  });

  it('restores interrupted mutations as queued with current canonical versions', () => {
    const id = crypto.randomUUID();
    const hydrated = engineReducer(initialEngineState, { type: 'hydrate', snapshot });
    const restored = engineReducer(hydrated, {
      type: 'restore',
      mutations: [
        {
          command: command(id, 50),
          status: 'in_flight',
          expectedVersion: 0,
          attempts: 1,
        },
      ],
    });

    expect(restored.mutations[0]).toMatchObject({
      status: 'queued',
      expectedVersion: release.version,
      attempts: 1,
    });
    expect(projectReleases(restored)[0].progress).toBe(50);
    expect(restored.ledger[0].title).toBe('Durable outbox restored');
  });

  it('merges only newer cross-tab truth', () => {
    const hydrated = engineReducer(initialEngineState, { type: 'hydrate', snapshot });
    const newer = { ...release, version: 3, progress: 70 };
    const merged = engineReducer(hydrated, { type: 'merge_remote', release: newer });
    const ignored = engineReducer(merged, {
      type: 'merge_remote',
      release: { ...release, version: 2, progress: 10 },
    });

    expect(merged.confirmed[release.id]).toEqual(newer);
    expect(ignored).toBe(merged);
    expect(ignored.confirmed[release.id].progress).toBe(70);
  });
});
