import { chiaveAlimento } from './alimenti';
import { giorniTra } from './date';
import {
  PASTI,
  type AlimentoPersonale,
  type Impostazioni,
  type Pasto,
  type Unita,
  type UnitaAlimento,
  type ValoriNutrizionali,
  type VoceDiario,
} from './tipi';
import { validaQuantitaUnita, validaUnita } from './unita';
import { validaGrammi, validaObiettivoKcal, validaValoriPer100g } from './validazione';

export const APP_BACKUP = 'MyDiet';
/** Formato attuale. Il formato 1 (senza unità) resta importabile. */
export const FORMATO_BACKUP = 2;

/** Tutti i dati dell'utente. */
export interface DatiUtente {
  alimenti: AlimentoPersonale[];
  diario: VoceDiario[];
  impostazioni: Impostazioni;
  /** unità definite dall'utente, per alimento */
  unita: UnitaAlimento[];
}

export interface FileBackup extends DatiUtente {
  app: typeof APP_BACKUP;
  formato: typeof FORMATO_BACKUP;
  /** data e ora dell'esportazione, ISO 8601 */
  esportato: string;
}

export type EsitoBackup = { ok: true; backup: FileBackup } | { ok: false; errori: string[] };

/** Contenuto del file di backup, come testo JSON leggibile. */
export function creaBackup(dati: DatiUtente, esportato: Date): string {
  const backup: FileBackup = {
    app: APP_BACKUP,
    formato: FORMATO_BACKUP,
    esportato: esportato.toISOString(),
    ...dati,
  };
  return JSON.stringify(backup, null, 1) + '\n';
}

/** Nome del file di backup per la data indicata (`YYYY-MM-DD`). */
export function nomeFileBackup(data: string): string {
  return `mydiet-backup-${data}.json`;
}

type Oggetto = Record<string, unknown>;

function oggetto(valore: unknown): valore is Oggetto {
  return typeof valore === 'object' && valore !== null && !Array.isArray(valore);
}

function testo(valore: unknown): valore is string {
  return typeof valore === 'string' && valore.trim() !== '';
}

function numero(valore: unknown): valore is number {
  return typeof valore === 'number' && Number.isFinite(valore);
}

function dataValida(valore: unknown): valore is string {
  if (typeof valore !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valore)) return false;
  const [anno, mese, giorno] = valore.split('-').map(Number) as [number, number, number];
  const data = new Date(Date.UTC(anno, mese - 1, giorno));
  return data.getUTCFullYear() === anno && data.getUTCMonth() === mese - 1 && data.getUTCDate() === giorno;
}

/** Legge i valori per 100 g; restituisce `undefined` se non validi. */
function leggiValori(valore: unknown): ValoriNutrizionali | undefined {
  if (!oggetto(valore)) return undefined;
  const { kcal, carboidrati, proteine, grassi, fibre } = valore;
  if (!numero(kcal) || !numero(carboidrati) || !numero(proteine) || !numero(grassi)) return undefined;
  if (fibre !== undefined && !numero(fibre)) return undefined;
  const valori: ValoriNutrizionali = { kcal, carboidrati, proteine, grassi, ...(fibre === undefined ? {} : { fibre }) };
  return validaValoriPer100g(valori).length === 0 ? valori : undefined;
}

function leggiMarca(valore: unknown): { marca?: string } | undefined {
  if (valore === undefined) return {};
  if (typeof valore !== 'string') return undefined;
  return valore.trim() ? { marca: valore } : {};
}

function leggiAlimento(valore: unknown): AlimentoPersonale | undefined {
  if (!oggetto(valore) || !testo(valore.id) || valore.origine !== 'personale' || !testo(valore.nome)) return undefined;
  const marca = leggiMarca(valore.marca);
  const valori = leggiValori(valore.valori);
  if (!marca || !valori) return undefined;
  return { id: valore.id, origine: 'personale', nome: valore.nome, ...marca, valori };
}

function leggiUnita(valore: unknown, altre: readonly Unita[]): Unita | undefined {
  if (!oggetto(valore) || typeof valore.nome !== 'string' || !numero(valore.grammi)) return undefined;
  const unita = { nome: valore.nome, grammi: valore.grammi };
  return validaUnita(unita, altre).length === 0 ? unita : undefined;
}

function leggiUnitaAlimento(valore: unknown): UnitaAlimento | undefined {
  if (!oggetto(valore) || !testo(valore.alimentoId) || !Array.isArray(valore.unita) || valore.unita.length === 0) {
    return undefined;
  }
  const unita: Unita[] = [];
  for (const u of valore.unita) {
    const letta = leggiUnita(u, unita);
    if (!letta) return undefined;
    unita.push(letta);
  }
  return { alimentoId: valore.alimentoId, unita };
}

function leggiMisura(valore: unknown, grammi: number): { misura?: VoceDiario['misura'] } | undefined {
  if (valore === undefined) return {};
  if (!oggetto(valore) || !numero(valore.quantita) || validaQuantitaUnita(valore.quantita).length > 0) return undefined;
  const unita = leggiUnita(valore.unita, []);
  if (!unita) return undefined;
  // I grammi della voce devono corrispondere a quantità × unità
  if (Math.abs(valore.quantita * unita.grammi - grammi) > 0.01) return undefined;
  return { misura: { quantita: valore.quantita, unita } };
}

