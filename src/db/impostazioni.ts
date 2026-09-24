import type { Impostazioni } from '../lib/tipi';
import { validaObiettivoKcal } from '../lib/validazione';
import { DatiNonValidiError } from './errori';
import { getDb } from './index';

const CHIAVE = 'impostazioni';

export const IMPOSTAZIONI_PREDEFINITE: Impostazioni = { obiettivoKcal: null, ultimoBackup: null };

export async function leggiImpostazioni(): Promise<Impostazioni> {
  const salvate = await (await getDb()).get('impostazioni', CHIAVE);
  return { ...IMPOSTAZIONI_PREDEFINITE, ...salvate };
}

/** Aggiorna solo le impostazioni indicate, lasciando invariate le altre. */
export async function salvaImpostazioni(modifiche: Partial<Impostazioni>): Promise<Impostazioni> {
  if (modifiche.obiettivoKcal !== undefined && modifiche.obiettivoKcal !== null) {
    const errori = validaObiettivoKcal(modifiche.obiettivoKcal);
    if (errori.length > 0) throw new DatiNonValidiError(errori);
  }
  const db = await getDb();
  const tx = db.transaction('impostazioni', 'readwrite');
  const impostazioni = { ...IMPOSTAZIONI_PREDEFINITE, ...(await tx.store.get(CHIAVE)), ...modifiche };
  await tx.store.put(impostazioni, CHIAVE);
  await tx.done;
  return impostazioni;
}
