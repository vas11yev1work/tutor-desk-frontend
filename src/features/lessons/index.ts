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

/** Перенос одного занятия: бэк ставит isModified и помнит originalStartsAt. */
export const useMoveLesson = () => {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: ({ id, startsAt, durationMin }: { id: string; startsAt: Date; durationMin: number }) =>
      api.patch<unknown>(`/api/admin/lessons/${id}`, { startsAt: startsAt.toISOString(), durationMin }),
    onSuccess: invalidate,
  });
};

/** Правило с даты fromDate: старое заканчивается накануне, будущие немодифицированные занятия переезжают. */
export const useChangeSeries = () => {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: Pick<Series, 'id' | 'weekday' | 'startTime' | 'durationMin' | 'timezone'> & { fromDate: string }) =>
      api.post<Series>(`/api/admin/series/${id}/change`, body),
    onSuccess: invalidate,
  });
};

/** Завершить правило: занятий не будет начиная с fromDate. */
export const useEndSeries = () => {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: ({ id, fromDate }: { id: string; fromDate: string }) =>
      api.post<void>(`/api/admin/series/${id}/end`, { fromDate }),
    onSuccess: invalidate,
  });
};

/** Удаление навсегда — только разовые; регулярные бэк не даст удалить (409), их отменяют. */
export const useDeleteLesson = () => {
  const qc = useQueryClient();
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/admin/lessons/${id}`),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: ['lessons', 'one', id] });
      return invalidate();
    },
  });
};

/** Отмена и возврат: бэк отдаёт обновлённое занятие. */
export const useLessonStatus = (action: 'cancel' | 'restore') => {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: (id: string) => api.post<Lesson>(`/api/admin/lessons/${id}/${action}`),
    onSuccess: invalidate,
  });
};

export const useLesson = (id: MaybeRefOrGetter<string>) =>
  useQuery({
    queryKey: computed(() => ['lessons', 'one', toValue(id)]),
    queryFn: () => api.get<Lesson>(`/api/admin/lessons/${toValue(id)}`),
  });

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

export const DURATIONS = [45, 60, 90, 120].map(m => ({ value: m, label: `${m} мин` }));

// «Каждую среду», «Каждый вторник», «Каждое воскресенье»
const EVERY = [
  'Каждый понедельник',
  'Каждый вторник',
  'Каждую среду',
  'Каждый четверг',
  'Каждую пятницу',
  'Каждую субботу',
  'Каждое воскресенье',
];
/** ISO-день недели (1 — понедельник) → «Каждую среду». */
export const everyIsoWeekday = (weekday: number) => EVERY[weekday - 1]!;
export const everyWeekday = (d: Date) => everyIsoWeekday(((d.getDay() + 6) % 7) + 1);

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
