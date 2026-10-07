import { useQuery } from '@tanstack/vue-query';

import { api } from '@/api/client';
import type { Exam, Student } from '@/api/types';

export const EXAM_LABEL: Record<Exam, string> = {
  ege_profile: 'ЕГЭ профиль',
  ege_base: 'ЕГЭ база',
  oge: 'ОГЭ',
};

/** «ЕГЭ профиль», «7 класс» или пусто. */
export const studentCaption = (s: Pick<Student, 'grade' | 'exam'>) =>
  s.exam ? EXAM_LABEL[s.exam] : s.grade ? `${s.grade} класс` : '';

export const useStudents = () =>
  useQuery({ queryKey: ['students'], queryFn: () => api.get<Student[]>('/api/admin/students') });
