import { beforeEach, describe, expect, it } from 'vitest';
import { creaBackup, leggiBackup, type DatiUtente } from '../lib/backup';
import { creaVoce } from '../lib/diario';
import { elencaAlimentiPersonali, salvaAlimentoPersonale } from './alimenti';
import { leggiTuttiIDati, sostituisciTuttiIDati } from './backup';
import { aggiungiVoce, giorniConVoci, leggiVociDelGiorno } from './diario';
import { leggiImpostazioni, salvaImpostazioni } from './impostazioni';
import { databaseVuoto } from './test-utils';
import { leggiUnitaPersonali, salvaUnitaPersonali } from './unita';
import { elencaPastiPreferiti, salvaPastoPreferito } from './pastiPreferiti';

const valori = { kcal: 97, carboidrati: 4, proteine: 9.5, grassi: 5 };

async function popola(): Promise<void> {
  const yogurt = await salvaAlimentoPersonale({ nome: 'Yogurt greco', marca: 'Marca A', valori });
  await aggiungiVoce(creaVoce(yogurt, '2026-09-24', 'colazione', 150));
  await aggiungiVoce(creaVoce(yogurt, '2026-09-22', 'spuntino', 125, { quantita: 1, unita: { nome: 'vasetto', grammi: 125 } }));
  await salvaUnitaPersonali(yogurt.id, [{ nome: 'vasetto', grammi: 125 }]);
  await salvaUnitaPersonali('crea-181100', [{ nome: 'uovo grande', grammi: 60 }]);
  await salvaPastoPreferito({ nome: 'Colazione tipo', elementi: [{ grammi: 125, alimento: { id: yogurt.id, nome: yogurt.nome, valori } }] });
  await salvaImpostazioni({ obiettivoKcal: 1800 });
}

beforeEach(databaseVuoto);

describe('backup nel database', () => {
  it('legge tutti i dati, con il diario in ordine di data', async () => {
    await popola();
    const dati = await leggiTuttiIDati();
    expect(dati.alimenti).toHaveLength(1);
    expect(dati.alimenti[0]).not.toHaveProperty('chiave');
    expect(dati.diario.map((v) => v.data)).toEqual(['2026-09-22', '2026-09-24']);
    expect(dati.impostazioni).toEqual({ obiettivoKcal: 1800, ultimoBackup: null });
    expect(dati.unita).toHaveLength(2);
    expect(dati.diario[0]?.misura).toEqual({ quantita: 1, unita: { nome: 'vasetto', grammi: 125 } });
  });

  it('esporta e reimporta su un dispositivo vuoto gli stessi dati', async () => {
    await popola();
    const originali = await leggiTuttiIDati();
    const file = creaBackup(originali, new Date('2026-09-24T20:00:00Z'));

    await databaseVuoto();
    const esito = leggiBackup(file);
    if (!esito.ok) throw new Error(esito.errori.join(' '));
    await sostituisciTuttiIDati(esito.backup);

    expect(await leggiTuttiIDati()).toEqual(originali);
    expect(await giorniConVoci()).toEqual(['2026-09-24', '2026-09-22']);
    expect(await leggiUnitaPersonali('crea-181100')).toEqual([{ nome: 'uovo grande', grammi: 60 }]);
    expect((await elencaPastiPreferiti()).map((p) => p.nome)).toEqual(['Colazione tipo']);
  });

  it('dopo l’importazione il controllo dei duplicati continua a funzionare', async () => {
    await popola();
    const dati = await leggiTuttiIDati();
    await databaseVuoto();
    await sostituisciTuttiIDati(dati);
    await expect(salvaAlimentoPersonale({ nome: 'yogurt greco', marca: 'marca a', valori })).rejects.toThrow(
      'Esiste già un alimento',
    );
  });

  it('sostituisce i dati esistenti invece di aggiungerli', async () => {
    await popola();
    const nuovi: DatiUtente = {
      alimenti: [{ id: 'x', origine: 'personale', nome: 'Mela', valori: { kcal: 44, carboidrati: 10, proteine: 0.2, grassi: 0 } }],
      diario: [],
      impostazioni: { obiettivoKcal: null, ultimoBackup: null },
      unita: [],
      pastiPreferiti: [],
    };
    await sostituisciTuttiIDati(nuovi);
    expect((await elencaAlimentiPersonali()).map((a) => a.nome)).toEqual(['Mela']);
    expect(await leggiVociDelGiorno('2026-09-24')).toEqual([]);
    expect(await leggiImpostazioni()).toEqual({ obiettivoKcal: null, ultimoBackup: null });
    expect(await leggiUnitaPersonali('crea-181100')).toEqual([]);
    expect(await elencaPastiPreferiti()).toEqual([]);
  });

  it('se l’importazione fallisce lascia intatti i dati precedenti', async () => {
    await popola();
    const prima = await leggiTuttiIDati();
    const alimento = { id: 'dup', origine: 'personale' as const, nome: 'Mela', valori };
    // Due alimenti con lo stesso id: il secondo inserimento fallisce
    await expect(
      sostituisciTuttiIDati({ alimenti: [alimento, alimento], diario: [], impostazioni: prima.impostazioni, unita: [], pastiPreferiti: [] }),
    ).rejects.toThrow();
    expect(await leggiTuttiIDati()).toEqual(prima);
  });
});
