import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';

import { api } from '@/api/client';
import type { Exam, Student } from '@/api/types';
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
