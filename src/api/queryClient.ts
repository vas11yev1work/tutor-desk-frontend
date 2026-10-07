import { QueryClient } from '@tanstack/vue-query';

import { ApiError } from './client';

const isClientError = (e: unknown) => e instanceof ApiError && e.status >= 400 && e.status < 500;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
    },
  },
});
