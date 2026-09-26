import type { Unita } from '../lib/tipi';
import { validaUnita } from '../lib/unita';
import { DatiNonValidiError } from './errori';
import { getDb } from './index';

/** Unità definite dall'utente per un alimento (di base o personale). */
export async function leggiUnitaPersonali(alimentoId: string): Promise<Unita[]> {
  return (await (await getDb()).get('unita', alimentoId))?.unita ?? [];
}

/**
 * Sostituisce le unità dell'utente per un alimento. Nomi ripuliti dagli spazi;
 * lancia `DatiNonValidiError` se un'unità non è valida o è ripetuta.
 */
export async function salvaUnitaPersonali(alimentoId: string, unita: readonly Unita[]): Promise<Unita[]> {
  const pulite: Unita[] = [];
  for (const u of unita) {
    const pulita = { nome: u.nome.trim().replace(/\s+/g, ' '), grammi: u.grammi };
    const errori = validaUnita(pulita, pulite);
    if (errori.length > 0) throw new DatiNonValidiError(errori);
    pulite.push(pulita);
  }
  const db = await getDb();
  if (pulite.length === 0) await db.delete('unita', alimentoId);
  else await db.put('unita', { alimentoId, unita: pulite });
  return pulite;
}
