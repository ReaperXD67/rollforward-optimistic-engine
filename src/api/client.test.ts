import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiProblemError, getSnapshot } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('API response boundary', () => {
  it('reports an empty upstream response without leaking a JSON parser error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 502 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getSnapshot()).rejects.toMatchObject<ApiProblemError>({
      status: 502,
      problem: {
        code: 'transient_failure',
        message: 'Request failed with status 502.',
        retryable: true,
      },
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/snapshot', {
      headers: expect.objectContaining({
        'X-Scenario-Id': '00000000-0000-4000-8000-000000000001',
      }),
    });
  });

  it('identifies malformed successful JSON as a recoverable protocol failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>proxy failure</html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    await expect(getSnapshot()).rejects.toMatchObject<ApiProblemError>({
      status: 200,
      problem: {
        code: 'transient_failure',
        message: 'The API returned malformed JSON (HTTP 200).',
        retryable: true,
      },
    });
  });
});
