import { PASTI, ETICHETTE_PASTI, type Pasto } from '../lib/tipi';

interface Props {
  grammi: string;
  pasto: Pasto;
  onGrammi: (valore: string) => void;
  onPasto: (valore: Pasto) => void;
}

/** Campi per quantità in grammi e pasto di una voce del diario. */
export function CampoGrammiPasto({ grammi, pasto, onGrammi, onPasto }: Props) {
  return (
    <div class="campi-riga">
      <label class="campo">
        <span>Quantità (g)</span>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autofocus
          value={grammi}
          onInput={(e) => onGrammi(e.currentTarget.value)}
        />
      </label>
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
    </div>
  );
}
