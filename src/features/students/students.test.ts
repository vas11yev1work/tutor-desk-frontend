import { describe, expect, it } from 'vitest';

import { telegram } from '.';

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
