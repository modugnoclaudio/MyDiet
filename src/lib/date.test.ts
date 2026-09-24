import { describe, expect, it } from 'vitest';
import { dataISO, spostaGiorni } from './date';

describe('dataISO', () => {
  it('formatta la data locale con zeri iniziali', () => {
    expect(dataISO(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dataISO(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });
});

describe('spostaGiorni', () => {
  it('va avanti e indietro di giorni', () => {
    expect(spostaGiorni('2026-09-24', 1)).toBe('2026-09-25');
    expect(spostaGiorni('2026-09-24', -1)).toBe('2026-09-23');
  });

  it('gestisce cambi di mese, anno e anni bisestili', () => {
    expect(spostaGiorni('2026-12-31', 1)).toBe('2027-01-01');
    expect(spostaGiorni('2028-03-01', -1)).toBe('2028-02-29');
    expect(spostaGiorni('2026-03-01', -1)).toBe('2026-02-28');
  });
});
