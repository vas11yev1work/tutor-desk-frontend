/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Базовый URL бэкенда; пусто — тот же домен (локально через прокси Vite). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
