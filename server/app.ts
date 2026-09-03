import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import {
  chaosProfileSchema,
  commandSchema,
  type ApiProblem,
  type ChaosProfile,
  type Release,
  type ReleaseCommand,
} from '../shared/contracts.js';
import { calmProfile, chaosKeyFor, latencyFor, outcomeFor } from './chaos.js';
import { SessionRegistry, type SessionRegistryOptions } from './session-registry.js';
import { ReleaseStore } from './store.js';

function problem(
  code: ApiProblem['code'],
  message: string,
  retryable: boolean,
  latest?: ApiProblem['latest'],
): { problem: ApiProblem } {
  return { problem: { code, message, retryable, latest } };
}

type CommandResult =
  | { status: 200; release: Release }
  | { status: 404 | 409 | 412 | 503; problem: ApiProblem; etag?: string };

interface IdempotencyRecord {
  fingerprint: string;
  result: CommandResult;
}

interface InFlightCommand {
  fingerprint: string;
  result: Promise<CommandResult>;
}

interface ScenarioState {
  store: ReleaseStore;
  chaos: ChaosProfile;
  generation: number;
  completedCommands: Map<string, IdempotencyRecord>;
  inFlightCommands: Map<string, InFlightCommand>;
}

const scenarioIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createScenarioState(): ScenarioState {
  return {
    store: new ReleaseStore(),
    chaos: { ...calmProfile },
    generation: 0,
    completedCommands: new Map(),
    inFlightCommands: new Map(),
  };
}

function scenarioFor(response: Response): ScenarioState {
  return response.locals.scenario as ScenarioState;
}

function fingerprint(command: ReleaseCommand): string {
  return JSON.stringify(command);
}

function sendCommandResult(response: Response, result: CommandResult, replayed: boolean): void {
  if (replayed) response.set('X-Idempotent-Replay', 'true');
  if (result.status === 200) {
    response
      .status(200)
      .set('ETag', `"${result.release.version}"`)
      .json({ release: result.release, replayed });
    return;
  }

  if (result.etag) response.set('ETag', result.etag);
  if (result.status === 503) response.set('Retry-After', '1');
  response.status(result.status).json({ problem: result.problem });
}

