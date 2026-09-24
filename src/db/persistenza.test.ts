import { afterEach, describe, expect, it, vi } from 'vitest';
import { richiediArchiviazionePersistente } from './persistenza';

function simulaStorage(storage: Partial<StorageManager> | undefined): void {
  vi.stubGlobal('navigator', { storage });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('richiediArchiviazionePersistente', () => {
  it('non richiede di nuovo se è già persistente', async () => {
    const persist = vi.fn();
    simulaStorage({ persisted: vi.fn().mockResolvedValue(true), persist });
    expect(await richiediArchiviazionePersistente()).toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });

  it('richiede la persistenza e riporta la risposta del browser', async () => {
    simulaStorage({ persisted: vi.fn().mockResolvedValue(false), persist: vi.fn().mockResolvedValue(false) });
    expect(await richiediArchiviazionePersistente()).toBe(false);
    simulaStorage({ persisted: vi.fn().mockResolvedValue(false), persist: vi.fn().mockResolvedValue(true) });
    expect(await richiediArchiviazionePersistente()).toBe(true);
  });

  it('restituisce false se il browser non la supporta o dà errore', async () => {
    simulaStorage(undefined);
    expect(await richiediArchiviazionePersistente()).toBe(false);
    simulaStorage({ persisted: vi.fn().mockRejectedValue(new Error('no')), persist: vi.fn() });
    expect(await richiediArchiviazionePersistente()).toBe(false);
  });
});
