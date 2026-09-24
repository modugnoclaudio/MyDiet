import { describe, expect, it } from 'vitest';
import { dataISO, giorniTra, spostaGiorni } from './date';

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

describe('giorniTra', () => {
  it('conta i giorni di calendario, anche tra mesi e anni', () => {
    expect(giorniTra('2026-09-24', '2026-09-24')).toBe(0);
    expect(giorniTra('2026-09-24', '2026-10-24')).toBe(30);
    expect(giorniTra('2026-12-31', '2027-01-01')).toBe(1);
    expect(giorniTra('2028-02-28', '2028-03-01')).toBe(2);
    expect(giorniTra('2026-09-24', '2026-09-20')).toBe(-4);
  });
});
