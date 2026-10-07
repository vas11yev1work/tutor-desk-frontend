import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { api } from '@/api/client';
import type { Exam, Lesson, Series, Student } from '@/api/types';
import type { Tone } from '@/components/ui/tones';

export const EXAM_LABEL: Record<Exam, string> = {
  ege_profile: 'ЕГЭ профиль',
  ege_base: 'ЕГЭ база',
  oge: 'ОГЭ',
};

/** Цвет аватарки и чипа экзамена; none — без экзамена. */
export const EXAM_TONE: Record<Exam | 'none', Tone> = {
  ege_profile: 'violet',
  ege_base: 'peach',
  oge: 'sky',
  none: 'neutral',
};

/** Telegram из поля contact: «masha_sok» и «@masha_sok» → { label: '@masha_sok', url: 'https://t.me/masha_sok' }. */
export const telegram = (contact: string | null) => {
  const username = contact?.trim().replace(/^@/, '');
  if (!username) return null;
  return { label: `@${username}`, url: `https://t.me/${encodeURIComponent(username)}` };
};

/** «ЕГЭ профиль», «7 класс» или пусто. */
export const studentCaption = (s: Pick<Student, 'grade' | 'exam'>) =>
  s.exam ? EXAM_LABEL[s.exam] : s.grade ? `${s.grade} класс` : '';

export const useStudents = () =>
  useQuery({ queryKey: ['students'], queryFn: () => api.get<Student[]>('/api/admin/students') });

export type NewStudent = Pick<Student, 'name' | 'grade' | 'exam' | 'contact' | 'notes'>;

export const useCreateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NewStudent) => api.post<Student>('/api/admin/students', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
};

export const useStudent = (id: MaybeRefOrGetter<string>) =>
  useQuery({
    queryKey: computed(() => ['students', toValue(id)]),
    queryFn: () => api.get<Student>(`/api/admin/students/${toValue(id)}`),
  });

export const useUpdateStudent = (id: MaybeRefOrGetter<string>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<NewStudent>) => api.patch<Student>(`/api/admin/students/${toValue(id)}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
};

/** Перевыпуск личной ссылки: старая перестаёт работать. */
export const useRegenerateToken = (id: MaybeRefOrGetter<string>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Student>(`/api/admin/students/${toValue(id)}/regenerate-token`),
    onSuccess: student => qc.setQueryData(['students', toValue(id)], student),
  });
};

/** Удаление навсегда — вместе с занятиями. */
export const useDeleteStudent = (id: MaybeRefOrGetter<string>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<void>(`/api/admin/students/${toValue(id)}`),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['students', toValue(id)] });
      void qc.invalidateQueries({ queryKey: ['students'] });
      void qc.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
};

export const useStudentLessons = (id: MaybeRefOrGetter<string>, range: { from: Date; to: Date }) =>
  useQuery({
    queryKey: computed(() => ['lessons', 'student', toValue(id), range.from.toISOString(), range.to.toISOString()]),
    queryFn: () => {
      const q = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() });
      return api.get<Lesson[]>(`/api/admin/students/${toValue(id)}/lessons?${q}`);
    },
  });

export const useStudentSeries = (id: MaybeRefOrGetter<string>) =>
  useQuery({
    queryKey: computed(() => ['series', 'student', toValue(id)]),
    queryFn: () => api.get<Series[]>(`/api/admin/students/${toValue(id)}/series`),
  });

const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

/** 'YYYY-MM-DD' → «1 сентября». */
const formatIsoDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d).toLocaleDateString('ru', { day: 'numeric', month: 'long' });
};

/** Правила с одинаковым временем и длительностью — одной карточкой: «пн ср пт · в 15:30 · 60 мин». */
export const groupSeries = (series: Series[]) => {
  const groups = new Map<string, Series[]>();
  for (const s of series) {
    const key = `${s.startTime}|${s.durationMin}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  return [...groups.values()].map(list => {
    const { startTime, durationMin } = list[0]!;
    const startsOn = list.map(s => s.startsOn).sort()[0]!;
    const endsOn = list.every(s => s.endsOn)
      ? list
          .map(s => s.endsOn!)
          .sort()
          .at(-1)!
      : null;
    return {
      key: `${startTime}|${durationMin}`,
      days: [...new Set(list.map(s => s.weekday))].sort().map(w => WEEKDAYS[w - 1]!),
      caption: [
        `регулярно в ${startTime}`,
        `${durationMin} мин`,
        `с ${formatIsoDate(startsOn)}`,
        endsOn && `до ${formatIsoDate(endsOn)}`,
      ]
        .filter(Boolean)
        .join(' · '),
    };
  });
};

/** Публичная ссылка ученика — страница /s/:token этого же фронта. */
export const portalUrl = (token: string) => `${location.origin}/s/${token}`;
