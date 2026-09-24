/** Dati rifiutati dalla validazione; `errori` contiene i messaggi per l'utente. */
export class DatiNonValidiError extends Error {
  readonly errori: string[];
  constructor(errori: string[]) {
    super(errori.join(' '));
    this.name = 'DatiNonValidiError';
    this.errori = errori;
  }
}

export class AlimentoDuplicatoError extends Error {
  constructor() {
    super('Esiste già un alimento con lo stesso nome e la stessa marca.');
    this.name = 'AlimentoDuplicatoError';
  }
}
