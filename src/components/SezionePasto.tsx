import { nomeCompleto } from '../lib/alimenti';
import { totaleVoci, valoriVoce } from '../lib/diario';
import { formattaNumero } from '../lib/formato';
import { ETICHETTE_PASTI, type Pasto, type VoceDiario } from '../lib/tipi';

interface Props {
  pasto: Pasto;
  voci: VoceDiario[];
  onAggiungi: (pasto: Pasto) => void;
  onModifica: (voce: VoceDiario) => void;
}

/** Voci di un pasto con il relativo totale. */
export function SezionePasto({ pasto, voci, onAggiungi, onModifica }: Props) {
  return (
    <section class="pasto">
      <header class="pasto-testata">
        <h2>{ETICHETTE_PASTI[pasto]}</h2>
        <span class="pasto-kcal">{formattaNumero(totaleVoci(voci).kcal)} kcal</span>
      </header>
      {voci.length === 0 ? (
        <p class="nota">Nessun alimento</p>
      ) : (
        <ul class="elenco">
          {voci.map((voce) => (
            <li key={voce.id}>
              <button type="button" class="riga" onClick={() => onModifica(voce)}>
                <span class="riga-nome">{nomeCompleto(voce.alimento)}</span>
                <span class="riga-dettaglio">{formattaNumero(voce.grammi, 1)} g</span>
                <span class="riga-kcal">{formattaNumero(valoriVoce(voce).kcal)} kcal</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" class="pulsante-secondario" onClick={() => onAggiungi(pasto)}>
        + Aggiungi a {ETICHETTE_PASTI[pasto].toLowerCase()}
      </button>
    </section>
  );
}
