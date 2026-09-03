import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ChaosProfile, Release, ReleaseCommand } from '../../shared/contracts';
import { getSnapshot, ApiProblemError, resetScenario, sendCommand, setChaos } from '../api/client';
import {
  engineReducer,
  initialEngineState,
  nextSendableMutations,
  projectReleases,
} from '../domain/engine';

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

  useEffect(() => {
    let active = true;
    getSnapshot()
      .then((snapshot) => {
        if (!active) return;
        setChaosState(snapshot.chaos);
        dispatch({ type: 'hydrate', snapshot });
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load the release snapshot.');
      });
    return () => {
      active = false;
    };
  }, []);

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
      inFlight.current.add(mutationId);
      dispatch({ type: 'send', mutationId, expectedVersion: latest.version });

      void sendCommand(mutation.command, latest.version)
        .then(({ release, replayed }) => {
          dispatch({ type: 'acknowledge', mutationId, release, replayed });
        })
        .catch((error: unknown) => {
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
    ): ReleaseCommand =>
      ({
        id: crypto.randomUUID(),
        releaseId: release.id,
        type,
        payload,
        actor: 'Aman Kumar',
        createdAt: new Date().toISOString(),
      }) as ReleaseCommand,
    [],
  );

  const updateChaos = useCallback(async (profile: ChaosProfile) => {
    const saved = await setChaos(profile);
    setChaosState(saved);
  }, []);

  const reset = useCallback(async () => {
    const snapshot = await resetScenario();
    setChaosState(snapshot.chaos);
    dispatch({ type: 'reset', snapshot });
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
    setOnline: (online: boolean) => dispatch({ type: 'set_online', online }),
    clearSettled: () => dispatch({ type: 'clear_settled' }),
  };
}

