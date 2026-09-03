import request, { type Test } from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { createApp } from './app.js';

const command = {
  id: '076ec9f8-c891-446e-86ce-24680b3d8a44',
  releaseId: 'rel-atlas',
  type: 'set_progress',
  payload: { progress: 71 },
  actor: 'Aman Kumar',
  createdAt: '2026-09-03T00:00:00.000Z',
  scenarioSequence: 1,
};

function scenarioRequest(app: Express, scenarioId = '00000000-0000-4000-8000-000000000010') {
  const withScenario = (test: Test) => test.set('X-Scenario-Id', scenarioId);
  return {
    get: (path: string) => withScenario(request(app).get(path)),
    post: (path: string) => withScenario(request(app).post(path)),
    put: (path: string) => withScenario(request(app).put(path)),
  };
}

describe('release command API', () => {
  let app: Express;
  let api: ReturnType<typeof scenarioRequest>;

  beforeEach(() => {
    app = createApp().app;
    api = scenarioRequest(app);
  });

  it('returns a no-store canonical snapshot', async () => {
    const response = await api.get('/api/snapshot').expect(200);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.releases).toHaveLength(3);
    expect(response.body.releases[0].version).toBeGreaterThan(0);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-scenario-isolation']).toBe('browser');
  });

  it('rejects API traffic without a valid browser scenario identity', async () => {
    const response = await request(app).get('/api/snapshot').expect(400);

    expect(response.body.problem.message).toContain('X-Scenario-Id');
  });

  it('isolates canonical truth and chaos controls between browser scenarios', async () => {
    const other = scenarioRequest(app, '00000000-0000-4000-8000-000000000011');
    await api
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"4"')
      .send(command)
      .expect(200);
    await api
      .put('/api/chaos')
      .send({ seed: 2, minLatencyMs: 0, maxLatencyMs: 0, failureRate: 1, conflictRate: 0 })
      .expect(200);

    const primary = await api.get('/api/snapshot').expect(200);
    const isolated = await other.get('/api/snapshot').expect(200);

    expect(primary.body.releases[0].version).toBe(5);
    expect(primary.body.chaos.failureRate).toBe(1);
    expect(isolated.body.releases[0].version).toBe(4);
    expect(isolated.body.chaos.failureRate).toBe(0);
  });

  it('requires an idempotency key before accepting a command', async () => {
    const response = await api
      .post('/api/releases/rel-atlas/commands')
      .set('If-Match', '"4"')
      .send(command)
      .expect(400);

    expect(response.body.problem.code).toBe('missing_idempotency_key');
  });

  it('binds the transport idempotency key to the validated command identity', async () => {
    const response = await api
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', 'fd24a608-9da1-428b-a420-b49042611f52')
      .set('If-Match', '"4"')
      .send(command)
      .expect(400);

    expect(response.body.problem.code).toBe('invalid_command');
  });

  it('rejects disagreement between the path resource and command body', async () => {
    const response = await api
      .post('/api/releases/rel-ledger/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"7"')
      .send({ ...command, releaseId: 'rel-atlas' })
      .expect(400);

    expect(response.body.problem.code).toBe('invalid_command');
  });

  it('keeps malformed JSON failures inside the typed API contract', async () => {
    const response = await api
      .post('/api/releases/rel-atlas/commands')
      .set('Content-Type', 'application/json')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"4"')
      .send('{"broken":')
      .expect(400);

    expect(response.body.problem).toMatchObject({
      code: 'invalid_command',
      message: 'JSON body is malformed.',
    });
  });

  it('rejects malformed preconditions and attempt metadata', async () => {
    await api
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '4')
      .send(command)
      .expect(428);

    const response = await api
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"4"')
      .set('X-Mutation-Attempt', '0')
      .send(command)
      .expect(400);

    expect(response.body.problem.code).toBe('invalid_command');
  });

  it('rejects internally inconsistent chaos profiles', async () => {
    const response = await api
      .put('/api/chaos')
      .send({ seed: 1, minLatencyMs: 900, maxLatencyMs: 100, failureRate: 0.7, conflictRate: 0.7 })
      .expect(400);

    expect(response.body.problem.code).toBe('invalid_command');
  });

  it('applies a conditional write and replays the stored result exactly once', async () => {
    const first = await api
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"4"')
      .send(command)
      .expect(200);

    const replay = await api
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"4"')
      .send(command)
      .expect(200);

    expect(first.body.release.version).toBe(5);
    expect(first.body.release.progress).toBe(71);
    expect(replay.body.release).toEqual(first.body.release);
    expect(replay.body.replayed).toBe(true);
    expect(replay.headers['x-idempotent-replay']).toBe('true');
  });

  it('coalesces concurrent duplicate delivery behind one canonical write', async () => {
    await api
      .put('/api/chaos')
      .send({ seed: 1, minLatencyMs: 20, maxLatencyMs: 20, failureRate: 0, conflictRate: 0 })
      .expect(200);

    const send = () =>
      api
        .post('/api/releases/rel-atlas/commands')
        .set('Idempotency-Key', command.id)
        .set('If-Match', '"4"')
        .send(command);
    const [first, duplicate] = await Promise.all([send(), send()]);

    expect([first.status, duplicate.status]).toEqual([200, 200]);
    expect(first.body.release.version).toBe(5);
    expect(duplicate.body.release).toEqual(first.body.release);
    expect([first.body.replayed, duplicate.body.replayed].sort()).toEqual([false, true]);
  });

  it('rejects reuse of an idempotency key for a different command', async () => {
    await api
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"4"')
      .send(command)
      .expect(200);

    const response = await api
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"5"')
      .send({ ...command, payload: { progress: 12 } })
      .expect(409);

    expect(response.body.problem.code).toBe('idempotency_conflict');
  });

  it('rejects a stale version with the latest canonical resource', async () => {
    const response = await api
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"2"')
      .send(command)
      .expect(412);

    expect(response.body.problem.code).toBe('version_conflict');
    expect(response.body.problem.latest.version).toBe(4);
  });

  it('produces a deterministic retryable failure under the failure profile', async () => {
    await api
      .put('/api/chaos')
      .send({
        seed: 42,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        failureRate: 1,
        conflictRate: 0,
      })
      .expect(200);

    const response = await api
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"4"')
      .send(command)
      .expect(503);

    expect(response.body.problem).toMatchObject({
      code: 'transient_failure',
      retryable: true,
    });
  });

  it('surfaces a simulated concurrent write as a typed precondition failure', async () => {
    await api
      .put('/api/chaos')
      .send({
        seed: 42,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        failureRate: 0,
        conflictRate: 1,
      })
      .expect(200);

    const response = await api
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"4"')
      .send(command)
      .expect(412);

    expect(response.body.problem.code).toBe('version_conflict');
    expect(response.body.problem.latest.changedBy).toBe('Remote operator');
    expect(response.body.problem.latest.version).toBe(5);
  });

  it('fences an in-flight command when the scenario resets', async () => {
    await api
      .put('/api/chaos')
      .send({ seed: 1, minLatencyMs: 80, maxLatencyMs: 80, failureRate: 0, conflictRate: 0 })
      .expect(200);

    const pending = api
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"4"')
      .send(command)
      .then((response) => response);
    await new Promise((resolve) => setTimeout(resolve, 10));
    await api.post('/api/reset').expect(200);
    const response = await pending;

    expect(response.status).toBe(409);
    expect(response.body.problem.code).toBe('scenario_reset');
    const snapshot = await api.get('/api/snapshot').expect(200);
    expect(snapshot.body.releases[0].version).toBe(4);
  });
});
