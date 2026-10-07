import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryClient } from '@/api/queryClient';
import { router } from '@/router';

const mockMe = (status: number) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        status === 200
          ? Response.json({ authenticated: true })
          : Response.json({ error: { code: 'unauthorized' } }, { status }),
      ),
    ),
  );

beforeEach(async () => {
  queryClient.clear();
  vi.unstubAllGlobals();
  mockMe(401);
  await router.push('/s/reset');
});

describe('auth guard', () => {
  it('redirects to /login without a session', async () => {
    await router.push('/');
    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/');
  });

  it('lets an authenticated user in', async () => {
    mockMe(200);
    await router.push('/');
    expect(router.currentRoute.value.fullPath).toBe('/');
  });

  it('sends an authenticated user away from /login', async () => {
    mockMe(200);
    await router.push('/login');
    expect(router.currentRoute.value.fullPath).toBe('/');
  });
});
