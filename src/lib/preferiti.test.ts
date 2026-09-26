import { describe, expect, it } from 'vitest';
import { elementiDaVoci, usatiSpesso, validaNomePastoPreferito, vociDaElementi } from './preferiti';
import type { AlimentoBase, Pasto, VoceDiario } from './tipi';

let contatore = 0;
function voce(alimentoId: string, data: string, pasto: Pasto, grammi = 100, nome = alimentoId): VoceDiario {
  return {
    id: `v${contatore++}`,
    data,
    pasto,
    grammi,
    alimento: { id: alimentoId, nome, valori: { kcal: 100, carboidrati: 10, proteine: 5, grassi: 4 } },
  };
}

describe('usatiSpesso', () => {
  const oggi = '2026-09-26';

  it('ordina per numero di inserimenti, contando di più lo stesso pasto', () => {
    const voci = [
      voce('pane', '2026-09-20', 'pranzo'),
      voce('pane', '2026-09-21', 'pranzo'),
      voce('pane', '2026-09-22', 'cena'),
      voce('latte', '2026-09-24', 'colazione'),
      voce('latte', '2026-09-25', 'colazione'),
    ];
    expect(usatiSpesso(voci, 'colazione', oggi).map((u) => [u.alimentoId, u.volte])).toEqual([
      ['latte', 2],
      ['pane', 3],
    ]);
    expect(usatiSpesso(voci, 'pranzo', oggi).map((u) => u.alimentoId)).toEqual(['pane', 'latte']);
  });

  it('propone la quantità dell’ultima volta, preferendo lo stesso pasto', () => {
    const voci = [
      voce('uova', '2026-09-20', 'colazione', 150),
      voce('uova', '2026-09-24', 'colazione', 100),
      voce('uova', '2026-09-25', 'cena', 50),
    ];
    expect(usatiSpesso(voci, 'colazione', oggi)[0]?.ultima.grammi).toBe(100);
    expect(usatiSpesso(voci, 'spuntino', oggi)[0]?.ultima.grammi).toBe(50);
  });

  it('ignora le voci fuori dal periodo e nel futuro', () => {
    const voci = [voce('vecchio', '2026-07-01', 'pranzo'), voce('futuro', '2026-09-27', 'pranzo'), voce('ok', '2026-07-29', 'pranzo')];
    expect(usatiSpesso(voci, 'pranzo', oggi).map((u) => u.alimentoId)).toEqual(['ok']);
    expect(usatiSpesso(voci, 'pranzo', oggi, { giorni: 7 })).toEqual([]);
  });

  it('a parità preferisce il più recente e rispetta il limite', () => {
    const voci = [voce('a', '2026-09-20', 'pranzo'), voce('b', '2026-09-25', 'pranzo'), voce('c', '2026-09-22', 'pranzo')];
    expect(usatiSpesso(voci, 'pranzo', oggi, { limite: 2 }).map((u) => u.alimentoId)).toEqual(['b', 'c']);
  });

  it('senza voci non propone nulla', () => {
    expect(usatiSpesso([], 'pranzo', oggi)).toEqual([]);
  });
});

describe('elementiDaVoci e vociDaElementi', () => {
  const uovo = { nome: 'uovo', grammi: 50 };
  const voci: VoceDiario[] = [
    { ...voce('crea-181100', '2026-09-26', 'colazione', 150, 'Uova'), misura: { quantita: 3, unita: uovo } },
    { ...voce('p1', '2026-09-26', 'colazione', 125, 'Yogurt'), alimento: { id: 'p1', nome: 'Yogurt', marca: 'Marca A', valori: { kcal: 97, carboidrati: 4, proteine: 9, grassi: 5 } } },
  ];

  it('salva alimento, grammi e misura senza data, pasto e id', () => {
    const elementi = elementiDaVoci(voci);
    expect(elementi).toEqual([
      { grammi: 150, misura: { quantita: 3, unita: uovo }, alimento: voci[0]!.alimento },
      { grammi: 125, alimento: voci[1]!.alimento },
    ]);
    expect(elementi[0]).not.toHaveProperty('data');
    elementi[0]!.alimento.valori.kcal = 999;
    expect(voci[0]!.alimento.valori.kcal).toBe(100);
  });

  it('reinserisce con i valori attuali dell’alimento se esiste ancora', () => {
    const attuale: AlimentoBase = {
      id: 'crea-181100',
      origine: 'base',
      nome: 'Uova',
      categoria: 'Uova',
      valori: { kcal: 128, carboidrati: 0, proteine: 12.4, grassi: 8.7 },
    };
    const nuove = vociDaElementi(elementiDaVoci(voci), '2026-09-27', 'spuntino', (id) => (id === attuale.id ? attuale : undefined));
    expect(nuove[0]).toEqual({
      data: '2026-09-27',
      pasto: 'spuntino',
      grammi: 150,
      misura: { quantita: 3, unita: uovo },
      alimento: { id: 'crea-181100', nome: 'Uova', valori: attuale.valori },
    });
    // Alimento non più esistente: valori salvati nel pasto
    expect(nuove[1]).toEqual({ data: '2026-09-27', pasto: 'spuntino', grammi: 125, alimento: voci[1]!.alimento });
  });
});

describe('validaNomePastoPreferito', () => {
  it('accetta un nome nuovo', () => {
    expect(validaNomePastoPreferito('Colazione tipo', ['Pranzo veloce'])).toEqual([]);
  });

  it('rifiuta nomi vuoti, troppo lunghi o già usati', () => {
    expect(validaNomePastoPreferito('  ', [])).toEqual(['Il nome è obbligatorio.']);
    expect(validaNomePastoPreferito('x'.repeat(41), [])).toEqual(['Il nome può avere al massimo 40 caratteri.']);
    expect(validaNomePastoPreferito(' colazione TIPO ', ['Colazione tipo'])).toEqual([
      'Esiste già un pasto preferito chiamato “colazione TIPO”.',
    ]);
  });
});
