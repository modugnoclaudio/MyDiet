import { MESI } from './andamento';
import { giorniTra, spostaGiorni } from './date';
import type { Pesata } from './tipi';

export const PESO_MINIMO = 20;
export const PESO_MASSIMO = 350;

/** Controlla un peso corporeo in kg; `soggetto` apre il messaggio (es. "Il peso obiettivo"). */
export function validaPeso(kg: number, soggetto = 'Il peso'): string[] {
  if (!Number.isFinite(kg)) return [`${soggetto} deve essere un numero.`];
  if (kg < PESO_MINIMO || kg > PESO_MASSIMO) return [`${soggetto} deve essere compreso tra ${PESO_MINIMO} e ${PESO_MASSIMO} kg.`];
  return [];
}

export type TipoPeriodoPeso = 'mese' | 'trimestre' | 'anno';

const MESI_DEL_PERIODO: Readonly<Record<TipoPeriodoPeso, number>> = { mese: 1, trimestre: 3, anno: 12 };

export interface PeriodoPeso {
  tipo: TipoPeriodoPeso;
  /** primo giorno, `YYYY-MM-DD` */
  inizio: string;
  /** ultimo giorno, `YYYY-MM-DD` */
  fine: string;
}

function parti(dataIso: string): [number, number, number] {
  return dataIso.split('-').map(Number) as [number, number, number];
}

function iso(anno: number, mese: number, giorno: number): string {
  return `${anno}-${String(mese).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`;
}

/** Anno e mese (1–12) spostati di `mesi` mesi. */
function spostaMese(anno: number, mese: number, mesi: number): [number, number] {
  const indice = anno * 12 + (mese - 1) + mesi;
  return [Math.floor(indice / 12), (indice % 12) + 1];
}

/**
 * Periodo di 1, 3 o 12 mesi di calendario che finisce con il mese della data:
 * a novembre, "trimestre" va da settembre a novembre e "anno" da dicembre
 * dell'anno prima a novembre.
 */
export function periodoPeso(tipo: TipoPeriodoPeso, dataIso: string): PeriodoPeso {
  const [anno, mese] = parti(dataIso);
  const [annoInizio, meseInizio] = spostaMese(anno, mese, 1 - MESI_DEL_PERIODO[tipo]);
  const ultimo = new Date(Date.UTC(anno, mese, 0)).getUTCDate();
  return { tipo, inizio: iso(annoInizio, meseInizio, 1), fine: iso(anno, mese, ultimo) };
}

/** Periodo precedente (`-1`) o successivo (`+1`), della stessa durata. */
export function spostaPeriodoPeso(periodo: PeriodoPeso, verso: -1 | 1): PeriodoPeso {
  const [anno, mese] = parti(periodo.fine);
  const [nuovoAnno, nuovoMese] = spostaMese(anno, mese, verso * MESI_DEL_PERIODO[periodo.tipo]);
  return periodoPeso(periodo.tipo, iso(nuovoAnno, nuovoMese, 1));
}

/** Titolo del periodo, es. "novembre 2026", "settembre – novembre 2026", "dicembre 2025 – novembre 2026". */
export function etichettaPeriodoPeso(periodo: PeriodoPeso): string {
  const [a1, m1] = parti(periodo.inizio);
  const [a2, m2] = parti(periodo.fine);
  if (periodo.tipo === 'mese') return `${MESI[m2 - 1]} ${a2}`;
  if (a1 === a2) return `${MESI[m1 - 1]} – ${MESI[m2 - 1]} ${a2}`;
  return `${MESI[m1 - 1]} ${a1} – ${MESI[m2 - 1]} ${a2}`;
}

/** Posizione della data nel periodo, da 0 (primo giorno) a 1 (ultimo giorno). */
export function posizioneNelPeriodo(periodo: PeriodoPeso, dataIso: string): number {
  return giorniTra(periodo.inizio, dataIso) / giorniTra(periodo.inizio, periodo.fine);
}

/**
 * Tacche dell'asse orizzontale: nel mese i giorni 1, 8, 15, 22, 29;
 * in 3 mesi l'inizio di ogni mese; in un anno l'inizio di un mese ogni due.
 */
