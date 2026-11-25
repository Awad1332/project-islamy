import { describe, expect, it } from 'vitest';
import { slugify, toHalalas, sarInput } from './utils';

describe('web utils', () => {
  it('converts SAR input (incl. Arabic-Indic digits) to halalas', () => {
    expect(toHalalas('345.5')).toBe(34550);
    expect(toHalalas('٣٤٥')).toBe(34500);
    expect(toHalalas('abc')).toBe(0);
    expect(sarInput(34550)).toBe('345.5');
    expect(sarInput(null)).toBe('');
  });
  it('slugifies handles', () => {
    expect(slugify('Dar Layan  Abayas!')).toBe('dar-layan-abayas');
  });
});
