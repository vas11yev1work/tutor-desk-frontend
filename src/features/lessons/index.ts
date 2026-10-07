import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { api } from '@/api/client';
import type { Lesson } from '@/api/types';

export const useLessons = (range: MaybeRefOrGetter<{ from: Date; to: Date }>) =>
  useQuery({
    queryKey: computed(() => ['lessons', toValue(range).from.toISOString(), toValue(range).to.toISOString()]),
    queryFn: () => {
      const { from, to } = toValue(range);
      const q = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
      return api.get<Lesson[]>(`/api/admin/lessons?${q}`);
    },
    placeholderData: keepPreviousData,
  });

export const lessonEnd = (l: Pick<Lesson, 'startsAt' | 'durationMin'>) =>
  new Date(new Date(l.startsAt).getTime() + l.durationMin * 60_000);

/** Перенесён на другой день — в старом дне показываем зачёркнутым. */
export const movedFrom = (l: Lesson) =>
  l.isModified && l.originalStartsAt && !sameDay(new Date(l.originalStartsAt), new Date(l.startsAt))
    ? new Date(l.originalStartsAt)
    : null;

// Даты — в поясе браузера: он же пояс репетитора, в нём бэкенд строит расписание.
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const startOfWeek = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));
export const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

export const formatTime = (d: Date) => d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });

/** «через 40 мин», «через 2 ч». */
export const formatIn = (from: Date, to: Date) => {
  const min = Math.max(1, Math.round((to.getTime() - from.getTime()) / 60_000));
  return min < 60 ? `через ${min} мин` : `через ${Math.round(min / 60)} ч`;
};

const plural = new Intl.PluralRules('ru');
/** plural(3, ['занятие', 'занятия', 'занятий']) → 'занятия'. */
export const pluralize = (n: number, [one, few, many]: [string, string, string]) => {
  const rule = plural.select(n);
  return rule === 'one' ? one : rule === 'few' ? few : many;
};
