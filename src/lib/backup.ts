import { chiaveAlimento } from './alimenti';
import { giorniTra } from './date';
import {
  PASTI,
  type AlimentoPersonale,
  type Impostazioni,
  type ElementoPasto,
  type Pasto,
  type PastoPreferito,
  type Pesata,
  type Ricetta,
  type Unita,
  type UnitaAlimento,
  type ValoriNutrizionali,
  type VoceDiario,
} from './tipi';
import { validaPeso } from './peso';
import { validaRicetta, valoriRicetta } from './ricette';
import { validaQuantitaUnita, validaUnita } from './unita';
import { validaGrammi, validaObiettivoKcal, validaValoriPer100g } from './validazione';

export const APP_BACKUP = 'MyDiet';
/**
 * Formato attuale. Restano importabili il formato 1 (senza unità), il
 * formato 2 (senza pasti preferiti), il formato 3 (senza ricette) e il
 * formato 4 (senza peso).
 */
export const FORMATO_BACKUP = 5;

/** Tutti i dati dell'utente. */
export interface DatiUtente {
  alimenti: AlimentoPersonale[];
  diario: VoceDiario[];
  impostazioni: Impostazioni;
  /** unità definite dall'utente, per alimento */
  unita: UnitaAlimento[];
  pastiPreferiti: PastoPreferito[];
  /** pesate, una per giorno */
  peso: Pesata[];
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
  if (valore.ricetta === undefined) return { id: valore.id, origine: 'personale', nome: valore.nome, ...marca, valori };
  const ricetta = leggiRicetta(valore.ricetta, valore.nome);
  if (!ricetta) return undefined;
  // I valori di una ricetta si ricalcolano dagli ingredienti, ignorando quelli del file.
  return { id: valore.id, origine: 'personale', nome: valore.nome, ...marca, valori: valoriRicetta(ricetta), ricetta };
}

