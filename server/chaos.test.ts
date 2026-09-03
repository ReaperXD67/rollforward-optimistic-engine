import { describe, expect, it } from 'vitest';
import { chaosKeyFor, latencyFor, outcomeFor, stableUnit } from './chaos.js';

describe('deterministic chaos edge', () => {
  it('repeats the same lane result for a stable input', () => {
    expect(stableUnit(47, 'mutation:attempt-1', 'outcome')).toBe(
      stableUnit(47, 'mutation:attempt-1', 'outcome'),
    );
  });

  it('keeps latency inside the declared profile', () => {
    const profile = {
      seed: 47,
      minLatencyMs: 900,
      maxLatencyMs: 3_800,
      failureRate: 0.24,
      conflictRate: 0,
    };

    const latency = latencyFor(profile, 'mutation:attempt-1');
    expect(latency).toBeGreaterThanOrEqual(900);
    expect(latency).toBeLessThanOrEqual(3_800);
  });

  it('makes the curated long-tail scenario fail once and recover on retry', () => {
    const profile = {
      seed: 8,
      minLatencyMs: 900,
      maxLatencyMs: 3_800,
      failureRate: 0.24,
      conflictRate: 0,
    };
    const command = { releaseId: 'rel-atlas', type: 'move_stage' as const, scenarioSequence: 1 };

    expect(outcomeFor(profile, chaosKeyFor(command, 1))).toBe('failure');
    expect(outcomeFor(profile, chaosKeyFor(command, 2))).toBe('accept');
  });

  it('makes the curated contention scenario conflict on the second resource', () => {
    const profile = {
      seed: 13,
      minLatencyMs: 420,
      maxLatencyMs: 1_600,
      failureRate: 0.08,
      conflictRate: 0.4,
    };
    const command = { releaseId: 'rel-ledger', type: 'move_stage' as const, scenarioSequence: 2 };

    expect(outcomeFor(profile, chaosKeyFor(command, 1))).toBe('conflict');
  });
});
