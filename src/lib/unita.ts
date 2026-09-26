import { leggiNumero } from './formato';
import { normalizzaTesto } from './ricerca';
import type { Alimento, AlimentoBase, Unita } from './tipi';
import { validaGrammi } from './validazione';

const PLURALI: Readonly<Record<string, string>> = {
  uovo: 'uova',
  porzione: 'porzioni',
  albume: 'albumi',
  tuorlo: 'tuorli',
};

export const LUNGHEZZA_MASSIMA_NOME_UNITA = 30;
export const GRAMMI_MASSIMI_UNITA = 5000;

/**
 * Unità ricavata dalla porzione standard CREA. Per le uova di gallina la
 * porzione (50 g, pari ad albume 35 g + tuorlo 15 g) corrisponde a un uovo.
 */
export function unitaCrea(alimento: AlimentoBase): Unita[] {
  if (alimento.porzione === undefined) return [];
  const nome = alimento.nome.toLowerCase();
  let nomeUnita = 'porzione';
  if (nome.startsWith('uova di gallina') && !nome.includes('polvere')) {
    if (nome.includes('albume')) nomeUnita = 'albume';
    else if (nome.includes('tuorlo')) nomeUnita = 'tuorlo';
    else if (nome.includes('intero')) nomeUnita = 'uovo';
  }
  return [{ nome: nomeUnita, grammi: alimento.porzione }];
}

/** Unità disponibili per un alimento: prima quelle dell'utente, poi quelle CREA. */
export function unitaDisponibili(alimento: Alimento, personali: readonly Unita[]): Unita[] {
  const nomi = new Set(personali.map((u) => normalizzaTesto(u.nome)));
  const crea = alimento.origine === 'base' ? unitaCrea(alimento) : [];
  return [...personali, ...crea.filter((u) => !nomi.has(normalizzaTesto(u.nome)))];
}

/**
 * Unità da proporre quando si sceglie l'alimento: la prima dell'utente,
 * altrimenti un'unità CREA "concreta" (es. uovo), altrimenti i grammi (`null`).
 */
export function unitaIniziale(disponibili: readonly Unita[], personali: readonly Unita[]): Unita | null {
  if (personali.length > 0) return personali[0]!;
  return disponibili.find((u) => u.nome !== 'porzione') ?? null;
}

/** Grammi corrispondenti a una quantità nell'unità indicata (`null` = grammi). */
export function grammiDaQuantita(quantita: number, unita: Unita | null): number {
  return unita ? quantita * unita.grammi : quantita;
}

/** Etichetta per il menu delle unità, es. "uovo (50 g)". */
export function etichettaUnita(unita: Unita, formattaNumero: (n: number, decimali?: number) => string): string {
  return `${unita.nome} (${formattaNumero(unita.grammi, 1)} g)`;
}

/** Quantità in unità da mostrare, es. "3 uova", "1 porzione", "2 × vasetto". */
export function descriviMisura(
  quantita: number,
  unita: Unita,
  formattaNumero: (n: number, decimali?: number) => string,
): string {
  const numero = formattaNumero(quantita, 2);
  if (quantita === 1) return `${numero} ${unita.nome}`;
  const plurale = PLURALI[unita.nome.toLowerCase()];
  return plurale ? `${numero} ${plurale}` : `${numero} × ${unita.nome}`;
}

/** Controlla una nuova unità dell'utente rispetto a quelle già presenti. */
export function validaUnita(unita: Unita, altre: readonly Unita[]): string[] {
  const errori: string[] = [];
  const nome = unita.nome.trim();
  if (nome === '') errori.push('Il nome dell’unità è obbligatorio.');
  else if (nome.length > LUNGHEZZA_MASSIMA_NOME_UNITA) {
    errori.push(`Il nome dell’unità può avere al massimo ${LUNGHEZZA_MASSIMA_NOME_UNITA} caratteri.`);
  } else if (['g', 'gr', 'grammi', 'grammo'].includes(normalizzaTesto(nome))) {
    errori.push('I grammi sono già disponibili: scegli un altro nome.');
  } else if (altre.some((u) => normalizzaTesto(u.nome) === normalizzaTesto(nome))) {
    errori.push(`Esiste già l’unità “${nome}”.`);
  }
  if (!Number.isFinite(unita.grammi)) errori.push('Il peso dell’unità deve essere un numero.');
  else if (unita.grammi <= 0) errori.push('Il peso dell’unità deve essere maggiore di 0 g.');
  else if (unita.grammi > GRAMMI_MASSIMI_UNITA) errori.push(`Il peso dell’unità non può superare ${GRAMMI_MASSIMI_UNITA} g.`);
  return errori;
}

/** Controlla la quantità inserita in un'unità diversa dai grammi. */
export function validaQuantitaUnita(quantita: number): string[] {
  if (!Number.isFinite(quantita)) return ['La quantità deve essere un numero.'];
  if (quantita <= 0) return ['La quantità deve essere maggiore di 0.'];
  return [];
}

/**
 * Unità da proporre modificando una voce: quelle disponibili più, se non c'è
 * più, l'unità con cui la voce era stata inserita.
 */
export function unitaPerModifica(disponibili: readonly Unita[], usata: Unita | undefined): Unita[] {
  if (!usata || disponibili.some((u) => normalizzaTesto(u.nome) === normalizzaTesto(usata.nome) && u.grammi === usata.grammi)) {
    return [...disponibili];
  }
  return [...disponibili, usata];
}

export type QuantitaLetta =
  | { grammi: number; misura?: { quantita: number; unita: Unita }; errori?: undefined }
  | { errori: string[] };

/**
 * Legge la quantità scritta dall'utente nell'unità scelta (`null` = grammi):
 * restituisce i grammi e, se in unità, la misura da salvare nella voce.
 */
export function leggiQuantita(testo: string, unita: Unita | null): QuantitaLetta {
  const numero = leggiNumero(testo);
  if (numero === undefined) return { errori: [unita ? 'Inserisci la quantità.' : 'Inserisci la quantità in grammi.'] };
  const errori = unita ? validaQuantitaUnita(numero) : validaGrammi(numero);
  if (errori.length > 0) return { errori };
  const grammi = grammiDaQuantita(numero, unita);
  return unita ? { grammi, misura: { quantita: numero, unita: { ...unita } } } : { grammi };
}
