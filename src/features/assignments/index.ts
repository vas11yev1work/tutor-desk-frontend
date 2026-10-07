import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { api, BASE_URL } from '@/api/client';
import type { Assignment, ExamMaxScores } from '@/api/types';

/** Лимит бэка — проверяем заранее, чтобы не гнать 50 МБ ради ошибки 413. */
export const MAX_FILE_MB = 20;

/** PDF открывается в браузере: бэк отдаёт его inline, cookie сессии уходит сама. */
export const assignmentFileUrl = (id: string) => `${BASE_URL}/api/admin/assignments/${id}/file`;

/** 1 234 567 → «1,2 МБ», 350 000 → «342 КБ». */
export const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} КБ`
    : `${(bytes / 1024 / 1024).toLocaleString('ru', { maximumFractionDigits: 1 })} МБ`;

/** Ошибка до загрузки или пусто, если файл подходит. */
export const checkPdf = (file: File) => {
  if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))
    return 'Нужен PDF-файл';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Файл больше ${MAX_FILE_MB} МБ`;
  return '';
};

/** Файлы видны в занятиях и в нумерации пробников — после изменений обновляем и то и другое. */
const useInvalidateAssignments = () => {
  const qc = useQueryClient();
  return () =>
    Promise.all([qc.invalidateQueries({ queryKey: ['lessons'] }), qc.invalidateQueries({ queryKey: ['mocks'] })]);
};

/** Файл к занятию: домашка или пробник, выданный как домашка. */
export const useUploadToLesson = () => {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: ({ lessonId, file, kind }: { lessonId: string; file: File; kind: Assignment['kind'] }) => {
      const body = new FormData();
      body.append('file', file);
      body.append('kind', kind);
      return api.post<Assignment>(`/api/admin/lessons/${lessonId}/assignments`, body);
    },
    onSuccess: invalidate,
  });
};

/** Пробник ученика: number — «Пробник 3» по порядку выдачи, lessonStartsAt — когда занятие, к которому он выдан. */
export type Mock = Assignment & { number: number; lessonStartsAt: string };

/** Пробники ученика по порядку выдачи. */
export const useStudentMocks = (studentId: MaybeRefOrGetter<string>) =>
  useQuery({
    queryKey: computed(() => ['mocks', toValue(studentId)]),
    queryFn: () => api.get<Mock[]>(`/api/admin/students/${toValue(studentId)}/mocks`),
  });

/**
 * Задания пробника: часть 1 — по 1 баллу (верно/неверно), часть 2 — с развёрнутым ответом (0…max).
 * Индексы — по порядку номеров; номер задания = индекс + 1.
 */
export const splitParts = (max: number[]) => ({
  part1: max.flatMap((m, i) => (m === 1 ? [i] : [])),
  part2: max.flatMap((m, i) => (m > 1 ? [i] : [])),
});

/** «1–12» для подряд идущих номеров, иначе «1, 3, 5». */
export const formatTaskRange = (indices: number[]) => {
  const nums = indices.map(i => i + 1);
  const contiguous = nums.every((n, k) => k === 0 || n === nums[k - 1]! + 1);
  return contiguous && nums.length > 1 ? `${nums[0]}–${nums.at(-1)}` : nums.join(', ');
};

/** Максимумы по заданиям не меняются — грузим один раз. */
export const useExamMaxScores = () =>
  useQuery({
    queryKey: ['exams'],
    queryFn: () => api.get<ExamMaxScores>('/api/admin/exams'),
    staleTime: Infinity,
  });

/** Баллы пробника целиком: бэк принимает массив на все задания экзамена, без пропусков. */
export const useScoreMock = () => {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: ({ id, scores, comment }: { id: string; scores: number[]; comment: string | null }) =>
      api.put<Assignment>(`/api/admin/assignments/${id}/score`, { scores, comment }),
    onSuccess: invalidate,
  });
};

export const useDeleteAssignment = () => {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/admin/assignments/${id}`),
    onSuccess: invalidate,
  });
};
