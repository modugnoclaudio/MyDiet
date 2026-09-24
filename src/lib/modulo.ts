import { leggiNumero } from './formato';
import type { ValoriNutrizionali } from './tipi';
import { validaValoriPer100g } from './validazione';

/** Campi di testo del modulo per i valori nutrizionali per 100 g. */
export interface CampiValori {
  kcal: string;
  carboidrati: string;
  proteine: string;
  grassi: string;
  /** facoltativo: vuoto = non indicato */
  fibre: string;
}

const OBBLIGATORI = {
  kcal: 'Le calorie sono obbligatorie.',
  carboidrati: 'I carboidrati sono obbligatori.',
  proteine: 'Le proteine sono obbligatorie.',
  grassi: 'I grassi sono obbligatori.',
} as const;

export type EsitoLettura = { valori: ValoriNutrizionali; errori: [] } | { valori: undefined; errori: string[] };

/** Legge e valida i valori scritti dall'utente (virgola o punto decimale). */
export function leggiCampiValori(campi: CampiValori): EsitoLettura {
  const errori: string[] = [];
  const numeri = {} as Record<keyof typeof OBBLIGATORI, number>;
  for (const campo of Object.keys(OBBLIGATORI) as (keyof typeof OBBLIGATORI)[]) {
    const numero = leggiNumero(campi[campo]);
    if (numero === undefined) errori.push(OBBLIGATORI[campo]);
    else numeri[campo] = numero;
  }
  const fibre = leggiNumero(campi.fibre);
  if (errori.length > 0) return { valori: undefined, errori };

  const valori: ValoriNutrizionali = { ...numeri, ...(fibre === undefined ? {} : { fibre }) };
  const erroriValori = validaValoriPer100g(valori);
  return erroriValori.length > 0 ? { valori: undefined, errori: erroriValori } : { valori, errori: [] };
}

/** Valori già salvati come testo per precompilare il modulo. */
export function campiDaValori(valori: ValoriNutrizionali): CampiValori {
  const testo = (n: number | undefined) => (n === undefined ? '' : String(n).replace('.', ','));
  return {
    kcal: testo(valori.kcal),
    carboidrati: testo(valori.carboidrati),
    proteine: testo(valori.proteine),
    grassi: testo(valori.grassi),
    fibre: testo(valori.fibre),
  };
}
