import type { ApiProblem, Release, ReleaseCommand, Snapshot } from '../../shared/contracts';

export type MutationStatus =
  | 'queued'
  | 'in_flight'
  | 'acknowledged'
  | 'retry_wait'
  | 'rejected'
  | 'conflict';

export interface MutationRecord {
  command: ReleaseCommand;
  status: MutationStatus;
  expectedVersion: number;
  attempts: number;
  error?: ApiProblem;
  acknowledgedAt?: string;
}

export interface LedgerEvent {
  id: string;
  at: string;
  kind: 'intent' | 'transport' | 'server' | 'recovery';
  title: string;
  detail: string;
  mutationId?: string;
  releaseId?: string;
}

export interface EngineState {
  confirmed: Record<string, Release>;
  mutations: MutationRecord[];
  ledger: LedgerEvent[];
  hydrated: boolean;
  online: boolean;
  serverTime?: string;
}

export type EngineAction =
  | { type: 'hydrate'; snapshot: Snapshot }
  | { type: 'restore'; mutations: MutationRecord[] }
  | { type: 'merge_remote'; release: Release }
  | { type: 'enqueue'; command: ReleaseCommand }
  | { type: 'send'; mutationId: string; expectedVersion: number }
  | { type: 'acknowledge'; mutationId: string; release: Release; replayed: boolean }
  | { type: 'reject'; mutationId: string; problem: ApiProblem }
  | { type: 'conflict'; mutationId: string; problem: ApiProblem; latest: Release }
  | { type: 'retry_wait'; mutationId: string; problem: ApiProblem }
  | { type: 'retry'; mutationId: string }
  | { type: 'set_online'; online: boolean }
  | { type: 'clear_settled' }
  | { type: 'reset'; snapshot: Snapshot };

export const initialEngineState: EngineState = {
  confirmed: {},
  mutations: [],
  ledger: [],
  hydrated: false,
  online: true,
};

function event(
  kind: LedgerEvent['kind'],
  title: string,
  detail: string,
  mutationId?: string,
  releaseId?: string,
): LedgerEvent {
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    kind,
    title,
    detail,
    mutationId,
    releaseId,
  };
}

function releaseRecord(releases: Release[]): Record<string, Release> {
  return Object.fromEntries(releases.map((release) => [release.id, release]));
}

export function applyCommand(release: Release, command: ReleaseCommand): Release {
  if (command.type === 'move_stage') {
    return { ...release, stage: command.payload.stage, changedBy: command.actor };
  }

  if (command.type === 'set_progress') {
    return { ...release, progress: command.payload.progress, changedBy: command.actor };
  }

  return { ...release, owner: command.payload.owner, changedBy: command.actor };
}

export function projectReleases(state: EngineState): Release[] {
  const projected = Object.fromEntries(
    Object.entries(state.confirmed).map(([id, release]) => [id, { ...release }]),
  );

  for (const mutation of state.mutations) {
    if (!['queued', 'in_flight', 'retry_wait'].includes(mutation.status)) continue;
    const current = projected[mutation.command.releaseId];
    if (!current) continue;
    projected[current.id] = applyCommand(current, mutation.command);
  }

  return Object.values(projected);
}

export function nextSendableMutations(state: EngineState): MutationRecord[] {
  if (!state.online) return [];

  const activeReleaseIds = new Set(
    state.mutations
      .filter((mutation) => mutation.status === 'in_flight' || mutation.status === 'retry_wait')
      .map((mutation) => mutation.command.releaseId),
  );

  const selected: MutationRecord[] = [];
  for (const mutation of state.mutations) {
    if (mutation.status !== 'queued') continue;
    if (activeReleaseIds.has(mutation.command.releaseId)) continue;
    selected.push(mutation);
    activeReleaseIds.add(mutation.command.releaseId);
    if (selected.length === 3) break;
  }

  return selected;
}

function updateMutation(
  state: EngineState,
  mutationId: string,
  update: (mutation: MutationRecord) => MutationRecord,
): MutationRecord[] {
  return state.mutations.map((mutation) =>
    mutation.command.id === mutationId ? update(mutation) : mutation,
  );
}

