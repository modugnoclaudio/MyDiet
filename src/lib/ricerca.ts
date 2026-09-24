import type { Alimento } from './tipi';

/** Testo in minuscolo, senza accenti né punteggiatura, con spazi singoli. */
export function normalizzaTesto(testo: string): string {
  return testo
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('it')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function punteggio(alimento: Alimento, parole: string[]): number | null {
  const nome = normalizzaTesto(alimento.nome);
  const testo = alimento.origine === 'personale' && alimento.marca ? `${nome} ${normalizzaTesto(alimento.marca)}` : nome;
  const paroleTesto = testo.split(' ');
  let totale = 0;
  for (const parola of parole) {
    if (!testo.includes(parola)) return null;
    if (paroleTesto.includes(parola)) totale += 4;
    else if (paroleTesto.some((p) => p.startsWith(parola))) totale += 2;
    else totale += 1;
  }
  if (nome.startsWith(parole[0]!)) totale += 2;
  if (alimento.origine === 'personale') totale += 1;
  return totale;
}

/**
 * Cerca tra gli alimenti: ogni parola cercata deve comparire nel nome
 * (o nella marca), senza distinzione di maiuscole e accenti.
 * Ordine per pertinenza: parola intera > inizio di parola > parte di parola,
 * con un bonus se il nome inizia con la prima parola cercata e per gli
 * alimenti personali; a parità, nome più corto.
 */
export function cercaAlimenti<T extends Alimento>(alimenti: readonly T[], ricerca: string, limite = 50): T[] {
  const parole = normalizzaTesto(ricerca).split(' ').filter(Boolean);
  if (parole.length === 0) return [];
  const trovati: { alimento: T; punti: number }[] = [];
  for (const alimento of alimenti) {
    const punti = punteggio(alimento, parole);
    if (punti !== null) trovati.push({ alimento, punti });
  }
  trovati.sort(
    (a, b) =>
      b.punti - a.punti ||
      a.alimento.nome.length - b.alimento.nome.length ||
      a.alimento.nome.localeCompare(b.alimento.nome, 'it'),
  );
  return trovati.slice(0, limite).map((t) => t.alimento);
}
