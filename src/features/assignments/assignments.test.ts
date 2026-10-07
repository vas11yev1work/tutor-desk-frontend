import { describe, expect, it } from 'vitest';

import { cellLevel, chartTicks, checkPdf, formatFileSize, formatTaskRange, splitParts } from '.';

describe('assignments', () => {
  it('formatFileSize', () => {
    expect(formatFileSize(350_000)).toBe('342 КБ');
    expect(formatFileSize(1_258_291)).toBe('1,2 МБ');
  });

  it('checkPdf', () => {
    expect(checkPdf(new File(['%PDF-'], 'a.pdf', { type: 'application/pdf' }))).toBe('');
    expect(checkPdf(new File(['x'], 'a.png', { type: 'image/png' }))).toBe('Нужен PDF-файл');
    expect(checkPdf(new File([new Uint8Array(21 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' }))).toBe(
      'Файл больше 20 МБ',
    );
  });
});

describe('splitParts', () => {
  it('ЕГЭ профиль: 12 по баллу и 7 развёрнутых', () => {
    const max = [...Array<number>(12).fill(1), 2, 3, 2, 2, 3, 4, 4];
    const { part1, part2 } = splitParts(max);
    expect(formatTaskRange(part1)).toBe('1–12');
    expect(formatTaskRange(part2)).toBe('13–19');
  });

  it('ЕГЭ база: только первая часть', () => {
    expect(splitParts(Array<number>(21).fill(1)).part2).toEqual([]);
  });
});

describe('chartTicks', () => {
  it('5 линий с запасом сверху и снизу', () => {
    expect(chartTicks([11, 13, 16])).toEqual([10, 12, 14, 16, 18]);
    expect(chartTicks([20])).toEqual([19, 20, 21, 22, 23]);
  });

  it('не уходит ниже нуля', () => {
    expect(chartTicks([0, 3])[0]).toBe(0);
  });
});

describe('cellLevel', () => {
  it('полностью, частично, ноль', () => {
    expect([cellLevel(1, 1), cellLevel(2, 4), cellLevel(0, 3)]).toEqual(['full', 'partial', 'zero']);
  });
});
