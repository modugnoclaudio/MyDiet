import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AlimentoPersonale, Impostazioni, PastoPreferito, UnitaAlimento, VoceDiario } from '../lib/tipi';

export const DB_NAME = 'mydiet';
export const DB_VERSION = 4;

/** Alimento personale come salvato: con la chiave nome + marca per l'unicità. */
export type AlimentoPersonaleSalvato = AlimentoPersonale & { chiave: string };

export interface MyDietDB extends DBSchema {
  alimenti: {
    key: string;
    value: AlimentoPersonaleSalvato;
    indexes: { chiave: string };
  };
  diario: {
    key: string;
    value: VoceDiario;
    indexes: { data: string };
  };
  impostazioni: {
    key: string;
    value: Impostazioni;
  };
  /** unità definite dall'utente, per alimento (di base o personale) */
  unita: {
    key: string;
    value: UnitaAlimento;
  };
  pastiPreferiti: {
    key: string;
    value: PastoPreferito;
  };
}


let dbPromise: Promise<IDBPDatabase<MyDietDB>> | undefined;

export function getDb(): Promise<IDBPDatabase<MyDietDB>> {
  dbPromise ??= openDB<MyDietDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Migrazioni dello schema, una per versione.
      if (oldVersion < 2) {
        db.createObjectStore('alimenti', { keyPath: 'id' }).createIndex('chiave', 'chiave', { unique: true });
        db.createObjectStore('diario', { keyPath: 'id' }).createIndex('data', 'data');
        db.createObjectStore('impostazioni');
      }
      if (oldVersion < 3) {
        db.createObjectStore('unita', { keyPath: 'alimentoId' });
      }
      if (oldVersion < 4) {
        db.createObjectStore('pastiPreferiti', { keyPath: 'id' });
      }
    },
    blocking() {
      // Un'altra scheda con una versione più recente dell'app deve aggiornare lo schema.
      void chiudiDb();
    },
  });
  return dbPromise;
}

/** Chiude la connessione; la prossima chiamata a `getDb` la riapre. */
export async function chiudiDb(): Promise<void> {
  const promessa = dbPromise;
  dbPromise = undefined;
  if (promessa) (await promessa).close();
}

/** Identificativo univoco per nuovi record. */
export function nuovoId(): string {
  return crypto.randomUUID();
}