export function tacchePeriodoPeso(periodo: PeriodoPeso): { data: string; etichetta: string }[] {
  if (periodo.tipo === 'mese') {
    const ultimo = parti(periodo.fine)[2];
    return [1, 8, 15, 22, 29]
      .filter((g) => g <= ultimo)
      .map((g) => ({ data: spostaGiorni(periodo.inizio, g - 1), etichetta: String(g) }));
  }
  const [anno, mese] = parti(periodo.inizio);
  const mesi = MESI_DEL_PERIODO[periodo.tipo];
  const passo = periodo.tipo === 'anno' ? 2 : 1;
  const tacche: { data: string; etichetta: string }[] = [];
  for (let i = 0; i < mesi; i += passo) {
    const [a, m] = spostaMese(anno, mese, i);
    tacche.push({ data: iso(a, m, 1), etichetta: MESI[m - 1]!.slice(0, 3) });
  }
  return tacche;
}

export interface RiepilogoPeso {
  /** pesate del periodo, dalla più vecchia */
  pesate: Pesata[];
  /** ultima pesata del periodo; `null` se non ce ne sono */
  ultima: Pesata | null;
  /** kg dall'ultima meno kg dalla prima pesata del periodo; `null` con meno di 2 pesate */
  variazione: number | null;
  /** kg dell'ultima pesata meno il peso obiettivo; `null` senza pesate o senza obiettivo */
  distanzaObiettivo: number | null;
}

/** Pesate del periodo, variazione e distanza dal peso obiettivo. */
export function riepilogoPeso(pesate: readonly Pesata[], periodo: PeriodoPeso, pesoObiettivo: number | null): RiepilogoPeso {
  const delPeriodo = pesate
    .filter((p) => p.data >= periodo.inizio && p.data <= periodo.fine)
    .sort((a, b) => a.data.localeCompare(b.data));
  const prima = delPeriodo[0];
  const ultima = delPeriodo[delPeriodo.length - 1] ?? null;
  return {
    pesate: delPeriodo,
    ultima,
    variazione: prima && ultima && delPeriodo.length >= 2 ? arrotonda1(ultima.kg - prima.kg) : null,
    distanzaObiettivo: ultima && pesoObiettivo !== null ? arrotonda1(ultima.kg - pesoObiettivo) : null,
  };
}

function arrotonda1(valore: number): number {
  return Math.round(valore * 10) / 10;
}

/**
 * Scala dell'asse verticale del peso, che **non** parte da zero: comprende
 * tutti i valori (pesate e obiettivo) con passi tondi (0,5, 1, 2, 5… kg),
 * al massimo 5 intervalli e, se c'è spazio, un passo di margine sopra e sotto.
 */
export function scalaPeso(valori: readonly number[]): { minimo: number; massimo: number; tacche: number[] } {
  const minimoDati = Math.min(...valori);
  const massimoDati = Math.max(...valori);
  const passi = [0.5, 1, 2, 5, 10, 20, 50, 100];
  let passo = passi[passi.length - 1]!;
  let minimo = 0;
  let massimo = 0;
  for (const p of passi) {
    passo = p;
    minimo = Math.floor(minimoDati / p) * p;
    massimo = Math.ceil(massimoDati / p) * p;
    if (massimo === minimo) massimo += p;
    if ((massimo - minimo) / p <= 5) break;
  }
  if (minimo === minimoDati && (massimo - minimo) / passo < 5) minimo -= passo;
  if (massimo === massimoDati && (massimo - minimo) / passo < 5) massimo += passo;
  const intervalli = Math.round((massimo - minimo) / passo);
  return {
    minimo,
    massimo,
    tacche: Array.from({ length: intervalli + 1 }, (_, i) => Math.round((minimo + i * passo) * 10) / 10),
  };
}

type Formatta = (n: number, decimali?: number) => string;

/** Variazione di peso con il segno, es. "+0,4 kg", "−1,2 kg", "0 kg". */
export function formattaVariazioneKg(kg: number, formattaNumero: Formatta): string {
  const valore = formattaNumero(Math.abs(kg), 1);
  if (valore === '0') return '0 kg';
  return `${kg > 0 ? '+' : '−'}${valore} kg`;
}

/** Distanza dell'ultima pesata dal peso obiettivo, es. "3,6 kg sopra l'obiettivo". */
export function descriviDistanzaObiettivo(distanza: number, formattaNumero: Formatta): string {
  const valore = formattaNumero(Math.abs(distanza), 1);
  if (valore === '0') return 'Obiettivo raggiunto';
  return `${valore} kg ${distanza > 0 ? 'sopra' : 'sotto'} l’obiettivo`;
}

/** Indice dell'elemento con la posizione più vicina a `posizione` (es. il punto toccato nel grafico); -1 se vuoto. */
export function indicePiuVicino(posizioni: readonly number[], posizione: number): number {
  let migliore = -1;
  posizioni.forEach((p, i) => {
    if (migliore === -1 || Math.abs(p - posizione) < Math.abs(posizioni[migliore]! - posizione)) migliore = i;
  });
  return migliore;
}
