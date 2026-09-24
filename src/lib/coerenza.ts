import type { ValoriNutrizionali } from './tipi';

/** kcal per grammo di ciascun nutriente. */
export interface FattoriEnergetici {
  carboidrati: number;
  proteine: number;
  grassi: number;
  fibre: number;
}

/** Fattori delle etichette UE (Reg. UE 1169/2011, allegato XIV). */
export const FATTORI_ETICHETTA: FattoriEnergetici = { carboidrati: 4, proteine: 4, grassi: 9, fibre: 2 };

/**
 * Fattori usati dalle tabelle CREA (metodo di Southgate): i carboidrati
 * disponibili sono espressi come monosaccaridi, quindi valgono 3,75 kcal/g.
 */
export const FATTORI_CREA: FattoriEnergetici = { carboidrati: 3.75, proteine: 4, grassi: 9, fibre: 2 };

/** Stima le kcal a partire dai nutrienti. Le fibre non indicate contano 0. */
export function stimaKcal(valori: ValoriNutrizionali, fattori: FattoriEnergetici): number {
  return (
    valori.carboidrati * fattori.carboidrati +
    valori.proteine * fattori.proteine +
    valori.grassi * fattori.grassi +
    (valori.fibre ?? 0) * fattori.fibre
  );
}

export interface EsitoCoerenza {
  coerente: boolean;
  kcalStimate: number;
  /** kcal dichiarate − kcal stimate */
  scarto: number;
}

export interface TolleranzaKcal {
  /** scarto relativo ammesso rispetto alle kcal stimate (es. 0.1 = 10%) */
  relativa: number;
  /** scarto assoluto ammesso in kcal, utile per alimenti poco calorici */
  assoluta: number;
}

export const TOLLERANZA_PREDEFINITA: TolleranzaKcal = { relativa: 0.1, assoluta: 5 };

/**
 * Verifica che le kcal dichiarate siano coerenti con carboidrati, proteine,
 * grassi e fibre. Lo scarto è accettato se rientra nella tolleranza relativa
 * oppure in quella assoluta. Serve a scovare errori di trascrizione.
 */
export function verificaKcal(
  valori: ValoriNutrizionali,
  fattori: FattoriEnergetici = FATTORI_ETICHETTA,
  tolleranza: TolleranzaKcal = TOLLERANZA_PREDEFINITA,
): EsitoCoerenza {
  const kcalStimate = stimaKcal(valori, fattori);
  const scarto = valori.kcal - kcalStimate;
  const ammesso = Math.max(tolleranza.assoluta, kcalStimate * tolleranza.relativa);
  return { coerente: Math.abs(scarto) <= ammesso, kcalStimate, scarto };
}
