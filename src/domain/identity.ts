function fnv32(value: string, seed: number): number {
  let hash = 2166136261 ^ seed;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function scenarioUuid(seed: number, sequence: number, scope: string): string {
  const input = `${seed}:${sequence}:${scope}`;
  let hex = [0, 1, 2, 3]
    .map((lane) => fnv32(`${lane}:${input}`, seed + lane * 7919).toString(16).padStart(8, '0'))
    .join('');

  hex = `${hex.slice(0, 12)}4${hex.slice(13)}`;
  const variant = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  hex = `${hex.slice(0, 16)}${variant}${hex.slice(17)}`;

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const clientInstanceKey = 'rollforward-client-instance-v1';
const scenarioKey = 'rollforward-scenario-v1';
const headlessScenarioId = '00000000-0000-4000-8000-000000000001';

export function getClientInstanceId(): string {
  if (typeof sessionStorage === 'undefined') return 'headless-client';
  const existing = sessionStorage.getItem(clientInstanceKey);
  if (existing) return existing;

  const created = crypto.randomUUID();
  sessionStorage.setItem(clientInstanceKey, created);
  return created;
}

/** One browser profile shares a server scenario; individual tabs keep distinct client identities. */
export function getScenarioId(): string {
  if (typeof localStorage === 'undefined') return headlessScenarioId;

  const existing = localStorage.getItem(scenarioKey);
  if (existing) return existing;

  const created = crypto.randomUUID();
  localStorage.setItem(scenarioKey, created);
  return created;
}
