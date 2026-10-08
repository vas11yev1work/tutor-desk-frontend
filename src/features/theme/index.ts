import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { ref } from 'vue';
import { toast } from 'vue-sonner';

import { api } from '@/api/client';

/** Палитры из style.css; ink и accent — для образца в выборе темы. */
export const THEMES = [
  { id: 'lime', name: 'Лайм', ink: '#14162b', accent: '#d4f54c' },
  { id: 'ocean', name: 'Океан', ink: '#0e2a3b', accent: '#5ce1e6' },
  { id: 'bordeaux', name: 'Бордо', ink: '#3a1020', accent: '#ffd23f' },
  { id: 'plum', name: 'Слива', ink: '#2a1638', accent: '#ff8fb1' },
  { id: 'terracotta', name: 'Терракота', ink: '#2b1d17', accent: '#ff9f5a' },
  { id: 'indigo', name: 'Индиго', ink: '#1e1b4b', accent: '#a5b4fc' },
  { id: 'graphite', name: 'Графит', ink: '#1a1a1a', accent: '#ff6b5b' },
];

/** Ключ localStorage: тема кабинета или тема портала конкретного ученика. Тот же ключ читает скрипт в index.html. */
export const themeStorageKey = (token?: string) => (token ? `td-theme:${token}` : 'td-theme');

/** Текущая тема на <html>; начальное значение проставил скрипт в index.html из localStorage. */
export const currentTheme = ref(document.documentElement.dataset.theme ?? 'lime');

/** Запомнить тему для index.html: следующая загрузка кабинета или портала ученика сразу в ней. */
export const rememberTheme = (theme: string, token?: string) => {
  try {
    localStorage.setItem(themeStorageKey(token), theme);
  } catch {
    // приватный режим — тема просто не переживёт перезагрузку
  }
};

export const applyTheme = (theme: string, token?: string) => {
  currentTheme.value = theme;
  document.documentElement.dataset.theme = theme;
  rememberTheme(theme, token);
  // Иконка вкладки; лайм — общая /favicon.svg, она же у ico и PWA
  const favicon = theme !== 'lime' && THEMES.some(t => t.id === theme) ? `/favicons/${theme}.svg` : '/favicon.svg';
  document.getElementById('favicon')?.setAttribute('href', favicon);
  // Статус-бар PWA в цвет фона темы
  const surface = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim();
  if (surface) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', surface);
};

interface Settings {
  theme: string;
}

const settingsKey = ['settings'];

export const useSettings = () =>
  useQuery({ queryKey: settingsKey, queryFn: () => api.get<Settings>('/api/admin/settings') });

/** Смена темы кабинета: применяется сразу, сохраняется на бэкенде вдогонку; при ошибке — откат. */
export const useSetTutorTheme = () => {
  const qc = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: (body: Settings) => api.patch<Settings>('/api/admin/settings', body),
    onSuccess: data => qc.setQueryData(settingsKey, data),
  });
  return (theme: string) => {
    const prev = currentTheme.value;
    applyTheme(theme);
    mutate(
      { theme },
      {
        onError: () => {
          applyTheme(prev);
          toast.error('Не удалось сменить тему. Попробуйте ещё раз');
        },
      },
    );
  };
};
