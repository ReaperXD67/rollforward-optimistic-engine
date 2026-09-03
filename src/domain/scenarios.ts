import type { ChaosProfile } from '../../shared/contracts';

export interface ScenarioProfile {
  name: string;
  copy: string;
  profile: ChaosProfile;
}

export const calmEdgeProfile: ChaosProfile = {
  seed: 43110,
  minLatencyMs: 180,
  maxLatencyMs: 620,
  failureRate: 0,
  conflictRate: 0,
};

export const longTailProfile: ChaosProfile = {
  seed: 8,
  minLatencyMs: 900,
  maxLatencyMs: 3800,
  failureRate: 0.24,
  conflictRate: 0,
};

export const contentionProfile: ChaosProfile = {
  seed: 13,
  minLatencyMs: 420,
  maxLatencyMs: 1600,
  failureRate: 0.08,
  conflictRate: 0.4,
};

export const scenarioProfiles: ScenarioProfile[] = [
  {
    name: 'Calm edge',
    copy: 'Fast acknowledgements, no injected faults.',
    profile: calmEdgeProfile,
  },
  {
    name: 'Long tail',
    copy: 'Visible latency, deterministic loss, same-key retry.',
    profile: longTailProfile,
  },
  {
    name: 'Contention',
    copy: 'Concurrent operators create stale conditional writes.',
    profile: contentionProfile,
  },
];
