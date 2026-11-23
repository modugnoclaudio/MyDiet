import { beforeEach, describe, expect, it } from 'vitest';
import { DatiNonValidiError } from './errori';
import { eliminaPesata, elencaPesate, leggiPesata, leggiPesateTraDate, salvaPesata } from './peso';
import { databaseVuoto } from './test-utils';

beforeEach(databaseVuoto);

describe('pesate', () => {
  it('salva e rilegge le pesate in ordine di data', async () => {
    await salvaPesata('2026-11-20', 71.6);
    await salvaPesata('2026-11-02', 72.8);
    expect(await elencaPesate()).toEqual([
      { data: '2026-11-02', kg: 72.8 },
      { data: '2026-11-20', kg: 71.6 },
    ]);
    expect(await leggiPesata('2026-11-20')).toEqual({ data: '2026-11-20', kg: 71.6 });
    expect(await leggiPesata('2026-11-21')).toBeUndefined();
  });

  it('tiene una sola pesata per giorno', async () => {
    await salvaPesata('2026-11-20', 71.6);
    await salvaPesata('2026-11-20', 71.4);
    expect(await elencaPesate()).toEqual([{ data: '2026-11-20', kg: 71.4 }]);
  });

  it('legge le pesate di un intervallo di date, estremi compresi', async () => {
    for (const [data, kg] of [['2026-10-31', 73], ['2026-11-01', 72.9], ['2026-11-30', 71], ['2026-12-01', 70.8]] as const) {
      await salvaPesata(data, kg);
    }
    expect((await leggiPesateTraDate('2026-11-01', '2026-11-30')).map((p) => p.data)).toEqual(['2026-11-01', '2026-11-30']);
  });

  it('elimina una pesata', async () => {
    await salvaPesata('2026-11-20', 71.6);
    await eliminaPesata('2026-11-20');
    expect(await elencaPesate()).toEqual([]);
  });

  it('rifiuta pesi o date non validi', async () => {
    await expect(salvaPesata('2026-11-20', 10)).rejects.toThrow(DatiNonValidiError);
    await expect(salvaPesata('20/11/2026', 70)).rejects.toThrow(DatiNonValidiError);
    expect(await elencaPesate()).toEqual([]);
  });
});