function leggiRicetta(valore: unknown, nome: string): Ricetta | undefined {
  if (!oggetto(valore) || !Array.isArray(valore.ingredienti)) return undefined;
  const { pesoFinale, porzioni } = valore;
  if ((pesoFinale !== undefined && !numero(pesoFinale)) || (porzioni !== undefined && !numero(porzioni))) return undefined;
  const ingredienti: ElementoPasto[] = [];
  for (const i of valore.ingredienti) {
    const letto = leggiElemento(i);
    if (!letto) return undefined;
    ingredienti.push(letto);
  }
  const ricetta: Ricetta = {
    ingredienti,
    ...(pesoFinale === undefined ? {} : { pesoFinale }),
    ...(porzioni === undefined ? {} : { porzioni }),
  };
  return validaRicetta(nome, ricetta).length === 0 ? ricetta : undefined;
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

/** Grammi, misura e copia dell'alimento: la parte comune a voci e pasti preferiti. */
function leggiElemento(valore: unknown): ElementoPasto | undefined {
  if (!oggetto(valore) || !numero(valore.grammi) || validaGrammi(valore.grammi).length > 0) return undefined;
  const alimento = valore.alimento;
  if (!oggetto(alimento) || !testo(alimento.id) || !testo(alimento.nome)) return undefined;
  const marca = leggiMarca(alimento.marca);
  const valori = leggiValori(alimento.valori);
  const misura = leggiMisura(valore.misura, valore.grammi);
  if (!marca || !valori || !misura) return undefined;
  return { grammi: valore.grammi, ...misura, alimento: { id: alimento.id, nome: alimento.nome, ...marca, valori } };
}

function leggiVoce(valore: unknown): VoceDiario | undefined {
  if (!oggetto(valore) || !testo(valore.id) || !dataValida(valore.data)) return undefined;
  if (!PASTI.includes(valore.pasto as Pasto)) return undefined;
  const elemento = leggiElemento(valore);
  if (!elemento) return undefined;
  return { id: valore.id, data: valore.data, pasto: valore.pasto as Pasto, ...elemento };
}

function leggiPastoPreferito(valore: unknown): PastoPreferito | undefined {
  if (!oggetto(valore) || !testo(valore.id) || !testo(valore.nome) || valore.nome.trim().length > 40) return undefined;
  if (!Array.isArray(valore.elementi) || valore.elementi.length === 0) return undefined;
  const elementi: ElementoPasto[] = [];
  for (const e of valore.elementi) {
    const letto = leggiElemento(e);
    if (!letto) return undefined;
    elementi.push(letto);
  }
  return { id: valore.id, nome: valore.nome, elementi };
}

function leggiImpostazioni(valore: unknown): Impostazioni | undefined {
  if (!oggetto(valore)) return undefined;
  const { obiettivoKcal, ultimoBackup, pesoObiettivo } = valore;
  const obiettivoValido =
    obiettivoKcal === null ||
    obiettivoKcal === undefined ||
    (numero(obiettivoKcal) && validaObiettivoKcal(obiettivoKcal).length === 0);
  const backupValido = ultimoBackup === null || ultimoBackup === undefined || dataValida(ultimoBackup);
  const pesoValido =
    pesoObiettivo === null || pesoObiettivo === undefined || (numero(pesoObiettivo) && validaPeso(pesoObiettivo).length === 0);
  if (!obiettivoValido || !backupValido || !pesoValido) return undefined;
  return { obiettivoKcal: obiettivoKcal ?? null, ultimoBackup: ultimoBackup ?? null, pesoObiettivo: pesoObiettivo ?? null };
}

function leggiPesata(valore: unknown): Pesata | undefined {
  if (!oggetto(valore) || !dataValida(valore.data) || !numero(valore.kg) || validaPeso(valore.kg).length > 0) return undefined;
  return { data: valore.data, kg: valore.kg };
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
  if (![1, 2, 3, 4, FORMATO_BACKUP].includes(dati.formato as number)) {
    return {
      ok: false,
      errori: ['Il backup è stato creato da una versione diversa di MyDiet e non può essere importato.'],
    };
  }
  const unitaGrezze = dati.formato === 1 ? [] : dati.unita;
  const pastiGrezzi = dati.formato === 1 || dati.formato === 2 ? [] : dati.pastiPreferiti;
  const pesoGrezzo = dati.formato === FORMATO_BACKUP ? dati.peso : [];
  if (
    !Array.isArray(dati.alimenti) ||
    !Array.isArray(dati.diario) ||
    !Array.isArray(unitaGrezze) ||
    !Array.isArray(pastiGrezzi) ||
    !Array.isArray(pesoGrezzo) ||
    typeof dati.esportato !== 'string'
  ) {
    return { ok: false, errori: ['Il backup è incompleto o danneggiato.'] };
  }

  const errori: string[] = [];
  const alimenti = elenco(dati.alimenti, leggiAlimento, (n) => `L’alimento n. ${n} non è valido.`, errori);
  const diario = elenco(dati.diario, leggiVoce, (n) => `La voce del diario n. ${n} non è valida.`, errori);
  const unita = elenco(unitaGrezze, leggiUnitaAlimento, (n) => `Le unità n. ${n} non sono valide.`, errori);
  const pastiPreferiti = elenco(pastiGrezzi, leggiPastoPreferito, (n) => `Il pasto preferito n. ${n} non è valido.`, errori);
  const peso = elenco(pesoGrezzo, leggiPesata, (n) => `La pesata n. ${n} non è valida.`, errori);
  const impostazioni = leggiImpostazioni(dati.impostazioni);
  if (!impostazioni) errori.push('Le impostazioni non sono valide.');
  if (
    duplicati(alimenti.map((a) => a.id)) ||
    duplicati(diario.map((v) => v.id)) ||
    duplicati(unita.map((u) => u.alimentoId)) ||
    duplicati(pastiPreferiti.map((p) => p.id)) ||
    duplicati(peso.map((p) => p.data))
  ) {
    errori.push('Il backup contiene dati ripetuti.');
  }
  if (duplicati(alimenti.map((a) => chiaveAlimento(a.nome, a.marca)))) {
    errori.push('Il backup contiene due alimenti con lo stesso nome e la stessa marca.');
  }
  if (errori.length > 0 || !impostazioni) return { ok: false, errori };

  return {
    ok: true,
    backup: {
      app: APP_BACKUP,
      formato: FORMATO_BACKUP,
      esportato: dati.esportato,
      alimenti,
      diario,
      impostazioni,
      unita,
      pastiPreferiti,
      peso,
    },
  };
}

export interface RiepilogoDati {
  alimenti: number;
  voci: number;
  giorni: number;
  pesate: number;
}

/** Quanti alimenti, voci, giorni e pesate contengono i dati. */
export function riepilogoDati(dati: Pick<DatiUtente, 'alimenti' | 'diario' | 'peso'>): RiepilogoDati {
  return {
    alimenti: dati.alimenti.length,
    voci: dati.diario.length,
    giorni: new Set(dati.diario.map((voce) => voce.data)).size,
    pesate: dati.peso.length,
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
