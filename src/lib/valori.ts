import type { ValoriNutrizionali } from './tipi';

/**
 * Calcola i valori nutrizionali di `grammi` grammi di un alimento
 * a partire dai valori per 100 g.
 */
export function valoriPerGrammi(valoriPer100g: ValoriNutrizionali, grammi: number): ValoriNutrizionali {
  const fattore = grammi / 100;
  const risultato: ValoriNutrizionali = {
    kcal: valoriPer100g.kcal * fattore,
    carboidrati: valoriPer100g.carboidrati * fattore,
    proteine: valoriPer100g.proteine * fattore,
    grassi: valoriPer100g.grassi * fattore,
  };
  if (valoriPer100g.fibre !== undefined) {
    risultato.fibre = valoriPer100g.fibre * fattore;
  }
  return risultato;
}

/**
 * Somma una lista di valori nutrizionali.
 * Le fibre sono la somma dei soli valori indicati; se nessun elemento
 * le indica, il totale delle fibre resta `undefined`.
 */
export function sommaValori(lista: readonly ValoriNutrizionali[]): ValoriNutrizionali {
  const totale: ValoriNutrizionali = { kcal: 0, carboidrati: 0, proteine: 0, grassi: 0 };
  for (const valori of lista) {
    totale.kcal += valori.kcal;
    totale.carboidrati += valori.carboidrati;
    totale.proteine += valori.proteine;
    totale.grassi += valori.grassi;
    if (valori.fibre !== undefined) {
      totale.fibre = (totale.fibre ?? 0) + valori.fibre;
    }
  }
  return totale;
}
