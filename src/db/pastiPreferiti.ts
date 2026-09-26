import { validaNomePastoPreferito } from '../lib/preferiti';
import type { ElementoPasto, PastoPreferito } from '../lib/tipi';
import { validaGrammi } from '../lib/validazione';
import { DatiNonValidiError } from './errori';
import { getDb, nuovoId } from './index';

/** Pasti preferiti in ordine alfabetico. */
export async function elencaPastiPreferiti(): Promise<PastoPreferito[]> {
  const pasti = await (await getDb()).getAll('pastiPreferiti');
  return pasti.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
}

/**
 * Crea (senza `id`) o aggiorna (con `id`) un pasto preferito.
 * Lancia `DatiNonValidiError` se il nome non è valido o già usato, o se il pasto è vuoto.
 */
export async function salvaPastoPreferito(dati: { id?: string; nome: string; elementi: readonly ElementoPasto[] }): Promise<PastoPreferito> {
  const nome = dati.nome.trim().replace(/\s+/g, ' ');
  const db = await getDb();
  const tx = db.transaction('pastiPreferiti', 'readwrite');
  const altri = (await tx.store.getAll()).filter((p) => p.id !== dati.id).map((p) => p.nome);
  const errori = [
    ...validaNomePastoPreferito(nome, altri),
    ...(dati.elementi.length === 0 ? ['Il pasto non contiene alimenti.'] : []),
    ...[...new Set(dati.elementi.flatMap((e) => validaGrammi(e.grammi)))],
  ];
  if (errori.length > 0) {
    tx.abort();
    await tx.done.catch(() => undefined);
    throw new DatiNonValidiError(errori);
  }
  const pasto: PastoPreferito = { id: dati.id ?? nuovoId(), nome, elementi: structuredClone([...dati.elementi]) };
  await tx.store.put(pasto);
  await tx.done;
  return pasto;
}

export async function eliminaPastoPreferito(id: string): Promise<void> {
  await (await getDb()).delete('pastiPreferiti', id);
}
