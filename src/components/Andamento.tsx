import { useEffect, useState } from 'preact/hooks';
import {
  etichettaPeriodo,
  periodoDi,
  riepilogoPeriodo,
  spostaPeriodo,
  type Periodo,
  type RiepilogoPeriodo,
  type TipoPeriodo,
} from '../lib/andamento';
import { formattaData, formattaNumero } from '../lib/formato';
import { leggiVociTraDate } from '../db/diario';
import { leggiImpostazioni } from '../db/impostazioni';
import { GraficoKcal } from './GraficoKcal';
import { Nutrienti } from './Nutrienti';

interface Props {
  oggi: string;
  onApriGiorno: (data: string) => void;
}

/** Andamento settimanale o mensile: grafico delle kcal, medie e tabella. */
export function Andamento({ oggi, onApriGiorno }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoDi('settimana', oggi));
  const [dati, setDati] = useState<{ riepilogo: RiepilogoPeriodo; obiettivo: number | null } | null>(null);
  const [selezionato, setSelezionato] = useState<string | null>(null);

  useEffect(() => {
    let attuale = true;
    void Promise.all([leggiVociTraDate(periodo.inizio, periodo.fine), leggiImpostazioni()]).then(([voci, impostazioni]) => {
      if (!attuale) return;
      setDati({ riepilogo: riepilogoPeriodo(voci, periodo, impostazioni.obiettivoKcal), obiettivo: impostazioni.obiettivoKcal });
    });
    setSelezionato(null);
    return () => {
      attuale = false;
    };
  }, [periodo]);

  function cambiaTipo(tipo: TipoPeriodo) {
    if (tipo !== periodo.tipo) setPeriodo(periodoDi(tipo, oggi));
  }

  const riepilogo = dati?.riepilogo;
  // Nel periodo in corso i giorni futuri non vanno mostrati come "senza dati"
  const giorni = riepilogo?.giorni.filter((g) => g.data <= oggi) ?? [];
  const giornoScelto = riepilogo?.giorni.find((g) => g.data === selezionato);

  return (
    <section class="andamento" aria-label="Andamento">
      <div class="segmenti" role="group" aria-label="Periodo">
        {(['settimana', 'mese'] as const).map((tipo) => (
          <button key={tipo} type="button" aria-pressed={periodo.tipo === tipo} onClick={() => cambiaTipo(tipo)}>
            {tipo === 'settimana' ? 'Settimana' : 'Mese'}
          </button>
        ))}
      </div>

      <nav class="giorno" aria-label="Periodo precedente o successivo">
        <button type="button" class="pulsante-icona" aria-label="Periodo precedente" onClick={() => setPeriodo(spostaPeriodo(periodo, -1))}>
          ‹
        </button>
        <h2 class="giorno-titolo">{etichettaPeriodo(periodo)}</h2>
        <button
          type="button"
          class="pulsante-icona"
          aria-label="Periodo successivo"
          disabled={periodo.fine >= oggi}
          onClick={() => setPeriodo(spostaPeriodo(periodo, 1))}
        >
          ›
        </button>
      </nav>

      {!riepilogo ? (
        <p class="nota">Caricamento…</p>
      ) : riepilogo.giorniConDati === 0 ? (
        <p class="nota">Nessun alimento registrato in questo periodo.</p>
      ) : (
        <>
          <GraficoKcal
            giorni={riepilogo.giorni}
            obiettivoKcal={dati.obiettivo}
            tipo={periodo.tipo}
            selezionato={selezionato}
            onSeleziona={setSelezionato}
          />
          {dati.obiettivo !== null && (
            <p class="grafico-legenda">
              <span class="chiave entro" aria-hidden="true" /> entro l’obiettivo
              <span class="chiave oltre" aria-hidden="true" /> oltre l’obiettivo
            </p>
          )}
          <p class="grafico-dettaglio" role="status">
            {giornoScelto ? (
              <>
                <strong>{formattaData(giornoScelto.data)}</strong>:{' '}
                {giornoScelto.kcal === null ? 'nessun dato' : `${formattaNumero(giornoScelto.kcal)} kcal`}
                {giornoScelto.oltreObiettivo === true && ' · ▲ oltre l’obiettivo'}
                {giornoScelto.oltreObiettivo === false && ' · entro l’obiettivo'}{' '}
                <button type="button" class="collegamento" onClick={() => onApriGiorno(giornoScelto.data)}>
                  Apri nel diario
                </button>
              </>
            ) : (
              'Tocca una colonna per vedere il giorno.'
            )}
          </p>

          <div class="statistiche">
            <div class="statistica">
              <span class="statistica-etichetta">Media giornaliera</span>
              <span class="statistica-valore">{formattaNumero(riepilogo.media!.kcal)} kcal</span>
            </div>
            {riepilogo.giorniEntroObiettivo !== null && (
              <div class="statistica">
                <span class="statistica-etichetta">Giorni entro l’obiettivo</span>
                <span class="statistica-valore">
                  {riepilogo.giorniEntroObiettivo} su {riepilogo.giorniConDati}
                </span>
              </div>
            )}
          </div>
          <Nutrienti valori={riepilogo.media!} />
          <p class="nota">
            Medie calcolate sui {riepilogo.giorniConDati === 1 ? 'l’unico giorno' : `${riepilogo.giorniConDati} giorni`} con
            alimenti registrati.
          </p>

          <details class="tabella-andamento">
            <summary>Mostra i valori in tabella</summary>
            <table>
              <thead>
                <tr>
                  <th scope="col">Giorno</th>
                  <th scope="col">kcal</th>
                  {dati.obiettivo !== null && <th scope="col">Obiettivo</th>}
                </tr>
              </thead>
              <tbody>
                {giorni.map((g) => (
                  <tr key={g.data}>
                    <th scope="row">{formattaData(g.data)}</th>
                    <td>{g.kcal === null ? '—' : formattaNumero(g.kcal)}</td>
                    {dati.obiettivo !== null && (
                      <td>{g.oltreObiettivo === null ? '—' : g.oltreObiettivo ? '▲ oltre' : 'entro'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}
