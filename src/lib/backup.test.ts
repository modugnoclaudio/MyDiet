import { describe, expect, it } from 'vitest';
import { backupDaFare, creaBackup, leggiBackup, nomeFileBackup, riepilogoDati, type DatiUtente } from './backup';
import { valoriRicetta } from './ricette';
import type { Ricetta } from './tipi';

const ricetta: Ricetta = {
  ingredienti: [
    { grammi: 100, alimento: { id: 'crea-000800', nome: 'Pasta di semola', valori: { kcal: 341, carboidrati: 72.7, proteine: 13.5, grassi: 1.2, fibre: 1.7 } } },
    { grammi: 2, misura: { quantita: 2, unita: { nome: 'cucchiaino', grammi: 1 } }, alimento: { id: 'a2', nome: 'Pane di casa', valori: { kcal: 270, carboidrati: 55, proteine: 9, grassi: 1, fibre: 3 } } },
  ],
  pesoFinale: 250,
  porzioni: 2,
};

const dati: DatiUtente = {
  alimenti: [
    {
      id: 'a1',
      origine: 'personale',
      nome: 'Yogurt greco',
      marca: 'Marca A',
      valori: { kcal: 97, carboidrati: 4, proteine: 9.5, grassi: 5 },
    },
    { id: 'a2', origine: 'personale', nome: 'Pane di casa', valori: { kcal: 270, carboidrati: 55, proteine: 9, grassi: 1, fibre: 3 } },
    { id: 'a4', origine: 'personale', nome: 'Pasta al forno', valori: valoriRicetta(ricetta), ricetta },
  ],
  diario: [
    {
      id: 'v1',
      data: '2026-09-24',
      pasto: 'colazione',
      grammi: 150,
      misura: { quantita: 1.2, unita: { nome: 'vasetto', grammi: 125 } },
      alimento: { id: 'a1', nome: 'Yogurt greco', marca: 'Marca A', valori: { kcal: 97, carboidrati: 4, proteine: 9.5, grassi: 5 } },
    },
    {
      id: 'v2',
      data: '2026-09-23',
      pasto: 'cena',
      grammi: 80,
      alimento: { id: 'crea-000800', nome: 'Pasta di semola', valori: { kcal: 341, carboidrati: 72.7, proteine: 13.5, grassi: 1.2, fibre: 2.7 } },
    },
    {
      id: 'v3',
      data: '2026-09-23',
      pasto: 'pranzo',
      grammi: 50,
      alimento: { id: 'a2', nome: 'Pane di casa', valori: { kcal: 270, carboidrati: 55, proteine: 9, grassi: 1, fibre: 3 } },
    },
  ],
  impostazioni: { obiettivoKcal: 1800, ultimoBackup: '2026-09-01' },
  unita: [
    { alimentoId: 'a1', unita: [{ nome: 'vasetto', grammi: 125 }] },
    { alimentoId: 'crea-181100', unita: [{ nome: 'uovo grande', grammi: 60 }] },
  ],
  pastiPreferiti: [
    {
      id: 'pp1',
      nome: 'Colazione tipo',
      elementi: [
        {
          grammi: 150,
          misura: { quantita: 1.2, unita: { nome: 'vasetto', grammi: 125 } },
          alimento: { id: 'a1', nome: 'Yogurt greco', marca: 'Marca A', valori: { kcal: 97, carboidrati: 4, proteine: 9.5, grassi: 5 } },
        },
      ],
    },
  ],
};

const esportato = new Date('2026-09-24T18:30:00Z');

function modifica(trasforma: (backup: Record<string, unknown>) => void): string {
  const backup = JSON.parse(creaBackup(dati, esportato)) as Record<string, unknown>;
  trasforma(backup);
  return JSON.stringify(backup);
}

describe('creaBackup e leggiBackup', () => {
  it('rileggono esattamente i dati esportati', () => {
    expect(leggiBackup(creaBackup(dati, esportato))).toEqual({
      ok: true,
      backup: { app: 'MyDiet', formato: 4, esportato: '2026-09-24T18:30:00.000Z', ...dati },
    });
  });

  it('funzionano anche senza dati', () => {
    const vuoto: DatiUtente = {
      alimenti: [],
      diario: [],
      impostazioni: { obiettivoKcal: null, ultimoBackup: null },
      unita: [],
      pastiPreferiti: [],
    };
    const esito = leggiBackup(creaBackup(vuoto, esportato));
    expect(esito.ok && esito.backup.alimenti).toEqual([]);
  });

  it('ignorano i campi sconosciuti', () => {
    const esito = leggiBackup(
      modifica((b) => {
        (b.alimenti as Record<string, unknown>[])[0]!.chiave = 'x';
        b.altro = 1;
      }),
    );
    expect(esito.ok && esito.backup.alimenti[0]).toEqual(dati.alimenti[0]);
    expect(esito.ok && 'altro' in esito.backup).toBe(false);
  });

  it('accettano impostazioni senza ultimo backup (campo mancante)', () => {
    const esito = leggiBackup(modifica((b) => (b.impostazioni = { obiettivoKcal: 2000 })));
    expect(esito.ok && esito.backup.impostazioni).toEqual({ obiettivoKcal: 2000, ultimoBackup: null });
  });
});

