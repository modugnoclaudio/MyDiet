import type { AlimentoBase } from '../lib/tipi';
import dati from './alimenti-crea.json';

/** Citazione obbligatoria per riprodurre i dati CREA. */
export const FONTE_ALIMENTI_BASE = 'Fonte: CREA Centro di ricerca Alimenti e Nutrizione – www.alimentinutrizione.it';

/** Alimenti di base dalle tabelle di composizione CREA (valori per 100 g). */
export const ALIMENTI_BASE: readonly AlimentoBase[] = dati.alimenti.map((voce) => ({
  id: `crea-${voce.codice}`,
  origine: 'base',
  nome: voce.nome,
  categoria: voce.categoria,
  valori: {
    kcal: voce.kcal,
    carboidrati: voce.carboidrati,
    proteine: voce.proteine,
    grassi: voce.grassi,
    ...(voce.fibre === undefined ? {} : { fibre: voce.fibre }),
  },
}));
