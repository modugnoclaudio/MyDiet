import { formattaNumero } from '../lib/formato';
import type { ValoriNutrizionali } from '../lib/tipi';
import { BarraObiettivo } from './BarraObiettivo';
import { Nutrienti } from './Nutrienti';

interface Props {
  totale: ValoriNutrizionali;
  obiettivoKcal: number | null;
}

/** Totale del giorno: kcal, barra dell'obiettivo e macronutrienti. */
export function RiepilogoGiorno({ totale, obiettivoKcal }: Props) {
  return (
    <section class="riepilogo" aria-label="Totale del giorno">
      <p class="kcal-totali">
        <strong>{formattaNumero(totale.kcal)}</strong> kcal
      </p>
      <BarraObiettivo kcal={totale.kcal} obiettivoKcal={obiettivoKcal} />
      <Nutrienti valori={totale} />
    </section>
  );
}
