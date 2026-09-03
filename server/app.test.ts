import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { createApp } from './app.js';

const command = {
  id: '076ec9f8-c891-446e-86ce-24680b3d8a44',
  type: 'set_progress',
  payload: { progress: 71 },
  actor: 'Aman Kumar',
  createdAt: '2026-09-03T00:00:00.000Z',
};

describe('release command API', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp().app;
  });

  it('returns a no-store canonical snapshot', async () => {
    const response = await request(app).get('/api/snapshot').expect(200);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.releases).toHaveLength(3);
    expect(response.body.releases[0].version).toBeGreaterThan(0);
  });

  it('requires an idempotency key before accepting a command', async () => {
    const response = await request(app)
      .post('/api/releases/rel-atlas/commands')
      .set('If-Match', '"4"')
      .send(command)
      .expect(400);

    expect(response.body.problem.code).toBe('missing_idempotency_key');
  });

  it('applies a conditional write and replays the stored result exactly once', async () => {
    const first = await request(app)
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"4"')
      .send(command)
      .expect(200);

    const replay = await request(app)
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

  it('rejects a stale version with the latest canonical resource', async () => {
    const response = await request(app)
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"2"')
      .send(command)
      .expect(412);

    expect(response.body.problem.code).toBe('version_conflict');
    expect(response.body.problem.latest.version).toBe(4);
  });

  it('produces a deterministic retryable failure under the failure profile', async () => {
    await request(app)
      .put('/api/chaos')
      .send({
        seed: 42,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        failureRate: 1,
        conflictRate: 0,
      })
      .expect(200);

    const response = await request(app)
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
    await request(app)
      .put('/api/chaos')
      .send({
        seed: 42,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        failureRate: 0,
        conflictRate: 1,
      })
      .expect(200);

    const response = await request(app)
      .post('/api/releases/rel-atlas/commands')
      .set('Idempotency-Key', command.id)
      .set('If-Match', '"4"')
      .send(command)
      .expect(412);

    expect(response.body.problem.code).toBe('version_conflict');
    expect(response.body.problem.latest.changedBy).toBe('Remote operator');
    expect(response.body.problem.latest.version).toBe(5);
  });
});

