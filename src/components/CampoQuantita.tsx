import { formattaNumero } from '../lib/formato';
import { ETICHETTE_PASTI, PASTI, type Pasto, type Unita } from '../lib/tipi';
import { etichettaUnita } from '../lib/unita';

interface Props {
  quantita: string;
  /** unità scelta; `null` = grammi */
  unita: Unita | null;
  opzioni: readonly Unita[];
  pasto: Pasto;
  onQuantita: (valore: string) => void;
  onUnita: (valore: Unita | null) => void;
  onPasto: (valore: Pasto) => void;
}

/** Quantità (in grammi o in un'unità dell'alimento) e pasto di una voce del diario. */
export function CampoQuantita({ quantita, unita, opzioni, pasto, onQuantita, onUnita, onPasto }: Props) {
  const indice = unita ? opzioni.findIndex((u) => u.nome === unita.nome && u.grammi === unita.grammi) : -1;
  return (
    <>
      <div class="campi-riga">
        <label class="campo campo-quantita">
          <span>Quantità</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            autofocus
            value={quantita}
            onInput={(e) => onQuantita(e.currentTarget.value)}
          />
        </label>
        <label class="campo">
          <span>Unità</span>
          <select
            value={indice === -1 ? 'g' : String(indice)}
            onChange={(e) => {
              const valore = e.currentTarget.value;
              onUnita(valore === 'g' ? null : opzioni[Number(valore)]!);
            }}
          >
            <option value="g">grammi</option>
            {opzioni.map((u, i) => (
              <option key={`${u.nome}-${u.grammi}`} value={String(i)}>
                {etichettaUnita(u, formattaNumero)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label class="campo">
        <span>Pasto</span>
        <select value={pasto} onChange={(e) => onPasto(e.currentTarget.value as Pasto)}>
          {PASTI.map((p) => (
            <option key={p} value={p}>
              {ETICHETTE_PASTI[p]}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
