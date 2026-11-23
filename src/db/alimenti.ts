import { chiaveAlimento } from '../lib/alimenti';
import { validaRicetta, valoriRicetta } from '../lib/ricette';
import type { AlimentoPersonale, Ricetta } from '../lib/tipi';
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

function ripulisci(testo: string): string {
  return testo.trim().replace(/\s+/g, ' ');
}

/**
 * Salva l'alimento controllando che nome + marca non siano già usati da un
 * altro alimento. `controlla` riceve l'eventuale record con lo stesso id.
 */
async function salva(
  alimento: AlimentoPersonale,
  controlla: (esistente: AlimentoPersonaleSalvato | undefined) => string[] = () => [],
): Promise<AlimentoPersonale> {
  const chiave = chiaveAlimento(alimento.nome, alimento.marca);
  const db = await getDb();
  const tx = db.transaction('alimenti', 'readwrite');
  const errori = controlla(await tx.store.get(alimento.id));
  const omonimo = await tx.store.index('chiave').get(chiave);
  if (errori.length > 0 || (omonimo && omonimo.id !== alimento.id)) {
    tx.abort();
    await tx.done.catch(() => undefined);
    throw errori.length > 0 ? new DatiNonValidiError(errori) : new AlimentoDuplicatoError();
  }
  await tx.store.put({ ...alimento, chiave });
  await tx.done;
  return alimento;
}

/**
 * Crea un alimento personale (senza `id`) o aggiorna quello esistente (con `id`).
 * Nome e marca vengono ripuliti dagli spazi superflui; una marca vuota viene tolta.
 * Lancia `DatiNonValidiError` o `AlimentoDuplicatoError`.
 */
export async function salvaAlimentoPersonale(
  dati: Omit<AlimentoPersonale, 'id' | 'origine' | 'ricetta'> & { id?: string },
): Promise<AlimentoPersonale> {
  const errori = validaAlimentoPersonale(dati.nome, dati.valori);
  if (errori.length > 0) throw new DatiNonValidiError(errori);

  const marca = dati.marca ? ripulisci(dati.marca) : '';
  const alimento: AlimentoPersonale = {
    id: dati.id ?? nuovoId(),
    origine: 'personale',
    nome: ripulisci(dati.nome),
    ...(marca ? { marca } : {}),
    valori: { ...dati.valori },
  };
  // I valori di una ricetta si calcolano dagli ingredienti: non si sovrascrivono a mano.
  return salva(alimento, (esistente) =>
    esistente?.ricetta ? ['Questo alimento è una ricetta: modificalo dalla sezione Le tue ricette.'] : [],
  );
}

/**
 * Crea (senza `id`) o aggiorna (con `id`) una ricetta. I valori per 100 g
 * sono calcolati dagli ingredienti e dal peso del piatto finito.
 * Lancia `DatiNonValidiError` o `AlimentoDuplicatoError`.
 */
export async function salvaRicetta(dati: { id?: string; nome: string; ricetta: Ricetta }): Promise<AlimentoPersonale> {
  const errori = validaRicetta(dati.nome, dati.ricetta);
  if (errori.length > 0) throw new DatiNonValidiError(errori);

  const { pesoFinale, porzioni } = dati.ricetta;
  const ricetta: Ricetta = {
    ingredienti: structuredClone(dati.ricetta.ingredienti),
    ...(pesoFinale === undefined ? {} : { pesoFinale }),
    ...(porzioni === undefined ? {} : { porzioni }),
  };
  return salva({
    id: dati.id ?? nuovoId(),
    origine: 'personale',
    nome: ripulisci(dati.nome),
    valori: valoriRicetta(ricetta),
    ricetta,
  });
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
