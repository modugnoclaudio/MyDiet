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

/** Alimento della tabella statica di base (fonte CREA), non modificabile. */
export interface AlimentoBase {
  id: string;
  origine: 'base';
  nome: string;
  categoria: string;
  /** per 100 g */
  valori: ValoriNutrizionali;
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
  grammi: number;
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
}
