const BASE_URL: string = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let onUnauthorized = () => {};

/** Вызывается на 401 от /api/admin/* (сброс сессии + редирект на логин). */
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE_URL + path, {
      method,
      credentials: 'include',
      headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw new ApiError(0, 'network', e instanceof Error ? e.message : 'Network error');
  }

  if (res.ok) return (res.status === 204 ? undefined : await res.json()) as T;

  if (res.status === 401 && path.startsWith('/api/admin/')) onUnauthorized();

  // Бэкенд отвечает { error: { code, message? } }; message бывает пустым (401 на логине).
  const data = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
  const code = data?.error?.code ?? 'http_error';
  throw new ApiError(res.status, code, data?.error?.message ?? code);
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
