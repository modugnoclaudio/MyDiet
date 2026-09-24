import { beforeEach, describe, expect, it } from 'vitest';
import { creaVoce } from '../lib/diario';
import type { AlimentoPersonale } from '../lib/tipi';
import { salvaAlimentoPersonale } from './alimenti';
import { aggiornaVoce, aggiungiVoce, eliminaVoce, giorniConVoci, leggiVociDelGiorno } from './diario';
import { DatiNonValidiError } from './errori';
import { databaseVuoto } from './test-utils';

const mela: AlimentoPersonale = {
  id: 'p1',
  origine: 'personale',
  nome: 'Mela',
  valori: { kcal: 44, carboidrati: 10, proteine: 0.2, grassi: 0 },
};

beforeEach(databaseVuoto);

describe('diario', () => {
  it('aggiunge voci e le legge per giorno', async () => {
    const voce = await aggiungiVoce(creaVoce(mela, '2026-09-24', 'spuntino', 150));
    await aggiungiVoce(creaVoce(mela, '2026-09-23', 'cena', 100));
    expect(await leggiVociDelGiorno('2026-09-24')).toEqual([voce]);
    expect(await leggiVociDelGiorno('2026-09-22')).toEqual([]);
  });

  it('elenca i giorni con voci dal più recente, senza ripetizioni', async () => {
    await aggiungiVoce(creaVoce(mela, '2026-09-23', 'cena', 100));
    await aggiungiVoce(creaVoce(mela, '2026-09-24', 'pranzo', 100));
    await aggiungiVoce(creaVoce(mela, '2026-09-24', 'cena', 100));
    await aggiungiVoce(creaVoce(mela, '2026-08-31', 'cena', 100));
    expect(await giorniConVoci()).toEqual(['2026-09-24', '2026-09-23', '2026-08-31']);
  });

  it('aggiorna ed elimina una voce', async () => {
    const voce = await aggiungiVoce(creaVoce(mela, '2026-09-24', 'spuntino', 150));
    await aggiornaVoce({ ...voce, grammi: 200, pasto: 'colazione' });
    expect(await leggiVociDelGiorno('2026-09-24')).toEqual([{ ...voce, grammi: 200, pasto: 'colazione' }]);
    await eliminaVoce(voce.id);
    expect(await leggiVociDelGiorno('2026-09-24')).toEqual([]);
  });

  it('rifiuta grammi non validi', async () => {
    await expect(aggiungiVoce(creaVoce(mela, '2026-09-24', 'spuntino', 0))).rejects.toThrow(DatiNonValidiError);
    const voce = await aggiungiVoce(creaVoce(mela, '2026-09-24', 'spuntino', 100));
    await expect(aggiornaVoce({ ...voce, grammi: -5 })).rejects.toThrow(DatiNonValidiError);
  });

  it('conserva i valori della voce anche se l’alimento cambia', async () => {
    const yogurt = await salvaAlimentoPersonale({ nome: 'Yogurt', valori: { kcal: 60, carboidrati: 4, proteine: 4, grassi: 3 } });
    await aggiungiVoce(creaVoce(yogurt, '2026-09-24', 'colazione', 125));
    await salvaAlimentoPersonale({ ...yogurt, valori: { ...yogurt.valori, kcal: 90 } });
    const [voce] = await leggiVociDelGiorno('2026-09-24');
    expect(voce?.alimento.valori.kcal).toBe(60);
  });
});
