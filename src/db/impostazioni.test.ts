import { beforeEach, describe, expect, it } from 'vitest';
import { DatiNonValidiError } from './errori';
import type { Impostazioni } from '../lib/tipi';
import { leggiImpostazioni, salvaImpostazioni } from './impostazioni';
import { getDb } from './index';
import { databaseVuoto } from './test-utils';

beforeEach(databaseVuoto);

describe('impostazioni', () => {
  it('senza impostazioni salvate restituisce quelle predefinite', async () => {
    expect(await leggiImpostazioni()).toEqual({ obiettivoKcal: null, ultimoBackup: null, pesoObiettivo: null });
  });

  it('salva e rilegge l’obiettivo di kcal', async () => {
    await salvaImpostazioni({ obiettivoKcal: 1800 });
    expect(await leggiImpostazioni()).toEqual({ obiettivoKcal: 1800, ultimoBackup: null, pesoObiettivo: null });
    await salvaImpostazioni({ obiettivoKcal: null });
    expect(await leggiImpostazioni()).toEqual({ obiettivoKcal: null, ultimoBackup: null, pesoObiettivo: null });
  });

  it('aggiorna solo le impostazioni indicate', async () => {
    await salvaImpostazioni({ obiettivoKcal: 1800 });
    expect(await salvaImpostazioni({ ultimoBackup: '2026-09-24', pesoObiettivo: null })).toEqual({
      obiettivoKcal: 1800,
      ultimoBackup: '2026-09-24',
      pesoObiettivo: null,
    });
    await salvaImpostazioni({ obiettivoKcal: 2000 });
    expect(await leggiImpostazioni()).toEqual({ obiettivoKcal: 2000, ultimoBackup: '2026-09-24', pesoObiettivo: null });
  });

  it('rifiuta un obiettivo non valido', async () => {
    await expect(salvaImpostazioni({ obiettivoKcal: 0 })).rejects.toThrow(DatiNonValidiError);
  });

  it('salva il peso obiettivo e rifiuta valori non validi', async () => {
    await salvaImpostazioni({ obiettivoKcal: 1800 });
    await salvaImpostazioni({ pesoObiettivo: 68.5 });
    expect(await leggiImpostazioni()).toEqual({ obiettivoKcal: 1800, ultimoBackup: null, pesoObiettivo: 68.5 });
    await expect(salvaImpostazioni({ pesoObiettivo: 5 })).rejects.toThrow(DatiNonValidiError);
    await salvaImpostazioni({ pesoObiettivo: null });
    expect((await leggiImpostazioni()).pesoObiettivo).toBeNull();
  });

  it('impostazioni salvate da una versione precedente non hanno il peso obiettivo', async () => {
    const db = await getDb();
    await db.put('impostazioni', { obiettivoKcal: 1800, ultimoBackup: null } as Impostazioni, 'impostazioni');
    expect(await leggiImpostazioni()).toEqual({ obiettivoKcal: 1800, ultimoBackup: null, pesoObiettivo: null });
  });
});
