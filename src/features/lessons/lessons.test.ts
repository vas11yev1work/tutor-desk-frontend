import { describe, expect, it } from 'vitest';

import type { Lesson } from '@/api/types';

import { findOverlap, formatUntil, fromIsoDateTime, isoWeekday, movedFrom, pluralize, startOfWeek, toIsoDate } from '.';

const lesson = (p: Partial<Lesson>): Lesson => ({
  id: '1',
  seriesId: 's',
  startsAt: new Date(2026, 9, 7, 15, 30).toISOString(),
  durationMin: 60,
  status: 'scheduled',
  originalStartsAt: null,
  isModified: false,
  student: { id: 'st', name: 'Маша Соколова', grade: 11, exam: 'ege_profile' },
  assignments: [],
  ...p,
});

describe('lessons helpers', () => {
  it('startOfWeek — понедельник, и для воскресенья тоже', () => {
    expect(startOfWeek(new Date(2026, 9, 7, 12))).toEqual(new Date(2026, 9, 5));
    expect(startOfWeek(new Date(2026, 9, 11, 23))).toEqual(new Date(2026, 9, 5));
  });

  it('formatUntil', () => {
    const at = new Date(2026, 9, 7, 13, 30);
    expect(formatUntil(at, new Date(2026, 9, 7, 14, 10))).toBe('40 мин');
    expect(formatUntil(at, new Date(2026, 9, 7, 15, 30))).toBe('2 ч');
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

describe('даты для форм', () => {
  it('toIsoDate и fromIsoDateTime — в поясе браузера, туда и обратно', () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(fromIsoDateTime('2026-10-10', '12:30')).toEqual(new Date(2026, 9, 10, 12, 30));
  });

  it('isoWeekday: понедельник 1, воскресенье 7', () => {
    expect(isoWeekday(new Date(2026, 9, 5))).toBe(1);
    expect(isoWeekday(new Date(2026, 9, 11))).toBe(7);
  });
});

describe('findOverlap', () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 10, h, m);
  const l = (id: string, h: number, m = 0, status: Lesson['status'] = 'scheduled') =>
    lesson({ id, startsAt: at(h, m).toISOString(), status });

  it('находит пересечение, стык и отменённое — не пересечение', () => {
    const slot = [{ start: at(12), end: at(13) }];
    expect(findOverlap([l('a', 11), l('b', 13)], slot)).toBeUndefined();
    expect(findOverlap([l('c', 12, 30, 'cancelled')], slot)).toBeUndefined();
    expect(findOverlap([l('a', 11), l('d', 12, 30)], slot)?.id).toBe('d');
  });
});
