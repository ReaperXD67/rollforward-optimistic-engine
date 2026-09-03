import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MutationRecord } from '../domain/engine';
import { clearOutbox, readOutbox, writeOutbox } from './outbox';

function mutation(sequence: number, status: MutationRecord['status']): MutationRecord {
  return {
    command: {
      id: `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
      releaseId: 'rel-atlas',
      type: 'set_progress',
      payload: { progress: sequence * 10 },
      actor: 'Aman Kumar',
      createdAt: '2026-09-03T00:00:00.000Z',
      scenarioSequence: sequence,
    },
    status,
    expectedVersion: 4,
    attempts: 1,
  };
}

describe('durable mutation outbox', () => {
  beforeEach(clearOutbox);
  afterEach(clearOutbox);

  it('persists only unsettled intent', async () => {
    await writeOutbox([
      mutation(1, 'queued'),
      mutation(2, 'in_flight'),
      mutation(3, 'acknowledged'),
      mutation(4, 'conflict'),
    ]);

    const restored = await readOutbox();
    expect(restored).toHaveLength(2);
    expect(restored.map((entry) => entry.command.scenarioSequence)).toEqual([1, 2]);
  });

  it('normalizes interrupted writes back to the queue on reload', async () => {
    await writeOutbox([mutation(1, 'in_flight')]);

    const [restored] = await readOutbox();
    expect(restored.status).toBe('queued');
    expect(restored.command.id).toBe(mutation(1, 'in_flight').command.id);
  });

  it('clears durable state when the scenario resets', async () => {
    await writeOutbox([mutation(1, 'queued')]);
    await clearOutbox();

    await expect(readOutbox()).resolves.toEqual([]);
  });

  it('does not let an idle tab erase another tab\'s unsettled intent', async () => {
    await writeOutbox([mutation(1, 'queued')]);
    await writeOutbox([]);

    await expect(readOutbox()).resolves.toHaveLength(1);
  });

  it('deletes only the mutation that reached a settled state', async () => {
    await writeOutbox([mutation(1, 'queued'), mutation(2, 'queued')]);
    await writeOutbox([mutation(1, 'acknowledged')]);

    const remaining = await readOutbox();
    expect(remaining.map((entry) => entry.command.scenarioSequence)).toEqual([2]);
  });
});
