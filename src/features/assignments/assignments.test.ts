import { describe, expect, it } from 'vitest';

import { checkPdf, formatFileSize } from '.';

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