export function createApp(sessionOptions: SessionRegistryOptions = {}) {
  const app = express();
  const sessions = new SessionRegistry(createScenarioState, sessionOptions);

  function remember(scenario: ScenarioState, key: string, record: IdempotencyRecord): void {
    if (scenario.completedCommands.size >= 512) {
      const oldestKey = scenario.completedCommands.keys().next().value;
      if (oldestKey) scenario.completedCommands.delete(oldestKey);
    }
    scenario.completedCommands.set(key, record);
  }

  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.use(express.json({ limit: '32kb' }));
  app.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    const parserError = error as { type?: string };
    if (parserError?.type === 'entity.too.large') {
      response.status(413).json(problem('invalid_command', 'JSON body exceeds the 32 KB limit.', false));
      return;
    }
    if (parserError?.type === 'entity.parse.failed') {
      response.status(400).json(problem('invalid_command', 'JSON body is malformed.', false));
      return;
    }
    next(error);
  });

  app.use('/api', (request, response, next) => {
    const scenarioId = request.header('X-Scenario-Id');
    if (!scenarioId || !scenarioIdPattern.test(scenarioId)) {
      response
        .status(400)
        .json(problem('invalid_command', 'X-Scenario-Id must contain a browser-scoped UUID.', false));
      return;
    }

    response.locals.scenario = sessions.get(scenarioId);
    response.set('X-Scenario-Isolation', 'browser');
    next();
  });

  app.get('/healthz', (_request, response) => {
    response.json({ ok: true, service: 'rollforward', activeScenarios: sessions.size });
  });

  app.get('/api/snapshot', (_request, response) => {
    const scenario = scenarioFor(response);
    response.set('Cache-Control', 'no-store');
    response.json({
      releases: scenario.store.list(),
      chaos: scenario.chaos,
      serverTime: new Date().toISOString(),
    });
  });

  app.put('/api/chaos', (request, response) => {
    const scenario = scenarioFor(response);
    const parsed = chaosProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json(problem('invalid_command', 'Chaos profile is invalid.', false));
      return;
    }

    scenario.chaos = parsed.data;
    response.json({ chaos: scenario.chaos });
  });

  app.post('/api/reset', (_request, response) => {
    const scenario = scenarioFor(response);
    scenario.generation += 1;
    scenario.completedCommands.clear();
    scenario.inFlightCommands.clear();
    scenario.chaos = { ...calmProfile };
    response.json({ releases: scenario.store.reset(), chaos: scenario.chaos });
  });

  app.post('/api/releases/:releaseId/commands', async (request, response) => {
    const scenario = scenarioFor(response);
    const idempotencyKey = request.header('Idempotency-Key');
    if (!idempotencyKey) {
      response
        .status(400)
        .json(problem('missing_idempotency_key', 'Idempotency-Key is required.', false));
      return;
    }

    const versionMatch = request.header('If-Match')?.match(/^"([1-9]\d*)"$/);
    const expectedVersion = Number(versionMatch?.[1]);
    if (!versionMatch || !Number.isSafeInteger(expectedVersion)) {
      response
        .status(428)
        .json(problem('missing_precondition', 'If-Match must contain a resource version.', false));
      return;
    }

    const parsed = commandSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json(problem('invalid_command', 'Command payload is invalid.', false));
      return;
    }

    if (parsed.data.releaseId !== request.params.releaseId) {
      response
        .status(400)
        .json(problem('invalid_command', 'Command releaseId must match the request path.', false));
      return;
    }

    if (parsed.data.id !== idempotencyKey) {
      response
        .status(400)
        .json(problem('invalid_command', 'Idempotency-Key must match the command id.', false));
      return;
    }

    const commandFingerprint = fingerprint(parsed.data);
    const completed = scenario.completedCommands.get(idempotencyKey);
    if (completed) {
      if (completed.fingerprint !== commandFingerprint) {
        response
          .status(409)
          .json(problem('idempotency_conflict', 'This idempotency key belongs to another command.', false));
        return;
      }
      sendCommandResult(response, completed.result, true);
      return;
    }

    const inFlight = scenario.inFlightCommands.get(idempotencyKey);
    if (inFlight) {
      if (inFlight.fingerprint !== commandFingerprint) {
        response
          .status(409)
          .json(problem('idempotency_conflict', 'This idempotency key is already executing another command.', false));
        return;
      }
      sendCommandResult(response, await inFlight.result, true);
      return;
    }

    const current = scenario.store.get(parsed.data.releaseId);
    if (!current) {
      response.status(404).json(problem('release_not_found', 'Release was not found.', false));
      return;
    }

    const attemptHeader = request.header('X-Mutation-Attempt') ?? '1';
    if (!/^[1-9]\d*$/.test(attemptHeader)) {
      response.status(400).json(problem('invalid_command', 'Mutation attempt must be a positive integer.', false));
      return;
    }
    const attempt = Number(attemptHeader);
    if (!Number.isSafeInteger(attempt)) {
      response.status(400).json(problem('invalid_command', 'Mutation attempt is out of range.', false));
      return;
    }
    const chaosKey = chaosKeyFor(parsed.data, attempt);
    const dispatchedGeneration = scenario.generation;
    const result = (async (): Promise<CommandResult> => {
      await new Promise((resolve) => setTimeout(resolve, latencyFor(scenario.chaos, chaosKey)));
      if (dispatchedGeneration !== scenario.generation) {
        return {
          status: 409,
          problem: {
            code: 'scenario_reset',
            message: 'The scenario reset before this command reached canonical state.',
            retryable: false,
          },
        };
      }

      const outcome = outcomeFor(scenario.chaos, chaosKey);
      if (outcome === 'failure') {
        return {
          status: 503,
          problem: {
            code: 'transient_failure',
            message: 'The simulated edge dropped this write.',
            retryable: true,
          },
        };
      }

      if (outcome === 'conflict') {
        const latest = scenario.store.injectRemoteChange(parsed.data.releaseId);
        return {
          status: 412,
          etag: `"${latest.version}"`,
          problem: {
            code: 'version_conflict',
            message: 'A remote operator changed this release first.',
            retryable: false,
            latest,
          },
        };
      }

      try {
        return { status: 200, release: scenario.store.apply(parsed.data, expectedVersion) };
      } catch (error) {
        if (error instanceof Error && error.message === 'version_conflict') {
          const latest = scenario.store.get(parsed.data.releaseId);
          return {
            status: 412,
            problem: {
              code: 'version_conflict',
              message: 'The release version no longer matches.',
              retryable: false,
              latest,
            },
          };
        }

        return {
          status: 404,
          problem: {
            code: 'release_not_found',
            message: 'Release was not found.',
            retryable: false,
          },
        };
      }
    })();

    scenario.inFlightCommands.set(idempotencyKey, { fingerprint: commandFingerprint, result });
    const settled = await result;
    const activeFlight = scenario.inFlightCommands.get(idempotencyKey);
    if (activeFlight?.result === result) scenario.inFlightCommands.delete(idempotencyKey);
    if (settled.status !== 503 && dispatchedGeneration === scenario.generation) {
      remember(scenario, idempotencyKey, { fingerprint: commandFingerprint, result: settled });
    }
    sendCommandResult(response, settled, false);
  });

  return { app, sessions };
}
