/**
 * Arrotonda un numero al numero di decimali indicato.
 */
export function arrotonda(valore: number, decimali = 0): number {
  const fattore = 10 ** decimali;
  return Math.round((valore + Number.EPSILON) * fattore) / fattore;
}
