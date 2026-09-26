import { beforeEach, describe, expect, it } from 'vitest';
import { chiudiDb, DB_NAME, DB_VERSION, getDb } from './index';
import { databaseVuoto } from './test-utils';

beforeEach(databaseVuoto);

describe('schema del database', () => {
  it('crea gli object store e gli indici', async () => {
    const db = await getDb();
    expect(db.name).toBe(DB_NAME);
    expect(db.version).toBe(DB_VERSION);
    expect([...db.objectStoreNames].sort()).toEqual(['alimenti', 'diario', 'impostazioni', 'unita']);
    const tx = db.transaction(['alimenti', 'diario']);
    expect(tx.objectStore('alimenti').index('chiave').unique).toBe(true);
    expect(tx.objectStore('diario').index('data').unique).toBe(false);
  });

  it('migra un database creato dalla versione 1 (senza object store)', async () => {
    await new Promise<void>((risolvi, rifiuta) => {
      const richiesta = indexedDB.open(DB_NAME, 1);
      richiesta.onsuccess = () => {
        richiesta.result.close();
        risolvi();
      };
      richiesta.onerror = () => rifiuta(richiesta.error);
    });
    const db = await getDb();
    expect(db.version).toBe(DB_VERSION);
    expect(db.objectStoreNames.contains('diario')).toBe(true);
  });

  it('migra un database della versione 2 mantenendo i dati', async () => {
    await new Promise<void>((risolvi, rifiuta) => {
      const richiesta = indexedDB.open(DB_NAME, 2);
      richiesta.onupgradeneeded = () => {
        const db = richiesta.result;
        db.createObjectStore('alimenti', { keyPath: 'id' }).createIndex('chiave', 'chiave', { unique: true });
        db.createObjectStore('diario', { keyPath: 'id' }).createIndex('data', 'data');
        db.createObjectStore('impostazioni').put({ obiettivoKcal: 1800, ultimoBackup: null }, 'impostazioni');
      };
      richiesta.onsuccess = () => {
        richiesta.result.close();
        risolvi();
      };
      richiesta.onerror = () => rifiuta(richiesta.error);
    });
    const db = await getDb();
    expect(db.version).toBe(DB_VERSION);
    expect(db.objectStoreNames.contains('unita')).toBe(true);
    expect(await db.get('impostazioni', 'impostazioni')).toEqual({ obiettivoKcal: 1800, ultimoBackup: null });
  });

  it('riapre la connessione dopo chiudiDb', async () => {
    const prima = await getDb();
    await chiudiDb();
    const dopo = await getDb();
    expect(dopo).not.toBe(prima);
    await dopo.put('impostazioni', { obiettivoKcal: 2000, ultimoBackup: null }, 'impostazioni');
    expect(await dopo.get('impostazioni', 'impostazioni')).toEqual({ obiettivoKcal: 2000, ultimoBackup: null });
  });
});
