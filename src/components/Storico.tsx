import { useEffect, useState } from 'preact/hooks';
import { spostaGiorni } from '../lib/date';
import { totaleVoci } from '../lib/diario';
import { etichettaGiorno, formattaNumero } from '../lib/formato';
import { leggiVociDelGiorno, giorniConVoci } from '../db/diario';
import { leggiImpostazioni } from '../db/impostazioni';
import { Andamento } from './Andamento';

interface Props {
  oggi: string;
  onApriGiorno: (data: string) => void;
}

interface Giorno {
  data: string;
  kcal: number;
}

/** Elenco dei giorni con voci nel diario e relative kcal. */
export function Storico({ oggi, onApriGiorno }: Props) {
  const [giorni, setGiorni] = useState<Giorno[] | null>(null);
  const [obiettivo, setObiettivo] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const [date, impostazioni] = await Promise.all([giorniConVoci(), leggiImpostazioni()]);
      const totali = await Promise.all(
        date.map(async (data) => ({ data, kcal: totaleVoci(await leggiVociDelGiorno(data)).kcal })),
      );
      setObiettivo(impostazioni.obiettivoKcal);
      setGiorni(totali);
    })();
  }, []);

  const ieri = spostaGiorni(oggi, -1);
  return (
    <div class="storico">
      <h1>Storico</h1>
      <Andamento oggi={oggi} onApriGiorno={onApriGiorno} />
      <h2 class="titolo-sezione">Tutti i giorni</h2>
      {giorni === null ? (
        <p class="nota">Caricamento…</p>
      ) : giorni.length === 0 ? (
        <p class="nota">Il diario è ancora vuoto.</p>
      ) : (
        <ul class="elenco">
          {giorni.map(({ data, kcal }) => (
            <li key={data}>
              <button type="button" class="riga" onClick={() => onApriGiorno(data)}>
                <span class="riga-nome">{etichettaGiorno(data, oggi, ieri)}</span>
                {obiettivo !== null && (
                  <span class={`riga-dettaglio${kcal > obiettivo ? ' fuori-obiettivo' : ''}`}>
                    {kcal > obiettivo ? 'Oltre l’obiettivo' : 'Entro l’obiettivo'}
                  </span>
                )}
                <span class="riga-kcal">{formattaNumero(kcal)} kcal</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
