import { describe, expect, it } from 'vitest';
import { SessionRegistry } from './session-registry.js';

describe('anonymous scenario registry', () => {
  it('reuses active state and expires idle scenarios', () => {
    let now = 0;
    let sequence = 0;
    const registry = new SessionRegistry(() => ({ sequence: ++sequence }), {
      ttlMs: 100,
      now: () => now,
    });

    expect(registry.get('alpha')).toBe(registry.get('alpha'));
    now = 101;
    expect(registry.get('alpha').sequence).toBe(2);
  });

  it('evicts the least recently used scenario at capacity', () => {
    let now = 0;
    const registry = new SessionRegistry(() => ({ createdAt: now }), {
      maxEntries: 2,
      ttlMs: 1_000,
      now: () => now,
    });

    const alpha = registry.get('alpha');
    now = 1;
    registry.get('beta');
    now = 2;
    expect(registry.get('alpha')).toBe(alpha);
    now = 3;
    registry.get('gamma');

    expect(registry.get('alpha')).toBe(alpha);
    expect(registry.get('beta').createdAt).toBe(3);
  });
});
