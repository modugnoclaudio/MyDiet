import { totaleVoci } from './diario';
import type { ElementoPasto, Ricetta, ValoriNutrizionali } from './tipi';
import { validaGrammi, validaValoriPer100g } from './validazione';

export const PESO_FINALE_MASSIMO = 50000;
export const PORZIONI_MASSIME = 50;

/** Somma dei grammi degli ingredienti. */
export function pesoIngredienti(ingredienti: readonly Pick<ElementoPasto, 'grammi'>[]): number {
  return ingredienti.reduce((somma, ingrediente) => somma + ingrediente.grammi, 0);
}

/** Peso del piatto finito: quello indicato o, se assente, la somma degli ingredienti. */
export function pesoRicetta(ricetta: Ricetta): number {
  return ricetta.pesoFinale ?? pesoIngredienti(ricetta.ingredienti);
}

/**
 * Valori per 100 g del piatto finito. Le fibre sono indicate solo se lo sono
 * per tutti gli ingredienti: un totale parziale le sottostimerebbe.
 */
export function valoriRicetta(ricetta: Ricetta): ValoriNutrizionali {
  const totale = totaleVoci(ricetta.ingredienti);
  const peso = pesoRicetta(ricetta);
  const fattore = peso > 0 ? 100 / peso : 0;
  const fibreComplete = ricetta.ingredienti.length > 0 && ricetta.ingredienti.every((i) => i.alimento.valori.fibre !== undefined);
  return {
    kcal: totale.kcal * fattore,
    carboidrati: totale.carboidrati * fattore,
    proteine: totale.proteine * fattore,
    grassi: totale.grassi * fattore,
    ...(fibreComplete ? { fibre: (totale.fibre ?? 0) * fattore } : {}),
  };
}

/** Grammi di una porzione, se la ricetta indica le porzioni. */
export function grammiPorzione(ricetta: Ricetta): number | undefined {
  return ricetta.porzioni === undefined ? undefined : pesoRicetta(ricetta) / ricetta.porzioni;
}

/** Controlla nome, ingredienti, peso finale e porzioni di una ricetta. */
export function validaRicetta(nome: string, ricetta: Ricetta): string[] {
  const errori: string[] = [];
  if (nome.trim() === '') errori.push('Il nome è obbligatorio.');
  if (ricetta.ingredienti.length === 0) errori.push('Aggiungi almeno un ingrediente.');
  if (ricetta.ingredienti.some((i) => validaGrammi(i.grammi).length > 0)) {
    errori.push('La quantità di ogni ingrediente deve essere maggiore di 0 g.');
  }
  const { pesoFinale, porzioni } = ricetta;
  if (pesoFinale !== undefined) {
    if (!Number.isFinite(pesoFinale)) errori.push('Il peso del piatto finito deve essere un numero.');
    else if (pesoFinale <= 0) errori.push('Il peso del piatto finito deve essere maggiore di 0 g.');
    else if (pesoFinale > PESO_FINALE_MASSIMO) {
      errori.push(`Il peso del piatto finito non può superare ${PESO_FINALE_MASSIMO / 1000} kg.`);
    }
  }
  if (porzioni !== undefined && (!Number.isInteger(porzioni) || porzioni < 1 || porzioni > PORZIONI_MASSIME)) {
    errori.push(`Le porzioni devono essere un numero intero da 1 a ${PORZIONI_MASSIME}.`);
  }
  if (errori.length === 0 && validaValoriPer100g(valoriRicetta(ricetta)).length > 0) {
    errori.push('Il peso del piatto finito è troppo basso rispetto agli ingredienti.');
  }
  return errori;
}
