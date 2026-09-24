import { describe, expect, it } from 'vitest';
import { etichettaGiorno, formattaData, formattaNumero, leggiNumero } from './formato';

describe('formattaNumero', () => {
  it('usa la virgola decimale e il punto delle migliaia', () => {
    expect(formattaNumero(1234.56, 1)).toBe('1.234,6');
    expect(formattaNumero(12.5, 1)).toBe('12,5');
    expect(formattaNumero(12, 1)).toBe('12');
  });

  it('arrotonda all’intero per default e non mostra "-0"', () => {
    expect(formattaNumero(282.4)).toBe('282');
    expect(formattaNumero(-0.2)).toBe('0');
  });
});

describe('leggiNumero', () => {
  it('accetta virgola o punto', () => {
    expect(leggiNumero('12,5')).toBe(12.5);
    expect(leggiNumero('12.5')).toBe(12.5);
    expect(leggiNumero(' 150 ')).toBe(150);
    expect(leggiNumero(',5')).toBe(0.5);
  });

  it('restituisce undefined per il campo vuoto', () => {
    expect(leggiNumero('')).toBeUndefined();
    expect(leggiNumero('   ')).toBeUndefined();
  });

  it('restituisce NaN per testo non valido', () => {
    expect(leggiNumero('abc')).toBeNaN();
    expect(leggiNumero('1,2,3')).toBeNaN();
    expect(leggiNumero(',')).toBeNaN();
    expect(leggiNumero('1.234,5')).toBeNaN();
  });
});

describe('formattaData', () => {
  it('scrive la data per esteso in italiano', () => {
    expect(formattaData('2026-09-24')).toBe('giovedì 24 settembre 2026');
    expect(formattaData('2026-01-01')).toBe('giovedì 1 gennaio 2026');
  });
});

describe('etichettaGiorno', () => {
  it('usa Oggi e Ieri, altrimenti la data con l’iniziale maiuscola', () => {
    expect(etichettaGiorno('2026-09-24', '2026-09-24', '2026-09-23')).toBe('Oggi');
    expect(etichettaGiorno('2026-09-23', '2026-09-24', '2026-09-23')).toBe('Ieri');
    expect(etichettaGiorno('2026-09-20', '2026-09-24', '2026-09-23')).toBe('Domenica 20 settembre 2026');
  });
});
