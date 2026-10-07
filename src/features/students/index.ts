import { useQuery } from '@tanstack/vue-query';

import { api } from '@/api/client';
import type { Exam, Student } from '@/api/types';

export const EXAM_LABEL: Record<Exam, string> = {
  ege_profile: 'ЕГЭ профиль',
  ege_base: 'ЕГЭ база',
  oge: 'ОГЭ',
};

/** Цвета аватарки и чипа экзамена; none — без экзамена. */
export const EXAM_TONE: Record<Exam | 'none', string> = {
  ege_profile: 'bg-[#e9e6ff] text-[#3a2fd6]',
  ege_base: 'bg-[#ffebdd] text-[#9a3b0b]',
  oge: 'bg-[#ddf0ff] text-[#0b5a88]',
  none: 'bg-chip text-label',
};

/** «Маша Соколова» → «МС». */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('');

/** «ЕГЭ профиль», «7 класс» или пусто. */
export const studentCaption = (s: Pick<Student, 'grade' | 'exam'>) =>
  s.exam ? EXAM_LABEL[s.exam] : s.grade ? `${s.grade} класс` : '';

export const useStudents = () =>
  useQuery({ queryKey: ['students'], queryFn: () => api.get<Student[]>('/api/admin/students') });
