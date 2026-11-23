import { chiaveAlimento } from '../lib/alimenti';
import type { DatiUtente } from '../lib/backup';
import { elencaAlimentiPersonali } from './alimenti';
import { IMPOSTAZIONI_PREDEFINITE, leggiImpostazioni } from './impostazioni';
import { getDb } from './index';
import { elencaPastiPreferiti } from './pastiPreferiti';
import { elencaPesate } from './peso';

/** Tutti i dati dell'utente, per l'esportazione. */
export async function leggiTuttiIDati(): Promise<DatiUtente> {
  const [alimenti, diario, impostazioni, unita, pastiPreferiti, peso] = await Promise.all([
    elencaAlimentiPersonali(),
    getDb().then((db) => db.getAll('diario')),
    leggiImpostazioni(),
    getDb().then((db) => db.getAll('unita')),
    elencaPastiPreferiti(),
    elencaPesate(),
  ]);
  diario.sort((a, b) => a.data.localeCompare(b.data));
  return { alimenti, diario, impostazioni, unita, pastiPreferiti, peso };
}

/**
 * Sostituisce tutti i dati con quelli indicati (già validati, es. con
 * `leggiBackup`). Avviene in un'unica transazione: se qualcosa va storto
 * i dati precedenti restano intatti.
 */
export async function sostituisciTuttiIDati(dati: DatiUtente): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['alimenti', 'diario', 'impostazioni', 'unita', 'pastiPreferiti', 'peso'], 'readwrite');
  const alimenti = tx.objectStore('alimenti');
  const diario = tx.objectStore('diario');
  const impostazioni = tx.objectStore('impostazioni');
  const unita = tx.objectStore('unita');
  const pastiPreferiti = tx.objectStore('pastiPreferiti');
  const peso = tx.objectStore('peso');
  try {
    await Promise.all([
      alimenti.clear(),
      diario.clear(),
      impostazioni.clear(),
      unita.clear(),
      pastiPreferiti.clear(),
      peso.clear(),
    ]);
    await Promise.all([
      ...dati.alimenti.map((alimento) =>
        alimenti.add({ ...alimento, chiave: chiaveAlimento(alimento.nome, alimento.marca) }),
      ),
      ...dati.diario.map((voce) => diario.add(voce)),
      ...dati.unita.map((perAlimento) => unita.add(perAlimento)),
      ...dati.pastiPreferiti.map((pasto) => pastiPreferiti.add(pasto)),
      ...dati.peso.map((pesata) => peso.add(pesata)),
      impostazioni.put({ ...IMPOSTAZIONI_PREDEFINITE, ...dati.impostazioni }, 'impostazioni'),
    ]);
    await tx.done;
  } catch (errore) {
    // La transazione viene annullata: attende la fine dell'annullamento prima di segnalare l'errore.
    await tx.done.catch(() => undefined);
    throw errore;
  }
}
