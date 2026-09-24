import { describe, expect, it } from 'vitest';
import { validaGrammi, validaValoriPer100g } from './validazione';

describe('validaValoriPer100g', () => {
  it('accetta valori validi, con o senza fibre', () => {
    expect(validaValoriPer100g({ kcal: 353, carboidrati: 69.3, proteine: 14.6, grassi: 2.4, fibre: 6.5 })).toEqual([]);
    expect(validaValoriPer100g({ kcal: 0, carboidrati: 0, proteine: 0, grassi: 0 })).toEqual([]);
  });

  it('rifiuta valori negativi', () => {
    expect(validaValoriPer100g({ kcal: -1, carboidrati: -2, proteine: 0, grassi: 0 })).toEqual([
      'Le calorie non possono essere negative.',
      'I carboidrati non possono essere negativi.',
    ]);
  });

  it('rifiuta valori che non sono numeri', () => {
    expect(validaValoriPer100g({ kcal: Number.NaN, carboidrati: 0, proteine: 0, grassi: 0 })).toEqual([
      'Le calorie devono essere un numero.',
    ]);
  });

  it('rifiuta nutrienti che superano in totale 100 g', () => {
    expect(validaValoriPer100g({ kcal: 500, carboidrati: 60, proteine: 30, grassi: 10, fibre: 1 })).toEqual([
      'La somma di carboidrati, proteine, grassi e fibre non può superare 100 g.',
    ]);
  });
});

describe('validaGrammi', () => {
  it('accetta quantità positive', () => {
    expect(validaGrammi(125)).toEqual([]);
    expect(validaGrammi(0.5)).toEqual([]);
  });

  it('rifiuta zero, negativi e non numeri', () => {
    expect(validaGrammi(0)).toEqual(['La quantità deve essere maggiore di 0 g.']);
    expect(validaGrammi(-10)).toEqual(['La quantità deve essere maggiore di 0 g.']);
    expect(validaGrammi(Number.NaN)).toEqual(['La quantità deve essere un numero.']);
  });
});

describe('validaValoriPer100g – messaggi', () => {
  it('usa l’accordo corretto per proteine, grassi e fibre', () => {
    expect(validaValoriPer100g({ kcal: 0, carboidrati: 0, proteine: -1, grassi: -1, fibre: -1 })).toEqual([
      'Le proteine non possono essere negative.',
      'I grassi non possono essere negativi.',
      'Le fibre non possono essere negative.',
    ]);
  });
});