export function engineReducer(state: EngineState, action: EngineAction): EngineState {
  if (action.type === 'hydrate' || action.type === 'reset') {
    return {
      ...state,
      confirmed: releaseRecord(action.snapshot.releases),
      mutations: [],
      ledger: [
        event(
          'server',
          action.type === 'reset' ? 'Scenario reset' : 'Canonical snapshot received',
          `${action.snapshot.releases.length} releases aligned with server truth.`,
        ),
      ],
      hydrated: true,
      serverTime: action.snapshot.serverTime,
    };
  }

  if (action.type === 'restore') {
    const restored = action.mutations
      .filter((mutation) => state.confirmed[mutation.command.releaseId])
      .map((mutation) => ({
        ...mutation,
        status: 'queued' as const,
        expectedVersion: state.confirmed[mutation.command.releaseId].version,
        error: undefined,
      }));
    if (!restored.length) return state;
    return {
      ...state,
      mutations: restored,
      ledger: [
        event(
          'recovery',
          'Durable outbox restored',
          `${restored.length} local intent${restored.length === 1 ? '' : 's'} recovered after reload.`,
        ),
        ...state.ledger,
      ],
    };
  }

  if (action.type === 'merge_remote') {
    const current = state.confirmed[action.release.id];
    if (current && current.version >= action.release.version) return state;
    return {
      ...state,
      confirmed: { ...state.confirmed, [action.release.id]: action.release },
      ledger: [
        event(
          'server',
          'Cross-tab truth merged',
          `${action.release.service} advanced to v${action.release.version} in another tab.`,
          undefined,
          action.release.id,
        ),
        ...state.ledger,
      ],
    };
  }

  if (action.type === 'enqueue') {
    const base = state.confirmed[action.command.releaseId];
    if (!base) return state;
    return {
      ...state,
      mutations: [
        ...state.mutations,
        {
          command: action.command,
          status: 'queued',
          expectedVersion: base.version,
          attempts: 0,
        },
      ],
      ledger: [
        event(
          'intent',
          'Intent projected immediately',
          `${action.command.type.replace('_', ' ')} queued from v${base.version}.`,
          action.command.id,
          action.command.releaseId,
        ),
        ...state.ledger,
      ],
    };
  }

  if (action.type === 'send') {
    return {
      ...state,
      mutations: updateMutation(state, action.mutationId, (mutation) => ({
        ...mutation,
        status: 'in_flight',
        expectedVersion: action.expectedVersion,
        attempts: mutation.attempts + 1,
        error: undefined,
      })),
      ledger: [
        event(
          'transport',
          'Mutation dispatched',
          `Conditional write sent with If-Match v${action.expectedVersion}.`,
          action.mutationId,
        ),
        ...state.ledger,
      ],
    };
  }

  if (action.type === 'acknowledge') {
    const record = state.mutations.find((mutation) => mutation.command.id === action.mutationId);
    return {
      ...state,
      confirmed: { ...state.confirmed, [action.release.id]: action.release },
      mutations: updateMutation(state, action.mutationId, (mutation) => ({
        ...mutation,
        status: 'acknowledged',
        acknowledgedAt: new Date().toISOString(),
      })),
      ledger: [
        event(
          'server',
          action.replayed ? 'Idempotent replay acknowledged' : 'Server truth advanced',
          `${action.release.service} confirmed at v${action.release.version}.`,
          action.mutationId,
          record?.command.releaseId,
        ),
        ...state.ledger,
      ],
    };
  }

  if (action.type === 'retry_wait') {
    return {
      ...state,
      mutations: updateMutation(state, action.mutationId, (mutation) => ({
        ...mutation,
        status: 'retry_wait',
        error: action.problem,
      })),
      ledger: [
        event(
          'recovery',
          'Transient failure contained',
          'Optimistic intent remains visible while exponential backoff is scheduled.',
          action.mutationId,
        ),
        ...state.ledger,
      ],
    };
  }

  if (action.type === 'retry') {
    return {
      ...state,
      mutations: updateMutation(state, action.mutationId, (mutation) => ({
        ...mutation,
        status: 'queued',
      })),
      ledger: [
        event('transport', 'Retry released', 'The same idempotency key re-enters the queue.', action.mutationId),
        ...state.ledger,
      ],
    };
  }

  if (action.type === 'conflict') {
    return {
      ...state,
      confirmed: { ...state.confirmed, [action.latest.id]: action.latest },
      mutations: updateMutation(state, action.mutationId, (mutation) => ({
        ...mutation,
        status: 'conflict',
        error: action.problem,
      })),
      ledger: [
        event(
          'recovery',
          'Stale intent rolled back',
          `Remote v${action.latest.version} became canonical; ambiguous intent awaits review.`,
          action.mutationId,
          action.latest.id,
        ),
        ...state.ledger,
      ],
    };
  }

  if (action.type === 'reject') {
    return {
      ...state,
      mutations: updateMutation(state, action.mutationId, (mutation) => ({
        ...mutation,
        status: 'rejected',
        error: action.problem,
      })),
      ledger: [
        event(
          'recovery',
          'Mutation rejected and rolled back',
          action.problem.message,
          action.mutationId,
        ),
        ...state.ledger,
      ],
    };
  }

  if (action.type === 'set_online') {
    return {
      ...state,
      online: action.online,
      ledger: [
        event(
          'transport',
          action.online ? 'Transport restored' : 'Offline queue engaged',
          action.online ? 'Queued intents can resume.' : 'New intents stay local until reconnection.',
        ),
        ...state.ledger,
      ],
    };
  }

  if (action.type === 'clear_settled') {
    return {
      ...state,
      mutations: state.mutations.filter((mutation) =>
        ['queued', 'in_flight', 'retry_wait'].includes(mutation.status),
      ),
    };
  }

  return state;
}
