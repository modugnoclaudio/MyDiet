import type { VoceDiario } from '../lib/tipi';
import { validaGrammi } from '../lib/validazione';
import { DatiNonValidiError } from './errori';
import { getDb, nuovoId } from './index';

/** Voci del diario di una data (`YYYY-MM-DD`). */
export async function leggiVociDelGiorno(data: string): Promise<VoceDiario[]> {
  return (await getDb()).getAllFromIndex('diario', 'data', data);
}

/** Voci del diario dalla data `da` alla data `a` comprese (`YYYY-MM-DD`). */
export async function leggiVociTraDate(da: string, a: string): Promise<VoceDiario[]> {
  return (await getDb()).getAllFromIndex('diario', 'data', IDBKeyRange.bound(da, a));
}

/** Date che hanno almeno una voce, dalla più recente. */
export async function giorniConVoci(): Promise<string[]> {
  const giorni: string[] = [];
  const db = await getDb();
  let cursore = await db.transaction('diario').store.index('data').openKeyCursor(null, 'prevunique');
  while (cursore) {
    giorni.push(cursore.key);
    cursore = await cursore.continue();
  }
  return giorni;
}

/** Aggiunge una voce al diario (l'`id` viene generato). */
export async function aggiungiVoce(dati: Omit<VoceDiario, 'id'>): Promise<VoceDiario> {
  const errori = validaGrammi(dati.grammi);
  if (errori.length > 0) throw new DatiNonValidiError(errori);
  const voce: VoceDiario = { ...dati, id: nuovoId() };
  await (await getDb()).add('diario', voce);
  return voce;
}

/** Aggiunge più voci in un'unica operazione: o tutte o nessuna. */
export async function aggiungiVoci(dati: readonly Omit<VoceDiario, 'id'>[]): Promise<VoceDiario[]> {
  for (const d of dati) {
    const errori = validaGrammi(d.grammi);
    if (errori.length > 0) throw new DatiNonValidiError(errori);
  }
  const voci = dati.map((d) => ({ ...d, id: nuovoId() }));
  const tx = (await getDb()).transaction('diario', 'readwrite');
  await Promise.all(voci.map((voce) => tx.store.add(voce)));
  await tx.done;
  return voci;
}

/** Aggiorna una voce esistente (es. grammi o pasto). */
export async function aggiornaVoce(voce: VoceDiario): Promise<void> {
  const errori = validaGrammi(voce.grammi);
  if (errori.length > 0) throw new DatiNonValidiError(errori);
  await (await getDb()).put('diario', voce);
}

export async function eliminaVoce(id: string): Promise<void> {
  await (await getDb()).delete('diario', id);
}
