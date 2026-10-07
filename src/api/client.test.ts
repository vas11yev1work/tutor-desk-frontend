import { afterEach, describe, expect, it, vi } from 'vitest';

import { api, ApiError } from './client';

const mockFetch = (impl: () => Promise<Response>) => vi.stubGlobal('fetch', vi.fn(impl));

afterEach(() => vi.unstubAllGlobals());

describe('api client', () => {
  it('parses a JSON response and sends credentials + JSON body', async () => {
    mockFetch(() => Promise.resolve(Response.json({ ok: 1 })));
    await expect(api.post('/api/x', { a: 1 })).resolves.toEqual({ ok: 1 });
    expect(fetch).toHaveBeenCalledWith(
      '/api/x',
      expect.objectContaining({ method: 'POST', credentials: 'include', body: '{"a":1}' }),
    );
  });

  it('throws ApiError from the backend error format', async () => {
    mockFetch(() =>
      Promise.resolve(Response.json({ error: { code: 'not_found', message: 'Не найдено' } }, { status: 404 })),
    );
    await expect(api.get('/api/s/x')).rejects.toEqual(new ApiError(404, 'not_found', 'Не найдено'));
  });

  it('returns undefined on 204', async () => {
    mockFetch(() => Promise.resolve(new Response(null, { status: 204 })));
    await expect(api.post('/api/auth/logout')).resolves.toBeUndefined();
  });

  it('wraps network failures into ApiError with code "network"', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    await expect(api.get('/api/x')).rejects.toMatchObject({ name: 'ApiError', status: 0, code: 'network' });
  });
});
