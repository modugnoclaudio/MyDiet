import { beforeEach, describe, expect, it } from 'vitest';
import { DatiNonValidiError } from './errori';
import { leggiImpostazioni, salvaImpostazioni } from './impostazioni';
import { databaseVuoto } from './test-utils';

beforeEach(databaseVuoto);

describe('impostazioni', () => {
  it('senza impostazioni salvate restituisce quelle predefinite', async () => {
    expect(await leggiImpostazioni()).toEqual({ obiettivoKcal: null });
  });

  it('salva e rilegge l’obiettivo di kcal', async () => {
    await salvaImpostazioni({ obiettivoKcal: 1800 });
    expect(await leggiImpostazioni()).toEqual({ obiettivoKcal: 1800 });
    await salvaImpostazioni({ obiettivoKcal: null });
    expect(await leggiImpostazioni()).toEqual({ obiettivoKcal: null });
  });

  it('rifiuta un obiettivo non valido', async () => {
    await expect(salvaImpostazioni({ obiettivoKcal: 0 })).rejects.toThrow(DatiNonValidiError);
  });
});
