import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';

import { api, ApiError } from '@/api/client';
import type { Me } from '@/api/types';

/** null — сессии нет (401). */
export const meQuery = {
  queryKey: ['auth', 'me'],
  queryFn: async (): Promise<Me | null> => {
    try {
      return await api.get<Me>('/api/auth/me');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  },
};

export const useMe = () => useQuery(meQuery);

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { login: string; password: string }) => api.post<void>('/api/auth/login', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: meQuery.queryKey }),
  });
};

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>('/api/auth/logout'),
    onSuccess: () => qc.invalidateQueries({ queryKey: meQuery.queryKey }),
  });
};
