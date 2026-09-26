import { beforeEach, describe, expect, it } from 'vitest';
import { DatiNonValidiError } from './errori';
import { getDb } from './index';
import { leggiUnitaPersonali, salvaUnitaPersonali } from './unita';
import { databaseVuoto } from './test-utils';

beforeEach(databaseVuoto);

describe('unità dell’utente', () => {
  it('senza unità salvate restituisce un elenco vuoto', async () => {
    expect(await leggiUnitaPersonali('crea-181100')).toEqual([]);
  });

  it('salva e rilegge le unità di un alimento, ripulendo i nomi', async () => {
    expect(await salvaUnitaPersonali('p1', [{ nome: '  vasetto ', grammi: 125 }, { nome: 'mezzo  vasetto', grammi: 62.5 }])).toEqual([
      { nome: 'vasetto', grammi: 125 },
      { nome: 'mezzo vasetto', grammi: 62.5 },
    ]);
    expect(await leggiUnitaPersonali('p1')).toEqual([
      { nome: 'vasetto', grammi: 125 },
      { nome: 'mezzo vasetto', grammi: 62.5 },
    ]);
    expect(await leggiUnitaPersonali('p2')).toEqual([]);
  });

  it('con un elenco vuoto elimina le unità', async () => {
    await salvaUnitaPersonali('crea-007120', [{ nome: 'mela', grammi: 180 }]);
    await salvaUnitaPersonali('crea-007120', []);
    expect(await leggiUnitaPersonali('crea-007120')).toEqual([]);
    expect(await (await getDb()).count('unita')).toBe(0);
  });

  it('rifiuta unità non valide o ripetute senza salvare nulla', async () => {
    await expect(salvaUnitaPersonali('p1', [{ nome: 'fetta', grammi: 0 }])).rejects.toThrow(DatiNonValidiError);
    await expect(
      salvaUnitaPersonali('p1', [
        { nome: 'fetta', grammi: 30 },
        { nome: 'Fetta', grammi: 40 },
      ]),
    ).rejects.toThrow('Esiste già l’unità “Fetta”.');
    expect(await leggiUnitaPersonali('p1')).toEqual([]);
  });
});
