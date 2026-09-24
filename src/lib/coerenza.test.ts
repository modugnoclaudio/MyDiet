import { describe, expect, it } from 'vitest';
import { FATTORI_CREA, FATTORI_ETICHETTA, stimaKcal, verificaKcal } from './coerenza';

describe('stimaKcal', () => {
  it('usa i fattori delle etichette UE', () => {
    const valori = { kcal: 0, carboidrati: 10, proteine: 5, grassi: 2, fibre: 3 };
    expect(stimaKcal(valori, FATTORI_ETICHETTA)).toBe(40 + 20 + 18 + 6);
  });

  it('conta 0 le fibre non indicate', () => {
    expect(stimaKcal({ kcal: 0, carboidrati: 10, proteine: 0, grassi: 0 }, FATTORI_ETICHETTA)).toBe(40);
  });

  it('riproduce le kcal del farro perlato crudo delle tabelle CREA', () => {
    // CREA, codice 000020: 353 kcal, proteine 14,6 g, lipidi 2,4 g,
    // carboidrati disponibili 69,3 g, fibra totale 6,5 g
    const farro = { kcal: 353, carboidrati: 69.3, proteine: 14.6, grassi: 2.4, fibre: 6.5 };
    expect(stimaKcal(farro, FATTORI_CREA)).toBeCloseTo(352.9, 1);
  });
});

describe('verificaKcal', () => {
  it('accetta valori coerenti', () => {
    const esito = verificaKcal({ kcal: 84, carboidrati: 10, proteine: 5, grassi: 2, fibre: 3 });
    expect(esito).toEqual({ coerente: true, kcalStimate: 84, scarto: 0 });
  });

  it('accetta piccoli scarti dovuti agli arrotondamenti', () => {
    expect(verificaKcal({ kcal: 90, carboidrati: 10, proteine: 5, grassi: 2, fibre: 3 }).coerente).toBe(true);
  });

  it('segnala un probabile errore di battitura', () => {
    // 840 kcal invece di 84
    const esito = verificaKcal({ kcal: 840, carboidrati: 10, proteine: 5, grassi: 2, fibre: 3 });
    expect(esito.coerente).toBe(false);
    expect(esito.scarto).toBe(756);
  });

  it('per alimenti poco calorici usa la tolleranza assoluta', () => {
    // stimate 10 kcal: il 10% sarebbe 1 kcal, ma sono ammesse 5 kcal
    expect(verificaKcal({ kcal: 14, carboidrati: 2, proteine: 0.5, grassi: 0 }).coerente).toBe(true);
    expect(verificaKcal({ kcal: 16, carboidrati: 2, proteine: 0.5, grassi: 0 }).coerente).toBe(false);
  });

  it('accetta tolleranze personalizzate', () => {
    const valori = { kcal: 100, carboidrati: 20, proteine: 0, grassi: 0 };
    expect(verificaKcal(valori, FATTORI_ETICHETTA, { relativa: 0.3, assoluta: 0 }).coerente).toBe(true);
    expect(verificaKcal(valori, FATTORI_ETICHETTA, { relativa: 0.1, assoluta: 0 }).coerente).toBe(false);
  });
});
