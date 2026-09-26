/**
 * Valori nutrizionali. Negli alimenti sono riferiti a 100 g;
 * nei risultati dei calcoli sono riferiti alla quantità indicata.
 */
export interface ValoriNutrizionali {
  kcal: number;
  /** grammi */
  carboidrati: number;
  /** grammi */
  proteine: number;
  /** grammi */
  grassi: number;
  /** grammi; `undefined` = dato non indicato (diverso da 0) */
  fibre?: number;
}

export const PASTI = ['colazione', 'pranzo', 'cena', 'spuntino'] as const;
export type Pasto = (typeof PASTI)[number];

export const ETICHETTE_PASTI: Readonly<Record<Pasto, string>> = {
  colazione: 'Colazione',
  pranzo: 'Pranzo',
  cena: 'Cena',
  spuntino: 'Spuntino',
};

/** Unità di misura alternativa ai grammi, es. { nome: 'uovo', grammi: 50 }. */
export interface Unita {
  nome: string;
  /** grammi di una unità */
  grammi: number;
}

/** Unità definite dall'utente per un alimento (di base o personale). */
export interface UnitaAlimento {
  alimentoId: string;
  unita: Unita[];
}

/** Alimento della tabella statica di base (fonte CREA), non modificabile. */
export interface AlimentoBase {
  id: string;
  origine: 'base';
  nome: string;
  categoria: string;
  /** per 100 g */
  valori: ValoriNutrizionali;
  /** porzione standard CREA in grammi, se indicata */
  porzione?: number;
}

/** Alimento creato dall'utente e salvato sul dispositivo. */
export interface AlimentoPersonale {
  id: string;
  origine: 'personale';
  nome: string;
  marca?: string;
  /** per 100 g */
  valori: ValoriNutrizionali;
}

export type Alimento = AlimentoBase | AlimentoPersonale;

/**
 * Voce del diario. Contiene una copia dei dati dell'alimento al momento
 * dell'inserimento, così modificare l'alimento non altera lo storico.
 */
export interface VoceDiario {
  id: string;
  /** data locale in formato `YYYY-MM-DD` */
  data: string;
  pasto: Pasto;
  /** quantità effettiva in grammi (usata per tutti i calcoli) */
  grammi: number;
  /** se inserita in unità (es. 3 uova), la quantità e l'unità usate */
  misura?: { quantita: number; unita: Unita };
  alimento: {
    id: string;
    nome: string;
    marca?: string;
    /** per 100 g */
    valori: ValoriNutrizionali;
  };
}

export interface Impostazioni {
  /** obiettivo giornaliero di kcal; `null` = non impostato */
  obiettivoKcal: number | null;
  /** data (`YYYY-MM-DD`) dell'ultima esportazione dei dati; `null` = mai */
  ultimoBackup: string | null;
}
