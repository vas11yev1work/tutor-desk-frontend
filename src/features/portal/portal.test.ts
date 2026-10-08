import { describe, expect, it } from 'vitest';

import type { PortalLesson } from '@/api/types';

import { isMoved, splitPortalLessons } from '.';

const lesson = (id: string, startsAt: string, extra: Partial<PortalLesson> = {}): PortalLesson => ({
  id,
  startsAt,
  originalStartsAt: null,
  durationMin: 60,
  status: 'scheduled',
  assignments: [],
  ...extra,
});
const file = (id: string) => ({ id, kind: 'homework' as const, fileName: `${id}.pdf` });

describe('splitPortalLessons', () => {
  const now = new Date('2026-10-07T12:30:00Z');

  it('ближайшее — первое неотменённое, идущее сейчас тоже считается; в прошлых — без пробников', () => {
    const lessons = [
      lesson('old', '2026-10-05T12:00:00Z', {
        assignments: [file('a'), { id: 'mock', kind: 'mock', fileName: 'mock.pdf' }, file('b')],
      }),
      lesson('cancelled', '2026-10-06T12:00:00Z', { status: 'cancelled', assignments: [file('c')] }),
      lesson('now', '2026-10-07T12:00:00Z'),
      lesson('off', '2026-10-08T12:00:00Z', { status: 'cancelled' }),
      lesson('fri', '2026-10-09T12:00:00Z'),
    ];
    const { next, upcoming, past } = splitPortalLessons(lessons, now);
    expect(next?.id).toBe('now');
    expect(upcoming.map(l => l.id)).toEqual(['off', 'fri']);
    expect(past.map(a => a.id)).toEqual(['b', 'a']);
  });

  it('все будущие отменены — ближайшего нет, они в списке', () => {
    const { next, upcoming } = splitPortalLessons(
      [lesson('off', '2026-10-08T12:00:00Z', { status: 'cancelled' })],
      now,
    );
    expect(next).toBeUndefined();
    expect(upcoming).toHaveLength(1);
  });
});

describe('isMoved', () => {
  it('только когда время отличается от правила', () => {
    expect(isMoved(lesson('a', '2026-10-07T12:00:00Z'))).toBe(false);
    expect(isMoved(lesson('a', '2026-10-07T12:00:00Z', { originalStartsAt: '2026-10-07T12:00:00Z' }))).toBe(false);
    expect(isMoved(lesson('a', '2026-10-07T13:00:00Z', { originalStartsAt: '2026-10-07T12:00:00Z' }))).toBe(true);
  });
});
