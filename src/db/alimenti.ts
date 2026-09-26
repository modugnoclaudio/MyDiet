import { chiaveAlimento } from '../lib/alimenti';
import type { AlimentoPersonale } from '../lib/tipi';
import { validaAlimentoPersonale } from '../lib/validazione';
import { AlimentoDuplicatoError, DatiNonValidiError } from './errori';
import { getDb, nuovoId, type AlimentoPersonaleSalvato } from './index';

function daSalvato(salvato: AlimentoPersonaleSalvato): AlimentoPersonale {
  const alimento: AlimentoPersonale & { chiave?: string } = { ...salvato };
  delete alimento.chiave;
  return alimento;
}

/** Tutti gli alimenti personali, in ordine alfabetico. */
export async function elencaAlimentiPersonali(): Promise<AlimentoPersonale[]> {
  const db = await getDb();
  const alimenti = (await db.getAll('alimenti')).map(daSalvato);
  return alimenti.sort((a, b) => a.nome.localeCompare(b.nome, 'it') || (a.marca ?? '').localeCompare(b.marca ?? '', 'it'));
}

export async function leggiAlimentoPersonale(id: string): Promise<AlimentoPersonale | undefined> {
  const salvato = await (await getDb()).get('alimenti', id);
  return salvato && daSalvato(salvato);
}

/**
 * Crea un alimento personale (senza `id`) o aggiorna quello esistente (con `id`).
 * Nome e marca vengono ripuliti dagli spazi superflui; una marca vuota viene tolta.
 * Lancia `DatiNonValidiError` o `AlimentoDuplicatoError`.
 */
export async function salvaAlimentoPersonale(
  dati: Omit<AlimentoPersonale, 'id' | 'origine'> & { id?: string },
): Promise<AlimentoPersonale> {
  const errori = validaAlimentoPersonale(dati.nome, dati.valori);
  if (errori.length > 0) throw new DatiNonValidiError(errori);

  const marca = dati.marca?.trim().replace(/\s+/g, ' ');
  const alimento: AlimentoPersonale = {
    id: dati.id ?? nuovoId(),
    origine: 'personale',
    nome: dati.nome.trim().replace(/\s+/g, ' '),
    ...(marca ? { marca } : {}),
    valori: { ...dati.valori },
  };
  const chiave = chiaveAlimento(alimento.nome, alimento.marca);

  const db = await getDb();
  const tx = db.transaction('alimenti', 'readwrite');
  const esistente = await tx.store.index('chiave').get(chiave);
  if (esistente && esistente.id !== alimento.id) {
    tx.abort();
    await tx.done.catch(() => undefined);
    throw new AlimentoDuplicatoError();
  }
  await tx.store.put({ ...alimento, chiave });
  await tx.done;
  return alimento;
}

/**
 * Elimina un alimento personale e le sue unità.
 * Le voci del diario che lo usano restano invariate.
 */
export async function eliminaAlimentoPersonale(id: string): Promise<void> {
  const tx = (await getDb()).transaction(['alimenti', 'unita'], 'readwrite');
  await Promise.all([tx.objectStore('alimenti').delete(id), tx.objectStore('unita').delete(id)]);
  await tx.done;
}
