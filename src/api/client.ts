import type {
  ApiProblem,
  ChaosProfile,
  Release,
  ReleaseCommand,
  Snapshot,
} from '../../shared/contracts';

export class ApiProblemError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ApiProblem,
  ) {
    super(problem.message);
    this.name = 'ApiProblemError';
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const rawBody = await response.text();
  let payload: T | { problem: ApiProblem } | undefined;

  if (rawBody.trim()) {
    try {
      payload = JSON.parse(rawBody) as T | { problem: ApiProblem };
    } catch {
      throw new ApiProblemError(response.status, {
        code: 'transient_failure',
        message: `The API returned malformed JSON (HTTP ${response.status}).`,
        retryable: response.ok || response.status >= 500,
      });
    }
  }

  if (!response.ok) {
    const fallback: ApiProblem = {
      code: 'transient_failure',
      message: `Request failed with status ${response.status}.`,
      retryable: response.status >= 500,
    };
    const problem =
      payload && typeof payload === 'object' && 'problem' in payload
        ? (payload as { problem: ApiProblem }).problem
        : fallback;
    throw new ApiProblemError(response.status, problem);
  }

  if (payload === undefined) {
    throw new ApiProblemError(response.status, {
      code: 'transient_failure',
      message: `The API returned an empty response (HTTP ${response.status}).`,
      retryable: true,
    });
  }

  return payload as T;
}

export async function getSnapshot(): Promise<Snapshot> {
  return parseResponse<Snapshot>(await fetch('/api/snapshot', { headers: { Accept: 'application/json' } }));
}

export async function sendCommand(
  command: ReleaseCommand,
  expectedVersion: number,
  attempt: number,
): Promise<{ release: Release; replayed: boolean }> {
  const response = await fetch(`/api/releases/${encodeURIComponent(command.releaseId)}/commands`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Idempotency-Key': command.id,
      'If-Match': `"${expectedVersion}"`,
      'X-Mutation-Attempt': String(attempt),
    },
    body: JSON.stringify(command),
  });
  return parseResponse(response);
}

export async function setChaos(profile: ChaosProfile): Promise<ChaosProfile> {
  const response = await fetch('/api/chaos', {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  const result = await parseResponse<{ chaos: ChaosProfile }>(response);
  return result.chaos;
}

export async function resetScenario(): Promise<Snapshot> {
  const response = await fetch('/api/reset', { method: 'POST', headers: { Accept: 'application/json' } });
  const result = await parseResponse<Omit<Snapshot, 'serverTime'>>(response);
  return { ...result, serverTime: new Date().toISOString() };
}
