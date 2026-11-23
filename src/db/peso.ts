import { validaPeso } from '../lib/peso';
import type { Pesata } from '../lib/tipi';
import { DatiNonValidiError } from './errori';
import { getDb } from './index';

/** Tutte le pesate, dalla più vecchia. */
export async function elencaPesate(): Promise<Pesata[]> {
  return (await getDb()).getAll('peso');
}

/** Pesate dalla data `da` alla data `a` comprese (`YYYY-MM-DD`), dalla più vecchia. */
export async function leggiPesateTraDate(da: string, a: string): Promise<Pesata[]> {
  return (await getDb()).getAll('peso', IDBKeyRange.bound(da, a));
}

export async function leggiPesata(data: string): Promise<Pesata | undefined> {
  return (await getDb()).get('peso', data);
}

/** Registra il peso del giorno, sostituendo l'eventuale pesata già presente. Lancia `DatiNonValidiError`. */
export async function salvaPesata(data: string, kg: number): Promise<Pesata> {
  const errori = validaPeso(kg);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) errori.push('La data non è valida.');
  if (errori.length > 0) throw new DatiNonValidiError(errori);
  const pesata: Pesata = { data, kg };
  await (await getDb()).put('peso', pesata);
  return pesata;
}

export async function eliminaPesata(data: string): Promise<void> {
  await (await getDb()).delete('peso', data);
}