describe('backup nel formato 1 (prima delle unità)', () => {
  it('si importa ancora, senza unità', () => {
    const vecchio = modifica((b) => {
      b.formato = 1;
      delete b.unita;
      delete b.pastiPreferiti;
      for (const voce of b.diario as Record<string, unknown>[]) delete voce.misura;
    });
    const esito = leggiBackup(vecchio);
    expect(esito.ok && esito.backup.unita).toEqual([]);
    expect(esito.ok && esito.backup.formato).toBe(4);
    expect(esito.ok && esito.backup.pastiPreferiti).toEqual([]);
    expect(esito.ok && esito.backup.diario[0]).not.toHaveProperty('misura');
  });
});

describe('backup nel formato 2 (prima dei pasti preferiti)', () => {
  it('si importa ancora, con le unità e senza pasti preferiti', () => {
    const esito = leggiBackup(
      modifica((b) => {
        b.formato = 2;
        delete b.pastiPreferiti;
      }),
    );
    expect(esito.ok && esito.backup.unita).toEqual(dati.unita);
    expect(esito.ok && esito.backup.pastiPreferiti).toEqual([]);
  });
});

describe('backup nel formato 3 (prima delle ricette)', () => {
  it('si importa ancora', () => {
    const esito = leggiBackup(
      modifica((b) => {
        b.formato = 3;
        (b.alimenti as unknown[]).pop();
      }),
    );
    expect(esito.ok && esito.backup.alimenti).toEqual(dati.alimenti.slice(0, 2));
    expect(esito.ok && esito.backup.pastiPreferiti).toEqual(dati.pastiPreferiti);
  });
});

describe('ricette nel backup', () => {
  function ricettaNelFile(b: Record<string, unknown>): Record<string, unknown> {
    return (b.alimenti as Record<string, unknown>[])[2]!;
  }

  it('ricalcolano i valori dagli ingredienti, ignorando quelli del file', () => {
    const esito = leggiBackup(modifica((b) => ((ricettaNelFile(b).valori as Record<string, unknown>).kcal = 1)));
    expect(esito.ok && esito.backup.alimenti[2]!.valori).toEqual(valoriRicetta(ricetta));
  });

  it('rifiutano ingredienti, peso finale o porzioni non validi', () => {
    for (const trasforma of [
      (r: Record<string, unknown>) => (r.ricetta = { ingredienti: [] }),
      (r: Record<string, unknown>) => (r.ricetta = 'pasta'),
      (r: Record<string, unknown>) => ((r.ricetta as Record<string, unknown>).pesoFinale = '250'),
      (r: Record<string, unknown>) => ((r.ricetta as Record<string, unknown>).pesoFinale = 10),
      (r: Record<string, unknown>) => ((r.ricetta as Record<string, unknown>).porzioni = 2.5),
      (r: Record<string, unknown>) => (((r.ricetta as Record<string, unknown>).ingredienti as Record<string, unknown>[])[0]!.grammi = -1),
    ]) {
      expect(leggiBackup(modifica((b) => trasforma(ricettaNelFile(b))))).toEqual({
        ok: false,
        errori: ['L’alimento n. 3 non è valido.'],
      });
    }
  });
});

