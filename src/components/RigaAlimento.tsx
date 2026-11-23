import { nomeCompleto } from '../lib/alimenti';
import { formattaNumero } from '../lib/formato';
import type { Alimento } from '../lib/tipi';

interface Props {
  alimento: Alimento;
  onScegli: (alimento: Alimento) => void;
}

/** Riga di un risultato di ricerca: nome, categoria (o "Ricetta"/"Personale") e kcal per 100 g. */
export function RigaAlimento({ alimento, onScegli }: Props) {
  const dettaglio = alimento.origine === 'base' ? alimento.categoria : alimento.ricetta ? 'Ricetta' : 'Personale';
  return (
    <button type="button" class="riga" onClick={() => onScegli(alimento)}>
      <span class="riga-nome">{nomeCompleto(alimento)}</span>
      <span class="riga-dettaglio">{dettaglio}</span>
      <span class="riga-kcal">{formattaNumero(alimento.valori.kcal)} kcal/100 g</span>
    </button>
  );
}
