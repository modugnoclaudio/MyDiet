/**
 * Chiede al browser di non cancellare automaticamente i dati dell'app
 * quando lo spazio scarseggia o l'app non viene usata per un po'.
 * Restituisce `true` se l'archiviazione è persistente.
 */
export async function richiediArchiviazionePersistente(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
