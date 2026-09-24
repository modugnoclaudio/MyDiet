import type { Impostazioni } from '../lib/tipi';
import { validaObiettivoKcal } from '../lib/validazione';
import { DatiNonValidiError } from './errori';
import { getDb } from './index';

const CHIAVE = 'impostazioni';

export const IMPOSTAZIONI_PREDEFINITE: Impostazioni = { obiettivoKcal: null };

export async function leggiImpostazioni(): Promise<Impostazioni> {
  const salvate = await (await getDb()).get('impostazioni', CHIAVE);
  return { ...IMPOSTAZIONI_PREDEFINITE, ...salvate };
}

export async function salvaImpostazioni(impostazioni: Impostazioni): Promise<void> {
  if (impostazioni.obiettivoKcal !== null) {
    const errori = validaObiettivoKcal(impostazioni.obiettivoKcal);
    if (errori.length > 0) throw new DatiNonValidiError(errori);
  }
  await (await getDb()).put('impostazioni', { ...impostazioni }, CHIAVE);
}
