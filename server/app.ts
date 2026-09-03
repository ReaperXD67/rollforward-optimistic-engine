import cors from 'cors';
import express from 'express';
import { chaosProfileSchema, commandSchema, type ApiProblem, type ChaosProfile } from '../shared/contracts.js';
import { calmProfile, latencyFor, outcomeFor } from './chaos.js';
import { ReleaseStore } from './store.js';

function problem(
  code: ApiProblem['code'],
  message: string,
  retryable: boolean,
  latest?: ApiProblem['latest'],
): { problem: ApiProblem } {
  return { problem: { code, message, retryable, latest } };
}

export function createApp() {
  const app = express();
  const store = new ReleaseStore();
  let chaos: ChaosProfile = { ...calmProfile };

  app.use(cors());
  app.use(express.json({ limit: '32kb' }));

  app.get('/healthz', (_request, response) => {
    response.json({ ok: true });
  });

  app.get('/api/snapshot', (_request, response) => {
    response.set('Cache-Control', 'no-store');
    response.json({
      releases: store.list(),
      chaos,
      serverTime: new Date().toISOString(),
    });
  });

  app.put('/api/chaos', (request, response) => {
    const parsed = chaosProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json(problem('invalid_command', 'Chaos profile is invalid.', false));
      return;
    }

    chaos = parsed.data;
    response.json({ chaos });
  });

  app.post('/api/reset', (_request, response) => {
    chaos = { ...calmProfile };
    response.json({ releases: store.reset(), chaos });
  });

  app.post('/api/releases/:releaseId/commands', async (request, response) => {
    const idempotencyKey = request.header('Idempotency-Key');
    if (!idempotencyKey) {
      response
        .status(400)
        .json(problem('missing_idempotency_key', 'Idempotency-Key is required.', false));
      return;
    }

    const previous = store.responseFor(idempotencyKey);
    if (previous) {
      response.set('X-Idempotent-Replay', 'true').json({ release: previous, replayed: true });
      return;
    }

    const rawVersion = request.header('If-Match')?.replaceAll('"', '');
    const expectedVersion = Number(rawVersion);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      response
        .status(428)
        .json(problem('missing_precondition', 'If-Match must contain a resource version.', false));
      return;
    }

    const parsed = commandSchema.safeParse({ ...request.body, releaseId: request.params.releaseId });
    if (!parsed.success) {
      response.status(400).json(problem('invalid_command', 'Command payload is invalid.', false));
      return;
    }

    const current = store.get(parsed.data.releaseId);
    if (!current) {
      response.status(404).json(problem('release_not_found', 'Release was not found.', false));
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, latencyFor(chaos, idempotencyKey)));
    const outcome = outcomeFor(chaos, idempotencyKey);

    if (outcome === 'failure') {
      response
        .status(503)
        .set('Retry-After', '1')
        .json(problem('transient_failure', 'The simulated edge dropped this write.', true));
      return;
    }

    if (outcome === 'conflict') {
      const latest = store.injectRemoteChange(parsed.data.releaseId);
      response
        .status(412)
        .set('ETag', `"${latest.version}"`)
        .json(problem('version_conflict', 'A remote operator changed this release first.', false, latest));
      return;
    }

    try {
      const release = store.apply(parsed.data, idempotencyKey, expectedVersion);
      response.set('ETag', `"${release.version}"`).json({ release, replayed: false });
    } catch (error) {
      if (error instanceof Error && error.message === 'version_conflict') {
        const latest = store.get(parsed.data.releaseId);
        response
          .status(412)
          .json(problem('version_conflict', 'The release version no longer matches.', false, latest));
        return;
      }

      response.status(404).json(problem('release_not_found', 'Release was not found.', false));
    }
  });

  return { app, store };
}

