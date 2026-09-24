import { describe, expect, it } from 'vitest';
import { creaVoce, totaleVoci, totaliPerPasto, valoriVoce, vociDelGiorno } from './diario';
import type { AlimentoBase, AlimentoPersonale, Pasto, VoceDiario } from './tipi';

function voce(id: string, data: string, pasto: Pasto, grammi: number, fibre?: number): VoceDiario {
  return {
    id,
    data,
    pasto,
    grammi,
    alimento: {
      id: 'a1',
      nome: 'Alimento di prova',
      valori: { kcal: 200, carboidrati: 20, proteine: 10, grassi: 8, ...(fibre === undefined ? {} : { fibre }) },
    },
  };
}

describe('valoriVoce', () => {
  it('calcola i valori in base ai grammi della voce', () => {
    expect(valoriVoce(voce('v1', '2026-09-24', 'pranzo', 150, 4))).toEqual({
      kcal: 300,
      carboidrati: 30,
      proteine: 15,
      grassi: 12,
      fibre: 6,
    });
  });
});

describe('vociDelGiorno', () => {
  it('tiene solo le voci della data indicata', () => {
    const voci = [
      voce('v1', '2026-09-23', 'cena', 100),
      voce('v2', '2026-09-24', 'colazione', 100),
      voce('v3', '2026-09-24', 'pranzo', 100),
    ];
    expect(vociDelGiorno(voci, '2026-09-24').map((v) => v.id)).toEqual(['v2', 'v3']);
    expect(vociDelGiorno(voci, '2026-09-25')).toEqual([]);
  });
});

describe('totaleVoci', () => {
  it('somma i valori di tutte le voci', () => {
    const totale = totaleVoci([voce('v1', '2026-09-24', 'colazione', 50), voce('v2', '2026-09-24', 'cena', 150)]);
    expect(totale).toEqual({ kcal: 400, carboidrati: 40, proteine: 20, grassi: 16 });
  });

  it('senza voci restituisce zero', () => {
    expect(totaleVoci([]).kcal).toBe(0);
  });
});

describe('totaliPerPasto', () => {
  it('raggruppa i totali per pasto, con zero per i pasti vuoti', () => {
    const totali = totaliPerPasto([
      voce('v1', '2026-09-24', 'colazione', 50),
      voce('v2', '2026-09-24', 'pranzo', 100),
      voce('v3', '2026-09-24', 'pranzo', 100),
    ]);
    expect(totali.colazione.kcal).toBe(100);
    expect(totali.pranzo.kcal).toBe(400);
    expect(totali.cena.kcal).toBe(0);
    expect(totali.spuntino.kcal).toBe(0);
    expect(Object.keys(totali)).toEqual(['colazione', 'pranzo', 'cena', 'spuntino']);
  });
});

describe('creaVoce', () => {
  const yogurt: AlimentoPersonale = {
    id: 'p1',
    origine: 'personale',
    nome: 'Yogurt greco',
    marca: 'Marca A',
    valori: { kcal: 97, carboidrati: 4, proteine: 9, grassi: 5 },
  };

  it('copia nome, marca e valori dell’alimento', () => {
    expect(creaVoce(yogurt, '2026-09-24', 'colazione', 150)).toEqual({
      data: '2026-09-24',
      pasto: 'colazione',
      grammi: 150,
      alimento: {
        id: 'p1',
        nome: 'Yogurt greco',
        marca: 'Marca A',
        valori: { kcal: 97, carboidrati: 4, proteine: 9, grassi: 5 },
      },
    });
  });

  it('non cambia se l’alimento viene modificato dopo', () => {
    const alimento = structuredClone(yogurt);
    const voce = creaVoce(alimento, '2026-09-24', 'colazione', 150);
    alimento.valori.kcal = 500;
    alimento.nome = 'Altro';
    expect(voce.alimento.valori.kcal).toBe(97);
    expect(voce.alimento.nome).toBe('Yogurt greco');
  });

  it('per gli alimenti di base non ha marca', () => {
    const mela: AlimentoBase = {
      id: 'crea-007120',
      origine: 'base',
      nome: 'Mele, fresche, con buccia',
      categoria: 'Frutta',
      valori: { kcal: 44, carboidrati: 10, proteine: 0.2, grassi: 0, fibre: 2 },
    };
    const voce = creaVoce(mela, '2026-09-24', 'spuntino', 180);
    expect('marca' in voce.alimento).toBe(false);
    expect(voce.alimento.valori.fibre).toBe(2);
  });
});
