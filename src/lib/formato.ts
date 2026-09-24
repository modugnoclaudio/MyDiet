const formatiNumero = new Map<number, Intl.NumberFormat>();

/** Numero in formato italiano, es. 1234.5 → "1.234,5". */
export function formattaNumero(valore: number, decimali = 0): string {
  let formato = formatiNumero.get(decimali);
  if (!formato) {
    formato = new Intl.NumberFormat('it-IT', { maximumFractionDigits: decimali, useGrouping: true });
    formatiNumero.set(decimali, formato);
  }
  // Evita "-0"
  const risultato = formato.format(valore);
  return risultato === '-0' ? '0' : risultato;
}

/**
 * Legge un numero scritto dall'utente, con virgola o punto decimale.
 * Restituisce `undefined` per un campo vuoto e `NaN` per un testo non valido.
 */
export function leggiNumero(testo: string): number | undefined {
  const pulito = testo.trim().replace(/\s/g, '');
  if (pulito === '') return undefined;
  if (!/^-?\d*([.,]\d*)?$/.test(pulito) || !/\d/.test(pulito)) return Number.NaN;
  return Number(pulito.replace(',', '.'));
}

const formatoData = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Data `YYYY-MM-DD` in italiano, es. "giovedì 24 settembre 2026". */
export function formattaData(dataIso: string): string {
  const [anno, mese, giorno] = dataIso.split('-').map(Number) as [number, number, number];
  return formatoData.format(new Date(Date.UTC(anno, mese - 1, giorno)));
}

/** "Oggi", "Ieri" o la data in italiano, rispetto alla data odierna passata. */
export function etichettaGiorno(dataIso: string, oggiIso: string, ieriIso: string): string {
  if (dataIso === oggiIso) return 'Oggi';
  if (dataIso === ieriIso) return 'Ieri';
  const testo = formattaData(dataIso);
  return testo.charAt(0).toUpperCase() + testo.slice(1);
}
