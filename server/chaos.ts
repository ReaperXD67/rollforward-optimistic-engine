import type { ChaosProfile, ReleaseCommand } from '../shared/contracts.js';

export const calmProfile: ChaosProfile = {
  seed: 43110,
  minLatencyMs: 180,
  maxLatencyMs: 620,
  failureRate: 0,
  conflictRate: 0,
};

export function stableUnit(seed: number, key: string, lane: string): number {
  let hash = 2166136261 ^ seed;
  const value = `${lane}:${key}`;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4_294_967_295;
}

export function latencyFor(profile: ChaosProfile, key: string): number {
  if (profile.maxLatencyMs <= profile.minLatencyMs) {
    return profile.minLatencyMs;
  }

  const range = profile.maxLatencyMs - profile.minLatencyMs;
  return Math.round(profile.minLatencyMs + stableUnit(profile.seed, key, 'latency') * range);
}

export function chaosKeyFor(
  command: Pick<ReleaseCommand, 'releaseId' | 'type' | 'scenarioSequence'>,
  attempt: number,
): string {
  return `${command.releaseId}:${command.type}:sequence-${command.scenarioSequence}:attempt-${attempt}`;
}

export function outcomeFor(
  profile: ChaosProfile,
  key: string,
): 'accept' | 'conflict' | 'failure' {
  const unit = stableUnit(profile.seed, key, 'outcome');

  if (unit < profile.failureRate) return 'failure';
  if (unit < profile.failureRate + profile.conflictRate) return 'conflict';
  return 'accept';
}
