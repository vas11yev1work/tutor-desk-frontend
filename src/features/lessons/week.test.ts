import { describe, expect, it } from 'vitest';

import type { Lesson } from '@/api/types';

import { buildWeek, findClashes, formatWeekRange } from './week';

const at = (day: number, h: number, m = 0) => new Date(2026, 9, day, h, m).toISOString();
const lesson = (id: string, startsAt: string, p: Partial<Lesson> = {}): Lesson => ({
  id,
  seriesId: 's',
  startsAt,
  durationMin: 60,
  status: 'scheduled',
  originalStartsAt: startsAt,
  isModified: false,
  student: { id: id, name: `Ученик ${id}`, grade: 11, exam: 'oge' },
  ...p,
});

const monday = new Date(2026, 9, 5);
const now = new Date(2026, 9, 7, 12); // среда, полдень

describe('buildWeek', () => {
  it('перенесённое — след в старом дне и занятие в новом', () => {
    const moved = lesson('a', at(7, 18, 30), { isModified: true, originalStartsAt: at(5, 18, 30) });
    const week = buildWeek([moved], monday, now);
    expect(week[0]!.items.map(x => [x.kind, x.range])).toEqual([['movedFrom', '18:30–19:30']]);
    expect(week[2]!.items.map(x => [x.kind, x.range])).toEqual([['normal', '18:30–19:30']]);
    expect(week[0]!.liveCount).toBe(0);
    expect(week[2]!.liveCount).toBe(1);
  });

  it('прошедшее, отменённое и разовое', () => {
    const week = buildWeek(
      [
        lesson('a', at(7, 9)),
        lesson('b', at(7, 15), { status: 'cancelled' }),
        lesson('c', at(7, 17), { seriesId: null }),
      ],
      monday,
      now,
    );
    expect(week[2]!.items.map(x => [x.kind, x.caption])).toEqual([
      ['past', 'ОГЭ · 60 мин'],
      ['cancelled', 'ОГЭ · 60 мин'],
      ['normal', 'ОГЭ · 60 мин'],
    ]);
    expect(week[2]!.liveCount).toBe(2);
  });

  it('пересечение помечает оба занятия, отменённое не пересекается', () => {
    const week = buildWeek(
      [lesson('a', at(10, 12)), lesson('b', at(10, 12, 30)), lesson('c', at(10, 12, 15), { status: 'cancelled' })],
      monday,
      now,
    );
    expect(week[5]!.items.map(x => x.kind)).toEqual(['clash', 'cancelled', 'clash']);
    const clashes = findClashes(week);
    expect(clashes).toHaveLength(1);
    expect(clashes[0]!.pair.map(x => x.lesson.id)).toEqual(['a', 'b']);
  });
});

it('пересечение отмечается и у прошедших занятий', () => {
  const week = buildWeek([lesson('a', at(6, 9)), lesson('b', at(6, 9, 30))], monday, now);
  expect(week[1]!.items.map(x => x.kind)).toEqual(['clash', 'clash']);
});

describe('formatWeekRange', () => {
  it('один месяц и стык месяцев', () => {
    expect(formatWeekRange(monday)).toBe('5 – 11 октября');
    expect(formatWeekRange(new Date(2026, 8, 28))).toBe('28 сентября – 4 октября');
  });
});
