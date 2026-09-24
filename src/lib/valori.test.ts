import { describe, expect, it } from 'vitest';
import { sommaValori, valoriPerGrammi } from './valori';

const farro = { kcal: 353, carboidrati: 69.3, proteine: 14.6, grassi: 2.4, fibre: 6.5 };

describe('valoriPerGrammi', () => {
  it('scala i valori per 100 g sulla quantità indicata', () => {
    const v = valoriPerGrammi(farro, 80);
    expect(v.kcal).toBeCloseTo(282.4);
    expect(v.carboidrati).toBeCloseTo(55.44);
    expect(v.proteine).toBeCloseTo(11.68);
    expect(v.grassi).toBeCloseTo(1.92);
    expect(v.fibre).toBeCloseTo(5.2);
  });

  it('con 100 g restituisce gli stessi valori', () => {
    expect(valoriPerGrammi(farro, 100)).toEqual(farro);
  });

  it('con 0 g restituisce tutti zero', () => {
    expect(valoriPerGrammi(farro, 0)).toEqual({ kcal: 0, carboidrati: 0, proteine: 0, grassi: 0, fibre: 0 });
  });

  it('lascia le fibre non indicate se mancano nell’alimento', () => {
    const v = valoriPerGrammi({ kcal: 100, carboidrati: 10, proteine: 5, grassi: 4 }, 50);
    expect(v).toEqual({ kcal: 50, carboidrati: 5, proteine: 2.5, grassi: 2 });
    expect('fibre' in v).toBe(false);
  });
});

describe('sommaValori', () => {
  it('con lista vuota restituisce zero e fibre non indicate', () => {
    expect(sommaValori([])).toEqual({ kcal: 0, carboidrati: 0, proteine: 0, grassi: 0 });
  });

  it('somma tutti i valori', () => {
    const totale = sommaValori([
      { kcal: 100, carboidrati: 10, proteine: 5, grassi: 4, fibre: 1 },
      { kcal: 50, carboidrati: 2, proteine: 3, grassi: 1, fibre: 2 },
    ]);
    expect(totale).toEqual({ kcal: 150, carboidrati: 12, proteine: 8, grassi: 5, fibre: 3 });
  });

  it('somma le fibre solo dove indicate', () => {
    const totale = sommaValori([
      { kcal: 100, carboidrati: 10, proteine: 5, grassi: 4 },
      { kcal: 50, carboidrati: 2, proteine: 3, grassi: 1, fibre: 2 },
    ]);
    expect(totale.fibre).toBe(2);
  });

  it('lascia le fibre non indicate se nessun elemento le indica', () => {
    const totale = sommaValori([{ kcal: 100, carboidrati: 10, proteine: 5, grassi: 4 }]);
    expect(totale.fibre).toBeUndefined();
  });
});
