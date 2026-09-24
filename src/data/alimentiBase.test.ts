import { describe, expect, it } from 'vitest';
import { FATTORI_CREA, verificaKcal } from '../lib/coerenza';
import { validaValoriPer100g } from '../lib/validazione';
import { ALIMENTI_BASE } from './alimentiBase';

const CATEGORIE_INCLUSE = [
  'Cereali e derivati',
  'Legumi',
  'Verdure e ortaggi',
  'Frutta',
  'Frutta secca a guscio e semi oleaginosi',
  'Carni fresche',
  'Prodotti della pesca',
  'Latte e yogurt',
  'Uova',
  'Oli e grassi',
];

describe('ALIMENTI_BASE (tabelle CREA)', () => {
  it('contiene alimenti di tutte e sole le categorie incluse', () => {
    expect(ALIMENTI_BASE.length).toBeGreaterThan(500);
    expect(new Set(ALIMENTI_BASE.map((a) => a.categoria))).toEqual(new Set(CATEGORIE_INCLUSE));
  });

  it('ha id e nomi univoci', () => {
    expect(new Set(ALIMENTI_BASE.map((a) => a.id)).size).toBe(ALIMENTI_BASE.length);
    expect(new Set(ALIMENTI_BASE.map((a) => a.nome)).size).toBe(ALIMENTI_BASE.length);
  });

  it('ha nomi puliti', () => {
    const sporchi = ALIMENTI_BASE.filter((a) => a.nome !== a.nome.trim() || /[|<>]|""|&\w+;/.test(a.nome));
    expect(sporchi.map((a) => a.nome)).toEqual([]);
  });

  it('ha valori per 100 g validi', () => {
    const nonValidi = ALIMENTI_BASE.filter((a) => validaValoriPer100g(a.valori).length > 0);
    expect(nonValidi.map((a) => a.nome)).toEqual([]);
  });

  it('ha kcal coerenti con i nutrienti secondo il metodo CREA (scarto massimo 1 kcal)', () => {
    const incoerenti = ALIMENTI_BASE.filter(
      (a) => !verificaKcal(a.valori, FATTORI_CREA, { relativa: 0, assoluta: 1 }).coerente,
    );
    expect(incoerenti.map((a) => a.nome)).toEqual([]);
  });

  it('riporta i valori della scheda CREA del farro perlato crudo', () => {
    expect(ALIMENTI_BASE.find((a) => a.id === 'crea-000020')).toEqual({
      id: 'crea-000020',
      origine: 'base',
      nome: 'Farro perlato, crudo',
      categoria: 'Cereali e derivati',
      valori: { kcal: 353, carboidrati: 69.3, proteine: 14.6, grassi: 2.4, fibre: 6.5 },
    });
  });

  it('lascia le fibre non indicate dove il CREA non le riporta', () => {
    expect(ALIMENTI_BASE.find((a) => a.id === 'crea-006990')?.valori.fibre).toBeUndefined();
  });
});
