import { describe, expect, it } from 'vitest';

import type { Series } from '@/api/types';

import { checkCover, seriesCaption, telegram } from '.';

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

describe('seriesCaption', () => {
  const s = (p: Partial<Series> = {}): Series => ({
    id: 's',
    studentId: 'a',
    weekday: 3,
    startTime: '15:30',
    durationMin: 60,
    timezone: 'Europe/Rome',
    startsOn: '2026-09-01',
    endsOn: null,
    ...p,
  });

  it('бессрочное и с концом', () => {
    expect(seriesCaption(s())).toBe('регулярно в 15:30 · 60 мин · с 1 сентября');
    expect(seriesCaption(s({ endsOn: '2027-05-31' }))).toBe('регулярно в 15:30 · 60 мин · с 1 сентября · до 31 мая');
  });
});

describe('checkCover', () => {
  it('JPEG, PNG, WebP до 5 МБ', () => {
    expect(checkCover(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))).toBe('');
    expect(checkCover(new File(['x'], 'a.webp', { type: 'image/webp' }))).toBe('');
    expect(checkCover(new File(['x'], 'a.gif', { type: 'image/gif' }))).toMatch('JPEG');
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'a.png', { type: 'image/png' });
    expect(checkCover(big)).toMatch('5 МБ');
  });
});