function leggiVoce(valore: unknown): VoceDiario | undefined {
  if (!oggetto(valore) || !testo(valore.id) || !dataValida(valore.data)) return undefined;
  if (!PASTI.includes(valore.pasto as Pasto)) return undefined;
  if (!numero(valore.grammi) || validaGrammi(valore.grammi).length > 0) return undefined;
  const alimento = valore.alimento;
  if (!oggetto(alimento) || !testo(alimento.id) || !testo(alimento.nome)) return undefined;
  const marca = leggiMarca(alimento.marca);
  const valori = leggiValori(alimento.valori);
  const misura = leggiMisura(valore.misura, valore.grammi);
  if (!marca || !valori || !misura) return undefined;
  return {
    id: valore.id,
    data: valore.data,
    pasto: valore.pasto as Pasto,
    grammi: valore.grammi,
    ...misura,
    alimento: { id: alimento.id, nome: alimento.nome, ...marca, valori },
  };
}

function leggiImpostazioni(valore: unknown): Impostazioni | undefined {
  if (!oggetto(valore)) return undefined;
  const { obiettivoKcal, ultimoBackup } = valore;
  const obiettivoValido =
    obiettivoKcal === null ||
    obiettivoKcal === undefined ||
    (numero(obiettivoKcal) && validaObiettivoKcal(obiettivoKcal).length === 0);
  const backupValido = ultimoBackup === null || ultimoBackup === undefined || dataValida(ultimoBackup);
  if (!obiettivoValido || !backupValido) return undefined;
  return { obiettivoKcal: obiettivoKcal ?? null, ultimoBackup: ultimoBackup ?? null };
}

function elenco<T>(
  valori: unknown[],
  leggi: (valore: unknown) => T | undefined,
  errore: (numero: number) => string,
  errori: string[],
): T[] {
  const letti: T[] = [];
  valori.forEach((valore, indice) => {
    const letto = leggi(valore);
    if (letto) letti.push(letto);
    else errori.push(errore(indice + 1));
  });
  return letti;
}

function duplicati(valori: string[]): boolean {
  return new Set(valori).size !== valori.length;
}

/**
 * Legge e controlla un file di backup. Tutti i dati devono essere validi:
 * in caso contrario restituisce l'elenco degli errori e nessun dato.
 * I campi sconosciuti vengono ignorati.
 */
export function leggiBackup(contenuto: string): EsitoBackup {
  let dati: unknown;
  try {
    dati = JSON.parse(contenuto);
  } catch {
    return { ok: false, errori: ['Il file non è un backup di MyDiet: non è un file JSON valido.'] };
  }
  if (!oggetto(dati) || dati.app !== APP_BACKUP) {
    return { ok: false, errori: ['Il file non è un backup di MyDiet.'] };
  }
  if (dati.formato !== 1 && dati.formato !== FORMATO_BACKUP) {
    return {
      ok: false,
      errori: ['Il backup è stato creato da una versione diversa di MyDiet e non può essere importato.'],
    };
  }
  const unitaGrezze = dati.formato === 1 ? [] : dati.unita;
  if (
    !Array.isArray(dati.alimenti) ||
    !Array.isArray(dati.diario) ||
    !Array.isArray(unitaGrezze) ||
    typeof dati.esportato !== 'string'
  ) {
    return { ok: false, errori: ['Il backup è incompleto o danneggiato.'] };
  }

  const errori: string[] = [];
  const alimenti = elenco(dati.alimenti, leggiAlimento, (n) => `L’alimento n. ${n} non è valido.`, errori);
  const diario = elenco(dati.diario, leggiVoce, (n) => `La voce del diario n. ${n} non è valida.`, errori);
  const unita = elenco(unitaGrezze, leggiUnitaAlimento, (n) => `Le unità n. ${n} non sono valide.`, errori);
  const impostazioni = leggiImpostazioni(dati.impostazioni);
  if (!impostazioni) errori.push('Le impostazioni non sono valide.');
  if (
    duplicati(alimenti.map((a) => a.id)) ||
    duplicati(diario.map((v) => v.id)) ||
    duplicati(unita.map((u) => u.alimentoId))
  ) {
    errori.push('Il backup contiene dati ripetuti.');
  }
  if (duplicati(alimenti.map((a) => chiaveAlimento(a.nome, a.marca)))) {
    errori.push('Il backup contiene due alimenti con lo stesso nome e la stessa marca.');
  }
  if (errori.length > 0 || !impostazioni) return { ok: false, errori };

  return {
    ok: true,
    backup: { app: APP_BACKUP, formato: FORMATO_BACKUP, esportato: dati.esportato, alimenti, diario, impostazioni, unita },
  };
}

export interface RiepilogoDati {
  alimenti: number;
  voci: number;
  giorni: number;
}

/** Quanti alimenti, voci e giorni contengono i dati. */
export function riepilogoDati(dati: Pick<DatiUtente, 'alimenti' | 'diario'>): RiepilogoDati {
  return {
    alimenti: dati.alimenti.length,
    voci: dati.diario.length,
    giorni: new Set(dati.diario.map((voce) => voce.data)).size,
  };
}

/** Giorni dopo i quali l'app ricorda di fare un nuovo backup. */
export const GIORNI_PROMEMORIA_BACKUP = 30;

/**
 * Indica se ricordare all'utente di fare un backup: mai fatto oppure fatto
 * da almeno `GIORNI_PROMEMORIA_BACKUP` giorni, e solo se ci sono dati da salvare.
 */
export function backupDaFare(ultimoBackup: string | null, oggi: string, ciSonoDati: boolean): boolean {
  if (!ciSonoDati) return false;
  return ultimoBackup === null || giorniTra(ultimoBackup, oggi) >= GIORNI_PROMEMORIA_BACKUP;
}
