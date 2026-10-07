import { describe, expect, it } from 'vitest';

import type { Lesson } from '@/api/types';

import { formatIn, movedFrom, pluralize, startOfWeek } from '.';

const lesson = (p: Partial<Lesson>): Lesson => ({
  id: '1',
  seriesId: 's',
  startsAt: new Date(2026, 9, 7, 15, 30).toISOString(),
  durationMin: 60,
  status: 'scheduled',
  originalStartsAt: null,
  isModified: false,
  student: { id: 'st', name: 'Маша Соколова', grade: 11, exam: 'ege_profile' },
  ...p,
});

describe('lessons helpers', () => {
  it('startOfWeek — понедельник, и для воскресенья тоже', () => {
    expect(startOfWeek(new Date(2026, 9, 7, 12))).toEqual(new Date(2026, 9, 5));
    expect(startOfWeek(new Date(2026, 9, 11, 23))).toEqual(new Date(2026, 9, 5));
  });

  it('formatIn', () => {
    const at = new Date(2026, 9, 7, 13, 30);
    expect(formatIn(at, new Date(2026, 9, 7, 14, 10))).toBe('через 40 мин');
    expect(formatIn(at, new Date(2026, 9, 7, 15, 30))).toBe('через 2 ч');
  });

  it('pluralize', () => {
    const forms: [string, string, string] = ['занятие', 'занятия', 'занятий'];
    expect([1, 3, 5, 21].map(n => pluralize(n, forms))).toEqual(['занятие', 'занятия', 'занятий', 'занятие']);
  });

  it('movedFrom — только перенос на другой день', () => {
    const monday = new Date(2026, 9, 5, 18, 30).toISOString();
    expect(movedFrom(lesson({ isModified: true, originalStartsAt: monday }))).toEqual(new Date(monday));
    const sameDay = new Date(2026, 9, 7, 12).toISOString();
    expect(movedFrom(lesson({ isModified: true, originalStartsAt: sameDay }))).toBeNull();
    expect(movedFrom(lesson({ originalStartsAt: monday }))).toBeNull();
  });
});