describe('leggiBackup rifiuta', () => {
  it('file che non sono JSON', () => {
    expect(leggiBackup('ciao')).toEqual({ ok: false, errori: ['Il file non è un backup di MyDiet: non è un file JSON valido.'] });
  });

  it('JSON che non sono backup di MyDiet', () => {
    expect(leggiBackup('{"a":1}')).toEqual({ ok: false, errori: ['Il file non è un backup di MyDiet.'] });
    expect(leggiBackup('[]')).toEqual({ ok: false, errori: ['Il file non è un backup di MyDiet.'] });
  });

  it('formati di versioni diverse', () => {
    expect(leggiBackup(modifica((b) => (b.formato = 5))).ok).toBe(false);
  });

  it('pasti preferiti non validi', () => {
    const conPasti = (pasti: unknown) => leggiBackup(modifica((b) => (b.pastiPreferiti = pasti)));
    expect(conPasti([{ id: 'x', nome: 'Vuoto', elementi: [] }])).toEqual({
      ok: false,
      errori: ['Il pasto preferito n. 1 non è valido.'],
    });
    expect(conPasti([{ id: 'x', nome: '', elementi: dati.pastiPreferiti[0]!.elementi }]).ok).toBe(false);
    expect(conPasti([{ id: 'x', nome: 'A', elementi: [{ grammi: 0, alimento: dati.pastiPreferiti[0]!.elementi[0]!.alimento }] }]).ok).toBe(false);
    expect(leggiBackup(modifica((b) => delete b.pastiPreferiti))).toEqual({ ok: false, errori: ['Il backup è incompleto o danneggiato.'] });
  });

  it('unità non valide o ripetute', () => {
    const conUnita = (unita: unknown) => leggiBackup(modifica((b) => (b.unita = unita)));
    expect(conUnita([{ alimentoId: 'a1', unita: [{ nome: '', grammi: 10 }] }])).toEqual({
      ok: false,
      errori: ['Le unità n. 1 non sono valide.'],
    });
    expect(conUnita([{ alimentoId: 'a1', unita: [] }]).ok).toBe(false);
    expect(conUnita([{ alimentoId: 'a1', unita: [{ nome: 'x', grammi: 1 }, { nome: 'X', grammi: 2 }] }]).ok).toBe(false);
    expect(
      conUnita([
        { alimentoId: 'a1', unita: [{ nome: 'x', grammi: 1 }] },
        { alimentoId: 'a1', unita: [{ nome: 'y', grammi: 1 }] },
      ]),
    ).toEqual({ ok: false, errori: ['Il backup contiene dati ripetuti.'] });
    expect(leggiBackup(modifica((b) => delete b.unita))).toEqual({ ok: false, errori: ['Il backup è incompleto o danneggiato.'] });
  });

  it('voci con una quantità in unità non coerente con i grammi', () => {
    const esito = leggiBackup(
      modifica((b) => {
        ((b.diario as Record<string, unknown>[])[0]!.misura as Record<string, unknown>).quantita = 3;
      }),
    );
    expect(esito).toEqual({ ok: false, errori: ['La voce del diario n. 1 non è valida.'] });
  });

  it('backup incompleti', () => {
    expect(leggiBackup(modifica((b) => delete b.diario))).toEqual({ ok: false, errori: ['Il backup è incompleto o danneggiato.'] });
  });

  it('alimenti e voci non validi, indicando quali', () => {
    const esito = leggiBackup(
      modifica((b) => {
        const alimenti = b.alimenti as Record<string, unknown>[];
        const diario = b.diario as Record<string, unknown>[];
        (alimenti[1]!.valori as Record<string, unknown>).kcal = -5;
        diario[0]!.pasto = 'merenda';
        diario[2]!.data = '2026-02-30';
      }),
    );
    expect(esito).toEqual({
      ok: false,
      errori: [
        'L’alimento n. 2 non è valido.',
        'La voce del diario n. 1 non è valida.',
        'La voce del diario n. 3 non è valida.',
      ],
    });
  });

  it('grammi, nomi e valori mancanti o sbagliati', () => {
    for (const trasforma of [
      (b: Record<string, unknown>) => ((b.diario as Record<string, unknown>[])[0]!.grammi = 0),
      (b: Record<string, unknown>) => ((b.diario as Record<string, unknown>[])[0]!.grammi = '150'),
      (b: Record<string, unknown>) => ((b.alimenti as Record<string, unknown>[])[0]!.nome = ' '),
      (b: Record<string, unknown>) => ((b.alimenti as Record<string, unknown>[])[0]!.origine = 'base'),
      (b: Record<string, unknown>) => ((b.alimenti as Record<string, unknown>[])[0]!.marca = 3),
      (b: Record<string, unknown>) => (((b.alimenti as Record<string, unknown>[])[1]!.valori as Record<string, unknown>).fibre = null),
      (b: Record<string, unknown>) => delete ((b.diario as Record<string, unknown>[])[1]!.alimento as Record<string, unknown>).valori,
    ]) {
      expect(leggiBackup(modifica(trasforma)).ok).toBe(false);
    }
  });

  it('impostazioni non valide', () => {
    expect(leggiBackup(modifica((b) => (b.impostazioni = { obiettivoKcal: 0 })))).toEqual({
      ok: false,
      errori: ['Le impostazioni non sono valide.'],
    });
  });

  it('dati ripetuti e alimenti con lo stesso nome e marca', () => {
    expect(leggiBackup(modifica((b) => (b.diario as unknown[]).push((b.diario as unknown[])[0])))).toEqual({
      ok: false,
      errori: ['Il backup contiene dati ripetuti.'],
    });
    const esito = leggiBackup(
      modifica((b) => (b.alimenti as unknown[]).push({ ...dati.alimenti[0], id: 'a3', nome: 'yogurt  GRECO' })),
    );
    expect(esito).toEqual({ ok: false, errori: ['Il backup contiene due alimenti con lo stesso nome e la stessa marca.'] });
  });
});

describe('nomeFileBackup', () => {
  it('include la data', () => {
    expect(nomeFileBackup('2026-09-24')).toBe('mydiet-backup-2026-09-24.json');
  });
});

describe('riepilogoDati', () => {
  it('conta alimenti, voci e giorni distinti', () => {
    expect(riepilogoDati(dati)).toEqual({ alimenti: 3, voci: 3, giorni: 2 });
  });
});

describe('backupDaFare', () => {
  it('ricorda il backup se non è mai stato fatto e ci sono dati', () => {
    expect(backupDaFare(null, '2026-09-24', true)).toBe(true);
    expect(backupDaFare(null, '2026-09-24', false)).toBe(false);
  });

  it('ricorda il backup dopo 30 giorni', () => {
    expect(backupDaFare('2026-08-26', '2026-09-24', true)).toBe(false);
    expect(backupDaFare('2026-08-25', '2026-09-24', true)).toBe(true);
  });
});
