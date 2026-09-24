/** Data locale in formato `YYYY-MM-DD`, usata come chiave del diario. */
export function dataISO(data: Date): string {
  const anno = data.getFullYear();
  const mese = String(data.getMonth() + 1).padStart(2, '0');
  const giorno = String(data.getDate()).padStart(2, '0');
  return `${anno}-${mese}-${giorno}`;
}

/** Aggiunge (o toglie, se negativo) giorni a una data `YYYY-MM-DD`. */
export function spostaGiorni(dataIso: string, giorni: number): string {
  const [anno, mese, giorno] = dataIso.split('-').map(Number) as [number, number, number];
  // A mezzogiorno per non risentire dei cambi d'ora che avvengono a mezzanotte.
  return dataISO(new Date(anno, mese - 1, giorno + giorni, 12));
}

/** Giorni di calendario da `da` ad `a` (date `YYYY-MM-DD`); negativo se `a` precede `da`. */
export function giorniTra(da: string, a: string): number {
  const utc = (dataIso: string) => {
    const [anno, mese, giorno] = dataIso.split('-').map(Number) as [number, number, number];
    return Date.UTC(anno, mese - 1, giorno);
  };
  return Math.round((utc(a) - utc(da)) / 86_400_000);
}
