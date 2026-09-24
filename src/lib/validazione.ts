import type { ValoriNutrizionali } from './tipi';

const MESSAGGI = {
  kcal: { nonNumero: 'Le calorie devono essere un numero.', negativo: 'Le calorie non possono essere negative.' },
  carboidrati: { nonNumero: 'I carboidrati devono essere un numero.', negativo: 'I carboidrati non possono essere negativi.' },
  proteine: { nonNumero: 'Le proteine devono essere un numero.', negativo: 'Le proteine non possono essere negative.' },
  grassi: { nonNumero: 'I grassi devono essere un numero.', negativo: 'I grassi non possono essere negativi.' },
  fibre: { nonNumero: 'Le fibre devono essere un numero.', negativo: 'Le fibre non possono essere negative.' },
} as const;

/**
 * Controlla che i valori per 100 g siano validi.
 * Restituisce l'elenco degli errori da mostrare all'utente (vuoto se validi).
 */
export function validaValoriPer100g(valori: ValoriNutrizionali): string[] {
  const errori: string[] = [];
  for (const campo of Object.keys(MESSAGGI) as (keyof typeof MESSAGGI)[]) {
    const valore = valori[campo];
    if (valore === undefined) continue;
    if (!Number.isFinite(valore)) {
      errori.push(MESSAGGI[campo].nonNumero);
    } else if (valore < 0) {
      errori.push(MESSAGGI[campo].negativo);
    }
  }
  if (errori.length === 0) {
    const grammi = valori.carboidrati + valori.proteine + valori.grassi + (valori.fibre ?? 0);
    if (grammi > 100) {
      errori.push('La somma di carboidrati, proteine, grassi e fibre non può superare 100 g.');
    }
  }
  return errori;
}

/** Controlla la quantità in grammi di una voce del diario. */
export function validaGrammi(grammi: number): string[] {
  if (!Number.isFinite(grammi)) return ['La quantità deve essere un numero.'];
  if (grammi <= 0) return ['La quantità deve essere maggiore di 0 g.'];
  return [];
}

/** Controlla nome e valori di un alimento personale prima del salvataggio. */
export function validaAlimentoPersonale(nome: string, valori: ValoriNutrizionali): string[] {
  const errori: string[] = [];
  if (nome.trim() === '') errori.push('Il nome è obbligatorio.');
  return [...errori, ...validaValoriPer100g(valori)];
}

/** Controlla l'obiettivo giornaliero di kcal. */
export function validaObiettivoKcal(kcal: number): string[] {
  if (!Number.isFinite(kcal)) return ["L'obiettivo deve essere un numero."];
  if (kcal <= 0) return ["L'obiettivo deve essere maggiore di 0 kcal."];
  if (kcal > 10000) return ["L'obiettivo non può superare 10000 kcal."];
  return [];
}
