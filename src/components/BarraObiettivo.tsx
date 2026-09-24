import { formattaNumero } from '../lib/formato';
import { avanzamentoObiettivo } from '../lib/obiettivo';

interface Props {
  kcal: number;
  obiettivoKcal: number | null;
}

/** Barra di avanzamento delle kcal del giorno rispetto all'obiettivo. */
export function BarraObiettivo({ kcal, obiettivoKcal }: Props) {
  const avanzamento = avanzamentoObiettivo(kcal, obiettivoKcal);
  if (!avanzamento || obiettivoKcal === null) {
    return <p class="nota">Imposta un obiettivo giornaliero nelle Impostazioni per vedere la barra di avanzamento.</p>;
  }
  return (
    <div class={`obiettivo${avanzamento.superato ? ' superato' : ''}`}>
      <div
        class="barra"
        role="progressbar"
        aria-label="Kcal rispetto all'obiettivo"
        aria-valuemin={0}
        aria-valuemax={obiettivoKcal}
        aria-valuenow={Math.round(kcal)}
      >
        <div class="barra-riempimento" style={{ width: `${avanzamento.percentualeBarra}%` }} />
      </div>
      <p class="obiettivo-testo">
        <span>
          {formattaNumero(kcal)} / {formattaNumero(obiettivoKcal)} kcal ({formattaNumero(avanzamento.percentuale)}%)
        </span>
        <span>
          {avanzamento.superato
            ? `Superato di ${formattaNumero(avanzamento.eccedenza)} kcal`
            : `Restano ${formattaNumero(avanzamento.rimanenti)} kcal`}
        </span>
      </p>
    </div>
  );
}
