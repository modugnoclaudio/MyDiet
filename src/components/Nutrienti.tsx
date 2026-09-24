import { formattaNumero } from '../lib/formato';
import type { ValoriNutrizionali } from '../lib/tipi';

interface Props {
  valori: ValoriNutrizionali;
}

/** Carboidrati, proteine, grassi ed eventuali fibre in grammi. */
export function Nutrienti({ valori }: Props) {
  return (
    <dl class="nutrienti">
      <div>
        <dt>Carboidrati</dt>
        <dd>{formattaNumero(valori.carboidrati, 1)} g</dd>
      </div>
      <div>
        <dt>Proteine</dt>
        <dd>{formattaNumero(valori.proteine, 1)} g</dd>
      </div>
      <div>
        <dt>Grassi</dt>
        <dd>{formattaNumero(valori.grassi, 1)} g</dd>
      </div>
      {valori.fibre !== undefined && (
        <div>
          <dt>Fibre</dt>
          <dd>{formattaNumero(valori.fibre, 1)} g</dd>
        </div>
      )}
    </dl>
  );
}
