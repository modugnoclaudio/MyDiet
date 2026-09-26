import { giorniTra, spostaGiorni } from './date';
import { totaleVoci } from './diario';
import type { ValoriNutrizionali, VoceDiario } from './tipi';
import { sommaValori } from './valori';

export type TipoPeriodo = 'settimana' | 'mese';

export interface Periodo {
  tipo: TipoPeriodo;
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

/** Giorno della settimana: 0 = lunedì … 6 = domenica. */
export function giornoSettimana(dataIso: string): number {
  const [a, m, g] = parti(dataIso);
  return (new Date(Date.UTC(a, m - 1, g)).getUTCDay() + 6) % 7;
}

/** Settimana (da lunedì a domenica) o mese di calendario che contiene la data. */
export function periodoDi(tipo: TipoPeriodo, dataIso: string): Periodo {
  if (tipo === 'settimana') {
    const inizio = spostaGiorni(dataIso, -giornoSettimana(dataIso));
    return { tipo, inizio, fine: spostaGiorni(inizio, 6) };
  }
  const [a, m] = parti(dataIso);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return { tipo, inizio: iso(a, m, 1), fine: iso(a, m, ultimo) };
}

/** Periodo precedente (`-1`) o successivo (`+1`). */
export function spostaPeriodo(periodo: Periodo, verso: -1 | 1): Periodo {
  if (periodo.tipo === 'settimana') return periodoDi('settimana', spostaGiorni(periodo.inizio, 7 * verso));
  return periodoDi('mese', verso === 1 ? spostaGiorni(periodo.fine, 1) : spostaGiorni(periodo.inizio, -1));
}

/** Tutte le date del periodo, in ordine. */
export function giorniDelPeriodo(periodo: Periodo): string[] {
  const n = giorniTra(periodo.inizio, periodo.fine);
  return Array.from({ length: n + 1 }, (_, i) => spostaGiorni(periodo.inizio, i));
}

export interface GiornoAndamento {
  data: string;
  /** totale del giorno; `null` se il giorno non ha voci */
  valori: ValoriNutrizionali | null;
  /** kcal arrotondate come mostrate; `null` se il giorno non ha voci */
  kcal: number | null;
  /** `null` se non c'è obiettivo o il giorno non ha voci */
  oltreObiettivo: boolean | null;
}

export interface RiepilogoPeriodo {
  giorni: GiornoAndamento[];
  /** giorni con almeno una voce (esclusi quelli futuri) */
  giorniConDati: number;
  /** media sui soli giorni con dati; `null` se non ci sono dati */
  media: ValoriNutrizionali | null;
  /** giorni con dati entro l'obiettivo; `null` se l'obiettivo non è impostato */
  giorniEntroObiettivo: number | null;
  /** kcal più alte del periodo (0 se nessun dato) */
  massimo: number;
}

/**
 * Totali giorno per giorno e medie del periodo. Le medie considerano solo i
 * giorni con voci, così un giorno non registrato non abbassa la media.
 */
export function riepilogoPeriodo(
  voci: readonly VoceDiario[],
  periodo: Periodo,
  obiettivoKcal: number | null,
): RiepilogoPeriodo {
  const perGiorno = new Map<string, VoceDiario[]>();
  for (const voce of voci) {
    if (voce.data < periodo.inizio || voce.data > periodo.fine) continue;
    perGiorno.set(voce.data, [...(perGiorno.get(voce.data) ?? []), voce]);
  }
  const giorni: GiornoAndamento[] = giorniDelPeriodo(periodo).map((data) => {
    const vociGiorno = perGiorno.get(data);
    if (!vociGiorno) return { data, valori: null, kcal: null, oltreObiettivo: null };
    const valori = totaleVoci(vociGiorno);
    const kcal = Math.round(valori.kcal);
    return { data, valori, kcal, oltreObiettivo: obiettivoKcal === null ? null : kcal > obiettivoKcal };
  });
  const conDati = giorni.filter((g): g is GiornoAndamento & { valori: ValoriNutrizionali; kcal: number } => g.valori !== null);
  const somma = sommaValori(conDati.map((g) => g.valori));
  const n = conDati.length;
  const media: ValoriNutrizionali | null =
    n === 0
      ? null
      : {
          kcal: somma.kcal / n,
          carboidrati: somma.carboidrati / n,
          proteine: somma.proteine / n,
          grassi: somma.grassi / n,
          ...(somma.fibre === undefined ? {} : { fibre: somma.fibre / n }),
        };
  return {
    giorni,
    giorniConDati: n,
    media,
    giorniEntroObiettivo: obiettivoKcal === null ? null : conDati.filter((g) => g.kcal <= obiettivoKcal).length,
    massimo: Math.max(0, ...conDati.map((g) => g.kcal)),
  };
}

/**
 * Scala dell'asse verticale con valori "tondi": il massimo da rappresentare
 * (dati e obiettivo) viene arrotondato per eccesso, con al massimo 5 intervalli.
 */
export function scalaAsse(valoreMassimo: number): { massimo: number; tacche: number[] } {
  const passi = [100, 200, 250, 500, 1000, 2000, 2500, 5000];
  const valore = Math.max(valoreMassimo, 1);
  const passo = passi.find((p) => Math.ceil(valore / p) <= 5) ?? Math.ceil(valore / 5 / 1000) * 1000;
  const massimo = Math.ceil(valore / passo) * passo;
  return { massimo, tacche: Array.from({ length: massimo / passo + 1 }, (_, i) => i * passo) };
}

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** Titolo del periodo, es. "21–27 settembre 2026", "28 settembre – 4 ottobre 2026", "settembre 2026". */
export function etichettaPeriodo(periodo: Periodo): string {
  const [a1, m1, g1] = parti(periodo.inizio);
  const [a2, m2, g2] = parti(periodo.fine);
  if (periodo.tipo === 'mese') return `${MESI[m1 - 1]} ${a1}`;
  if (a1 === a2 && m1 === m2) return `${g1}–${g2} ${MESI[m1 - 1]} ${a1}`;
  if (a1 === a2) return `${g1} ${MESI[m1 - 1]} – ${g2} ${MESI[m2 - 1]} ${a1}`;
  return `${g1} ${MESI[m1 - 1]} ${a1} – ${g2} ${MESI[m2 - 1]} ${a2}`;
}

const GIORNI_BREVI = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];

/** Etichetta breve del giorno per l'asse, es. "lun 21" (settimana) o "21" (mese). */
export function etichettaGiornoAsse(dataIso: string, tipo: TipoPeriodo): string {
  const giorno = parti(dataIso)[2];
  return tipo === 'settimana' ? `${GIORNI_BREVI[giornoSettimana(dataIso)]} ${giorno}` : String(giorno);
}
