import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { api } from '@/api/client';
import type { Lesson, Series } from '@/api/types';

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

/** Новое занятие меняет и расписание, и правила ученика. */
const useInvalidateSchedule = () => {
  const qc = useQueryClient();
  return () =>
    Promise.all([qc.invalidateQueries({ queryKey: ['lessons'] }), qc.invalidateQueries({ queryKey: ['series'] })]);
};

/** Регулярное: правило в поясе браузера, бэк сам материализует занятия на 8 недель. */
export const useCreateSeries = () => {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: (body: Pick<Series, 'studentId' | 'weekday' | 'startTime' | 'durationMin' | 'startsOn'>) =>
      api.post<Series>('/api/admin/series', { ...body, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    onSuccess: invalidate,
  });
};

export const useCreateLesson = () => {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: (body: { studentId: string; startsAt: Date; durationMin: number }) =>
      api.post<Lesson>('/api/admin/lessons', { ...body, startsAt: body.startsAt.toISOString() }),
    onSuccess: invalidate,
  });
};

export const lessonEnd = (l: Pick<Lesson, 'startsAt' | 'durationMin'>) =>
  new Date(new Date(l.startsAt).getTime() + l.durationMin * 60_000);

/** Первое занятие, которое состоится и пересекается с одним из слотов. */
export const findOverlap = (lessons: Lesson[], slots: { start: Date; end: Date }[]) =>
  lessons.find(
    l => l.status === 'scheduled' && slots.some(s => new Date(l.startsAt) < s.end && s.start < lessonEnd(l)),
  );

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

/** Дата в поясе браузера → 'YYYY-MM-DD'. */
export const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** 'YYYY-MM-DD' и 'HH:MM' → Date в поясе браузера. */
export const fromIsoDateTime = (date: string, time = '00:00') => {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y!, m! - 1, d, h, min);
};

/** ISO-день недели: 1 — понедельник … 7 — воскресенье. */
export const isoWeekday = (d: Date) => ((d.getDay() + 6) % 7) + 1;

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
