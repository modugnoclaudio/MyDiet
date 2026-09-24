import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { chiudiDb } from './index';

/** Prima di ogni test: chiude la connessione e parte da un IndexedDB vuoto. */
export async function databaseVuoto(): Promise<void> {
  await chiudiDb();
  globalThis.indexedDB = new IDBFactory();
}
