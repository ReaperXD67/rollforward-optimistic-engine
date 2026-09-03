import { describe, expect, it } from 'vitest';
import { scenarioUuid } from './identity';

describe('scenario identity', () => {
  it('repeats the same UUID for the same seeded action', () => {
    const first = scenarioUuid(43110, 2, 'rel-atlas:move_stage');
    const replay = scenarioUuid(43110, 2, 'rel-atlas:move_stage');

    expect(first).toBe(replay);
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('separates sequences, seeds, and resource scopes', () => {
    const ids = new Set([
      scenarioUuid(43110, 1, 'rel-atlas:move_stage'),
      scenarioUuid(43110, 2, 'rel-atlas:move_stage'),
      scenarioUuid(43111, 1, 'rel-atlas:move_stage'),
      scenarioUuid(43110, 1, 'rel-ledger:move_stage'),
    ]);

    expect(ids.size).toBe(4);
  });
});

