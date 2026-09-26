import { creaVoce } from './diario';
import { spostaGiorni } from './date';
import { normalizzaTesto } from './ricerca';
import type { Alimento, ElementoPasto, Pasto, VoceDiario } from './tipi';

export interface UsatoSpesso {
  alimentoId: string;
  /** quante volte è stato inserito nel periodo considerato */
  volte: number;
  /** voce più recente, da cui riprendere quantità e unità */
  ultima: VoceDiario;
}

export interface OpzioniUsatiSpesso {
  /** giorni considerati, fino a `oggi` compreso */
  giorni?: number;
  limite?: number;
}

/**
 * Alimenti inseriti più spesso negli ultimi giorni. Gli inserimenti nello
 * stesso pasto contano di più (colazione propone gli alimenti della colazione).
 * La quantità proposta è quella dell'ultima volta, preferendo lo stesso pasto.
 */
export function usatiSpesso(
  voci: readonly VoceDiario[],
  pasto: Pasto,
  oggi: string,
  { giorni = 60, limite = 8 }: OpzioniUsatiSpesso = {},
): UsatoSpesso[] {
  const inizio = spostaGiorni(oggi, -(giorni - 1));
  const gruppi = new Map<string, { punti: number; volte: number; ultima: VoceDiario; ultimaStessoPasto?: VoceDiario }>();
  for (const voce of voci) {
    if (voce.data < inizio || voce.data > oggi) continue;
    const stessoPasto = voce.pasto === pasto;
    const gruppo = gruppi.get(voce.alimento.id);
    if (!gruppo) {
      gruppi.set(voce.alimento.id, {
        punti: stessoPasto ? 3 : 1,
        volte: 1,
        ultima: voce,
        ...(stessoPasto ? { ultimaStessoPasto: voce } : {}),
      });
      continue;
    }
    gruppo.punti += stessoPasto ? 3 : 1;
    gruppo.volte += 1;
    if (voce.data >= gruppo.ultima.data) gruppo.ultima = voce;
    if (stessoPasto && (!gruppo.ultimaStessoPasto || voce.data >= gruppo.ultimaStessoPasto.data)) {
      gruppo.ultimaStessoPasto = voce;
    }
  }
  return [...gruppi.entries()]
    .map(([alimentoId, g]) => ({ alimentoId, volte: g.volte, punti: g.punti, ultima: g.ultimaStessoPasto ?? g.ultima }))
    .sort(
      (a, b) =>
        b.punti - a.punti ||
        b.ultima.data.localeCompare(a.ultima.data) ||
        a.ultima.alimento.nome.localeCompare(b.ultima.alimento.nome, 'it'),
    )
    .slice(0, limite)
    .map(({ alimentoId, volte, ultima }) => ({ alimentoId, volte, ultima }));
}

/** Elementi di un pasto preferito ricavati dalle voci di un pasto del diario. */
export function elementiDaVoci(voci: readonly VoceDiario[]): ElementoPasto[] {
  return voci.map((voce) => ({
    grammi: voce.grammi,
    ...(voce.misura ? { misura: { quantita: voce.misura.quantita, unita: { ...voce.misura.unita } } } : {}),
    alimento: {
      id: voce.alimento.id,
      nome: voce.alimento.nome,
      ...(voce.alimento.marca ? { marca: voce.alimento.marca } : {}),
      valori: { ...voce.alimento.valori },
    },
  }));
}

/**
 * Voci da inserire nel diario per un pasto preferito. Se l'alimento esiste
 * ancora se ne usano i valori attuali, altrimenti quelli salvati nel pasto.
 */
export function vociDaElementi(
  elementi: readonly ElementoPasto[],
  data: string,
  pasto: Pasto,
  trovaAlimento: (id: string) => Alimento | undefined,
): Omit<VoceDiario, 'id'>[] {
  return elementi.map((elemento) => {
    const attuale = trovaAlimento(elemento.alimento.id);
    if (attuale) return creaVoce(attuale, data, pasto, elemento.grammi, elemento.misura);
    const [copia] = elementiDaVoci([{ ...elemento, id: '', data, pasto }]);
    return { data, pasto, ...copia! };
  });
}

export const LUNGHEZZA_MASSIMA_NOME_PASTO = 40;

/** Controlla il nome di un pasto preferito rispetto a quelli degli altri. */
export function validaNomePastoPreferito(nome: string, altriNomi: readonly string[]): string[] {
  const pulito = nome.trim();
  if (pulito === '') return ['Il nome è obbligatorio.'];
  if (pulito.length > LUNGHEZZA_MASSIMA_NOME_PASTO) {
    return [`Il nome può avere al massimo ${LUNGHEZZA_MASSIMA_NOME_PASTO} caratteri.`];
  }
  if (altriNomi.some((altro) => normalizzaTesto(altro) === normalizzaTesto(pulito))) {
    return [`Esiste già un pasto preferito chiamato “${pulito}”.`];
  }
  return [];
}
