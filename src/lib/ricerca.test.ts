import { describe, expect, it } from 'vitest';
import { cercaAlimenti, normalizzaTesto } from './ricerca';
import type { Alimento } from './tipi';

const valori = { kcal: 0, carboidrati: 0, proteine: 0, grassi: 0 };
function base(id: string, nome: string): Alimento {
  return { id, origine: 'base', nome, categoria: 'Frutta', valori };
}
function personale(id: string, nome: string, marca?: string): Alimento {
  return { id, origine: 'personale', nome, ...(marca ? { marca } : {}), valori };
}

const alimenti: Alimento[] = [
  base('b1', 'Mele, fresche, con buccia'),
  base('b2', 'Melanzane, crude'),
  base('b3', 'Caffè, infuso'),
  base('b4', 'Pomodori, maturi, freschi'),
  base('b5', 'Succo di mela'),
  personale('p1', 'Yogurt greco', 'Marca A'),
  personale('p2', 'Yogurt greco', 'Marca B'),
];

describe('normalizzaTesto', () => {
  it('toglie accenti, maiuscole e punteggiatura', () => {
    expect(normalizzaTesto('  Caffè, INFUSO! ')).toBe('caffe infuso');
    expect(normalizzaTesto("Pasta all'uovo")).toBe('pasta all uovo');
  });
});

describe('cercaAlimenti', () => {
  it('senza testo non restituisce nulla', () => {
    expect(cercaAlimenti(alimenti, '   ')).toEqual([]);
  });

  it('ignora maiuscole e accenti', () => {
    expect(cercaAlimenti(alimenti, 'CAFFE').map((a) => a.id)).toEqual(['b3']);
  });

  it('richiede che tutte le parole siano presenti, in qualsiasi ordine', () => {
    expect(cercaAlimenti(alimenti, 'freschi pomodori').map((a) => a.id)).toEqual(['b4']);
    expect(cercaAlimenti(alimenti, 'pomodori crude')).toEqual([]);
  });

  it('mette prima i nomi che iniziano con la ricerca, a parità i più corti', () => {
    expect(cercaAlimenti(alimenti, 'mel').map((a) => a.id)).toEqual(['b2', 'b1', 'b5']);
  });

  it('premia la parola intera', () => {
    expect(cercaAlimenti(alimenti, 'mela').map((a) => a.id)).toEqual(['b5', 'b2']);
  });

  it('cerca anche nella marca degli alimenti personali', () => {
    expect(cercaAlimenti(alimenti, 'yogurt marca b').map((a) => a.id)).toEqual(['p2']);
    expect(cercaAlimenti(alimenti, 'yogurt').map((a) => a.id)).toEqual(['p1', 'p2']);
  });

  it('limita il numero di risultati', () => {
    expect(cercaAlimenti(alimenti, 'e', 2)).toHaveLength(2);
  });
});
