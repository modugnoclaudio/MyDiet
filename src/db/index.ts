import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export const DB_NAME = 'mydiet';
export const DB_VERSION = 1;

// Gli object store verranno aggiunti man mano che si implementano le funzionalità.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MyDietDB extends DBSchema {}

let dbPromise: Promise<IDBPDatabase<MyDietDB>> | undefined;

export function getDb(): Promise<IDBPDatabase<MyDietDB>> {
  dbPromise ??= openDB<MyDietDB>(DB_NAME, DB_VERSION, {
    upgrade() {
      // Migrazioni dello schema.
    },
  });
  return dbPromise;
}
