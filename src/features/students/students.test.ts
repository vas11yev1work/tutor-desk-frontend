import { describe, expect, it } from 'vitest';

import type { Series } from '@/api/types';

import { groupSeries, telegram } from '.';

describe('telegram', () => {
  it('добавляет @ для показа и убирает его из ссылки', () => {
    const expected = { label: '@masha_sok', url: 'https://t.me/masha_sok' };
    expect(telegram('masha_sok')).toEqual(expected);
    expect(telegram('@masha_sok')).toEqual(expected);
    expect(telegram('  @masha_sok ')).toEqual(expected);
  });

  it('пусто — null', () => {
    expect(telegram(null)).toBeNull();
    expect(telegram('  ')).toBeNull();
    expect(telegram('@')).toBeNull();
  });
});

describe('groupSeries', () => {
  const s = (weekday: number, startTime: string, extra: Partial<Series> = {}): Series => ({
    id: `${weekday}${startTime}`,
    studentId: 'a',
    weekday,
    startTime,
    durationMin: 60,
    timezone: 'Europe/Moscow',
    startsOn: '2026-09-01',
    endsOn: null,
    ...extra,
  });

  it('склеивает дни с одинаковым временем, дни по порядку недели', () => {
    expect(groupSeries([s(5, '15:30'), s(1, '15:30'), s(3, '15:30', { startsOn: '2026-09-03' })])).toEqual([
      { key: '15:30|60', days: ['пн', 'ср', 'пт'], caption: 'регулярно в 15:30 · 60 мин · с 1 сентября' },
    ]);
  });

  it('разное время — разные карточки; конец, если он у всех', () => {
    const groups = groupSeries([s(2, '17:00', { endsOn: '2027-05-31' }), s(6, '11:00')]);
    expect(groups.map(g => g.caption)).toEqual([
      'регулярно в 17:00 · 60 мин · с 1 сентября · до 31 мая',
      'регулярно в 11:00 · 60 мин · с 1 сентября',
    ]);
  });
});
