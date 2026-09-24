export interface AvanzamentoObiettivo {
  /** percentuale dell'obiettivo raggiunta, può superare 100 */
  percentuale: number;
  /** percentuale da usare per la barra, limitata tra 0 e 100 */
  percentualeBarra: number;
  /** kcal che mancano all'obiettivo (0 se raggiunto o superato) */
  rimanenti: number;
  /** kcal oltre l'obiettivo (0 se non superato) */
  eccedenza: number;
  superato: boolean;
}

/**
 * Calcola l'avanzamento verso l'obiettivo giornaliero di kcal.
 * Restituisce `null` se l'obiettivo non è impostato o non è un numero positivo.
 */
export function avanzamentoObiettivo(
  kcalConsumate: number,
  obiettivoKcal: number | null,
): AvanzamentoObiettivo | null {
  if (obiettivoKcal === null || !Number.isFinite(obiettivoKcal) || obiettivoKcal <= 0) {
    return null;
  }
  const percentuale = (kcalConsumate / obiettivoKcal) * 100;
  return {
    percentuale,
    percentualeBarra: Math.min(100, Math.max(0, percentuale)),
    rimanenti: Math.max(0, obiettivoKcal - kcalConsumate),
    eccedenza: Math.max(0, kcalConsumate - obiettivoKcal),
    superato: kcalConsumate > obiettivoKcal,
  };
}
