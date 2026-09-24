import { PASTI, type Pasto, type ValoriNutrizionali, type VoceDiario } from './tipi';
import { sommaValori, valoriPerGrammi } from './valori';

/** Valori nutrizionali effettivi di una voce del diario (in base ai grammi). */
export function valoriVoce(voce: VoceDiario): ValoriNutrizionali {
  return valoriPerGrammi(voce.alimento.valori, voce.grammi);
}

/** Voci del diario relative alla data indicata (`YYYY-MM-DD`). */
export function vociDelGiorno(voci: readonly VoceDiario[], data: string): VoceDiario[] {
  return voci.filter((voce) => voce.data === data);
}

/** Totale dei valori nutrizionali di un insieme di voci. */
export function totaleVoci(voci: readonly VoceDiario[]): ValoriNutrizionali {
  return sommaValori(voci.map(valoriVoce));
}

/** Totali per ciascun pasto; i pasti senza voci hanno totale zero. */
export function totaliPerPasto(voci: readonly VoceDiario[]): Record<Pasto, ValoriNutrizionali> {
  const totali = {} as Record<Pasto, ValoriNutrizionali>;
  for (const pasto of PASTI) {
    totali[pasto] = totaleVoci(voci.filter((voce) => voce.pasto === pasto));
  }
  return totali;
}
