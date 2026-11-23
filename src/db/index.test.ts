import { beforeEach, describe, expect, it } from 'vitest';
import { chiudiDb, DB_NAME, DB_VERSION, getDb } from './index';
import { databaseVuoto } from './test-utils';

beforeEach(databaseVuoto);

describe('schema del database', () => {
  it('crea gli object store e gli indici', async () => {
    const db = await getDb();
    expect(db.name).toBe(DB_NAME);
    expect(db.version).toBe(DB_VERSION);
    expect([...db.objectStoreNames].sort()).toEqual(['alimenti', 'diario', 'impostazioni', 'pastiPreferiti', 'peso', 'unita']);
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
    expect(db.objectStoreNames.contains('pastiPreferiti')).toBe(true);
    expect(await db.get('impostazioni', 'impostazioni')).toEqual({ obiettivoKcal: 1800, ultimoBackup: null });
  });

  it('migra un database della versione 3 mantenendo le unità', async () => {
    await new Promise<void>((risolvi, rifiuta) => {
      const richiesta = indexedDB.open(DB_NAME, 3);
      richiesta.onupgradeneeded = () => {
        const db = richiesta.result;
        db.createObjectStore('alimenti', { keyPath: 'id' }).createIndex('chiave', 'chiave', { unique: true });
        db.createObjectStore('diario', { keyPath: 'id' }).createIndex('data', 'data');
        db.createObjectStore('impostazioni');
        db.createObjectStore('unita', { keyPath: 'alimentoId' }).put({ alimentoId: 'x', unita: [{ nome: 'fetta', grammi: 30 }] });
      };
      richiesta.onsuccess = () => {
        richiesta.result.close();
        risolvi();
      };
      richiesta.onerror = () => rifiuta(richiesta.error);
    });
    const db = await getDb();
    expect(db.objectStoreNames.contains('pastiPreferiti')).toBe(true);
    expect(await db.get('unita', 'x')).toEqual({ alimentoId: 'x', unita: [{ nome: 'fetta', grammi: 30 }] });
  });

  it('migra un database della versione 4 mantenendo diario e pasti preferiti', async () => {
    const voce = { id: 'v1', data: '2026-11-20', pasto: 'pranzo', grammi: 80, alimento: { id: 'a', nome: 'Pasta', valori: {} } };
    await new Promise<void>((risolvi, rifiuta) => {
      const richiesta = indexedDB.open(DB_NAME, 4);
      richiesta.onupgradeneeded = () => {
        const db = richiesta.result;
        db.createObjectStore('alimenti', { keyPath: 'id' }).createIndex('chiave', 'chiave', { unique: true });
        const diario = db.createObjectStore('diario', { keyPath: 'id' });
        diario.createIndex('data', 'data');
        diario.put(voce);
        db.createObjectStore('impostazioni').put({ obiettivoKcal: 1800, ultimoBackup: null }, 'impostazioni');
        db.createObjectStore('unita', { keyPath: 'alimentoId' });
        db.createObjectStore('pastiPreferiti', { keyPath: 'id' }).put({ id: 'pp', nome: 'Colazione', elementi: [] });
      };
      richiesta.onsuccess = () => {
        richiesta.result.close();
        risolvi();
      };
      richiesta.onerror = () => rifiuta(richiesta.error);
    });
    const db = await getDb();
    expect(db.version).toBe(5);
    expect(db.objectStoreNames.contains('peso')).toBe(true);
    expect(await db.get('diario', 'v1')).toEqual(voce);
    expect(await db.get('pastiPreferiti', 'pp')).toEqual({ id: 'pp', nome: 'Colazione', elementi: [] });
    expect(await db.getAll('peso')).toEqual([]);
  });

  it('riapre la connessione dopo chiudiDb', async () => {
    const prima = await getDb();
    await chiudiDb();
    const dopo = await getDb();
    expect(dopo).not.toBe(prima);
    await dopo.put('impostazioni', { obiettivoKcal: 2000, ultimoBackup: null, pesoObiettivo: null }, 'impostazioni');
    expect(await dopo.get('impostazioni', 'impostazioni')).toEqual({ obiettivoKcal: 2000, ultimoBackup: null, pesoObiettivo: null });
  });
});
