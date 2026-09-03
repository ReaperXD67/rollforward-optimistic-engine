import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ChaosProfile, Release, ReleaseCommand } from '../../shared/contracts';
import { getSnapshot, ApiProblemError, resetScenario, sendCommand, setChaos } from '../api/client';
import {
  engineReducer,
  initialEngineState,
  nextSendableMutations,
  projectReleases,
} from '../domain/engine';
import { getClientInstanceId, scenarioUuid } from '../domain/identity';
import { clearOutbox, readOutbox, writeOutbox } from '../storage/outbox';

const defaultChaos: ChaosProfile = {
  seed: 43110,
  minLatencyMs: 180,
  maxLatencyMs: 620,
  failureRate: 0,
  conflictRate: 0,
};

export function useRollforwardEngine() {
  const [state, dispatch] = useReducer(engineReducer, initialEngineState);
  const [chaos, setChaosState] = useState(defaultChaos);
  const [loadError, setLoadError] = useState<string>();
  const inFlight = useRef(new Set<string>());
  const retryTimers = useRef(new Map<string, number>());
  const scenarioSequence = useRef(0);
  const clientInstanceId = useRef(getClientInstanceId());
  const runEpoch = useRef(0);
  const channel = useRef<BroadcastChannel>();

  useEffect(() => {
    let active = true;
    Promise.all([getSnapshot(), readOutbox()])
      .then(([snapshot, persistedMutations]) => {
        if (!active) return;
        setChaosState(snapshot.chaos);
        dispatch({ type: 'hydrate', snapshot });
        if (persistedMutations.length) {
          scenarioSequence.current = Math.max(
            ...persistedMutations.map((mutation) => mutation.command.scenarioSequence),
          );
          dispatch({ type: 'restore', mutations: persistedMutations });
        }
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load the release snapshot.');
      });
    return () => {
      active = false;
    };
  }, []);

  const retryLoad = useCallback(async () => {
    setLoadError(undefined);
    try {
      const [snapshot, persistedMutations] = await Promise.all([getSnapshot(), readOutbox()]);
      setChaosState(snapshot.chaos);
      dispatch({ type: 'hydrate', snapshot });
      if (persistedMutations.length) {
        scenarioSequence.current = Math.max(
          ...persistedMutations.map((mutation) => mutation.command.scenarioSequence),
        );
        dispatch({ type: 'restore', mutations: persistedMutations });
      }
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load the release snapshot.');
    }
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const broadcast = new BroadcastChannel('rollforward-canonical-v1');
    channel.current = broadcast;
    broadcast.onmessage = (message) => {
      const candidate = message.data as { type?: string; release?: Release };
      if (candidate.type === 'canonical' && candidate.release) {
        dispatch({ type: 'merge_remote', release: candidate.release });
      }
    };
    return () => {
      broadcast.close();
      channel.current = undefined;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    void writeOutbox(state.mutations).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : 'Unable to persist the local outbox.');
    });
  }, [state.hydrated, state.mutations]);

  useEffect(() => {
    const timers = retryTimers.current;
    return () => {
      for (const timer of timers.values()) window.clearTimeout(timer);
    };
  }, []);

  const sendable = nextSendableMutations(state);
  useEffect(() => {
    for (const mutation of sendable) {
      if (inFlight.current.has(mutation.command.id)) continue;
      const latest = state.confirmed[mutation.command.releaseId];
      if (!latest) continue;
      const mutationId = mutation.command.id;
      const epoch = runEpoch.current;
      inFlight.current.add(mutationId);
      dispatch({ type: 'send', mutationId, expectedVersion: latest.version });

      void sendCommand(mutation.command, latest.version, mutation.attempts + 1)
        .then(({ release, replayed }) => {
          if (epoch !== runEpoch.current) return;
          dispatch({ type: 'acknowledge', mutationId, release, replayed });
          channel.current?.postMessage({ type: 'canonical', release });
        })
        .catch((error: unknown) => {
          if (epoch !== runEpoch.current) return;
          if (error instanceof ApiProblemError && error.status === 412 && error.problem.latest) {
            dispatch({
              type: 'conflict',
              mutationId,
              problem: error.problem,
              latest: error.problem.latest,
            });
            return;
          }

          const problem =
            error instanceof ApiProblemError
              ? error.problem
              : { code: 'transient_failure' as const, message: 'The network request was interrupted.', retryable: true };
          if (problem.retryable && mutation.attempts < 2) {
            dispatch({ type: 'retry_wait', mutationId, problem });
            const delay = 600 * 2 ** mutation.attempts;
            retryTimers.current.set(
              mutationId,
              window.setTimeout(() => {
                retryTimers.current.delete(mutationId);
                dispatch({ type: 'retry', mutationId });
              }, delay),
            );
          } else {
            dispatch({ type: 'reject', mutationId, problem });
          }
        })
        .finally(() => {
          inFlight.current.delete(mutationId);
        });
    }
  }, [sendable, state.confirmed]);

  const releases = useMemo(() => projectReleases(state), [state]);

  const enqueue = useCallback((command: ReleaseCommand) => {
    dispatch({ type: 'enqueue', command });
  }, []);

  const createCommand = useCallback(
    <T extends ReleaseCommand['type']>(
      release: Release,
      type: T,
      payload: Extract<ReleaseCommand, { type: T }>['payload'],
    ): ReleaseCommand => {
      scenarioSequence.current += 1;
      const sequence = scenarioSequence.current;
      return ({
        id: scenarioUuid(chaos.seed, sequence, `${clientInstanceId.current}:${release.id}:${type}`),
        releaseId: release.id,
        type,
        payload,
        actor: 'Aman Kumar',
        createdAt: new Date().toISOString(),
        scenarioSequence: sequence,
      }) as ReleaseCommand;
    },
    [chaos.seed],
  );

  const updateChaos = useCallback(async (profile: ChaosProfile) => {
    setLoadError(undefined);
    try {
      const saved = await setChaos(profile);
      scenarioSequence.current = 0;
      setChaosState(saved);
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Unable to update the network profile.');
    }
  }, []);

  const reset = useCallback(async () => {
    setLoadError(undefined);
    runEpoch.current += 1;
    for (const timer of retryTimers.current.values()) window.clearTimeout(timer);
    retryTimers.current.clear();
    inFlight.current.clear();
    try {
      await clearOutbox();
      const snapshot = await resetScenario();
      scenarioSequence.current = 0;
      setChaosState(snapshot.chaos);
      dispatch({ type: 'reset', snapshot });
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Unable to reset the scenario.');
    }
  }, []);

  return {
    state,
    releases,
    chaos,
    loadError,
    enqueue,
    createCommand,
    updateChaos,
    reset,
    retryLoad,
    setOnline: (online: boolean) => dispatch({ type: 'set_online', online }),
    clearSettled: () => dispatch({ type: 'clear_settled' }),
  };
}
