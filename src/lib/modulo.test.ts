import { describe, expect, it } from 'vitest';
import { campiDaValori, leggiCampiValori } from './modulo';

const campi = { kcal: '97', carboidrati: '4', proteine: '9,5', grassi: '5', fibre: '' };

describe('leggiCampiValori', () => {
  it('legge i valori con virgola decimale e fibre non indicate', () => {
    expect(leggiCampiValori(campi)).toEqual({
      valori: { kcal: 97, carboidrati: 4, proteine: 9.5, grassi: 5 },
      errori: [],
    });
  });

  it('legge le fibre se indicate, anche 0', () => {
    expect(leggiCampiValori({ ...campi, fibre: '0' }).valori?.fibre).toBe(0);
    expect(leggiCampiValori({ ...campi, fibre: '1.5' }).valori?.fibre).toBe(1.5);
  });

  it('segnala i campi obbligatori vuoti', () => {
    expect(leggiCampiValori({ ...campi, kcal: '', grassi: ' ' }).errori).toEqual([
      'Le calorie sono obbligatorie.',
      'I grassi sono obbligatori.',
    ]);
  });

  it('segnala testo non numerico e valori non validi', () => {
    expect(leggiCampiValori({ ...campi, proteine: 'tanti' }).errori).toEqual(['Le proteine devono essere un numero.']);
    expect(leggiCampiValori({ ...campi, fibre: 'x' }).errori).toEqual(['Le fibre devono essere un numero.']);
    expect(leggiCampiValori({ ...campi, carboidrati: '90', proteine: '20' }).errori).toEqual([
      'La somma di carboidrati, proteine, grassi e fibre non può superare 100 g.',
    ]);
  });
});

describe('campiDaValori', () => {
  it('scrive i valori con la virgola e lascia vuote le fibre non indicate', () => {
    expect(campiDaValori({ kcal: 97, carboidrati: 4, proteine: 9.5, grassi: 5 })).toEqual({
      kcal: '97',
      carboidrati: '4',
      proteine: '9,5',
      grassi: '5',
      fibre: '',
    });
  });

  it('è l’inverso di leggiCampiValori', () => {
    const valori = { kcal: 353, carboidrati: 69.3, proteine: 14.6, grassi: 2.4, fibre: 6.5 };
    expect(leggiCampiValori(campiDaValori(valori)).valori).toEqual(valori);
  });
});
