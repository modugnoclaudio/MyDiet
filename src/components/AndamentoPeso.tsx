import { useCallback, useEffect, useState } from 'preact/hooks';
import { formattaData, formattaNumero } from '../lib/formato';
import {
  descriviDistanzaObiettivo,
  etichettaPeriodoPeso,
  formattaVariazioneKg,
  periodoPeso,
  riepilogoPeso,
  spostaPeriodoPeso,
  type PeriodoPeso,
  type RiepilogoPeso,
  type TipoPeriodoPeso,
} from '../lib/peso';
import { leggiImpostazioni } from '../db/impostazioni';
import { leggiPesata, leggiPesateTraDate } from '../db/peso';
import { GraficoPeso } from './GraficoPeso';
import { ModificaPeso } from './ModificaPeso';

interface Props {
  oggi: string;
}

const ETICHETTE_PERIODO: Readonly<Record<TipoPeriodoPeso, string>> = { mese: 'Mese', trimestre: '3 mesi', anno: 'Anno' };

/** Andamento del peso corporeo: grafico, ultimo peso, variazione nel periodo e distanza dall'obiettivo. */
export function AndamentoPeso({ oggi }: Props) {
  const [periodo, setPeriodo] = useState<PeriodoPeso>(() => periodoPeso('trimestre', oggi));
  const [dati, setDati] = useState<{ riepilogo: RiepilogoPeso; obiettivo: number | null; kgOggi?: number } | null>(null);
  const [selezionata, setSelezionata] = useState<string | null>(null);
  // giorno della pesata da registrare o modificare; null = finestra chiusa
  const [inModifica, setInModifica] = useState<string | null>(null);
  const [versione, setVersione] = useState(0);

  useEffect(() => {
    let attuale = true;
    void Promise.all([leggiPesateTraDate(periodo.inizio, periodo.fine), leggiImpostazioni(), leggiPesata(oggi)]).then(
      ([pesate, impostazioni, pesataOggi]) => {
        if (!attuale) return;
        setDati({
          riepilogo: riepilogoPeso(pesate, periodo, impostazioni.pesoObiettivo),
          obiettivo: impostazioni.pesoObiettivo,
          kgOggi: pesataOggi?.kg,
        });
      },
    );
    return () => {
      attuale = false;
    };
  }, [periodo, oggi, versione]);

  useEffect(() => setSelezionata(null), [periodo]);

  const chiudi = useCallback(() => setInModifica(null), []);

  function cambiaTipo(tipo: TipoPeriodoPeso) {
    if (tipo !== periodo.tipo) setPeriodo(periodoPeso(tipo, oggi));
  }

  const riepilogo = dati?.riepilogo;
  const scelta = riepilogo?.pesate.find((p) => p.data === selezionata);
  const kgDel = (data: string) => (data === oggi ? dati?.kgOggi : riepilogo?.pesate.find((p) => p.data === data)?.kg);

  return (
    <section class="andamento andamento-peso" aria-labelledby="titolo-peso">
      <h2 id="titolo-peso">Peso</h2>
      <div class="segmenti" role="group" aria-label="Periodo del peso">
        {(['mese', 'trimestre', 'anno'] as const).map((tipo) => (
          <button key={tipo} type="button" aria-pressed={periodo.tipo === tipo} onClick={() => cambiaTipo(tipo)}>
            {ETICHETTE_PERIODO[tipo]}
          </button>
        ))}
      </div>

      <nav class="giorno" aria-label="Periodo del peso precedente o successivo">
        <button
          type="button"
          class="pulsante-icona"
          aria-label="Periodo precedente"
          onClick={() => setPeriodo(spostaPeriodoPeso(periodo, -1))}
        >
          ‹
        </button>
        <h3 class="giorno-titolo">{etichettaPeriodoPeso(periodo)}</h3>
        <button
          type="button"
          class="pulsante-icona"
          aria-label="Periodo successivo"
          disabled={periodo.fine >= oggi}
          onClick={() => setPeriodo(spostaPeriodoPeso(periodo, 1))}
        >
          ›
        </button>
      </nav>

      {!riepilogo ? (
        <p class="nota">Caricamento…</p>
      ) : riepilogo.pesate.length === 0 ? (
        <p class="nota">Nessuna pesata in questo periodo.</p>
      ) : (
        <>
          <GraficoPeso
            pesate={riepilogo.pesate}
            periodo={periodo}
            pesoObiettivo={dati.obiettivo}
            selezionata={selezionata}
            onSeleziona={setSelezionata}
          />
          <p class="grafico-dettaglio" role="status">
            {scelta ? (
              <>
                <strong>{formattaData(scelta.data)}</strong>: {formattaNumero(scelta.kg, 2)} kg{' '}
                <button type="button" class="collegamento" onClick={() => setInModifica(scelta.data)}>
                  Modifica
                </button>
              </>
            ) : (
              'Tocca un punto per vedere la pesata.'
            )}
          </p>
          <div class="statistiche">
            <div class="statistica">
              <span class="statistica-etichetta">Ultimo peso</span>
              <span class="statistica-valore">{formattaNumero(riepilogo.ultima!.kg, 2)} kg</span>
            </div>
            {riepilogo.variazione !== null && (
              <div class="statistica">
                <span class="statistica-etichetta">Variazione nel periodo</span>
                <span class="statistica-valore">{formattaVariazioneKg(riepilogo.variazione, formattaNumero)}</span>
              </div>
            )}
          </div>
          {riepilogo.distanzaObiettivo !== null && (
            <p class="nota">
              {descriviDistanzaObiettivo(riepilogo.distanzaObiettivo, formattaNumero)} (
              {formattaNumero(dati.obiettivo!, 1)} kg).
            </p>
          )}
          {riepilogo.variazione !== null && (
            <p class="nota">Variazione tra la prima e l’ultima pesata del periodo.</p>
          )}
          <details class="tabella-andamento">
            <summary>Mostra le pesate in tabella</summary>
            <table>
              <thead>
                <tr>
                  <th scope="col">Giorno</th>
                  <th scope="col">kg</th>
                  <th scope="col">
                    <span class="visivamente-nascosto">Azioni</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...riepilogo.pesate].reverse().map((p) => (
                  <tr key={p.data}>
                    <th scope="row">{formattaData(p.data)}</th>
                    <td>{formattaNumero(p.kg, 2)}</td>
                    <td>
                      <button type="button" class="collegamento" onClick={() => setInModifica(p.data)}>
                        Modifica
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}

      <button type="button" class="pulsante-secondario" onClick={() => setInModifica(oggi)}>
        {dati?.kgOggi === undefined ? '+ Registra il peso di oggi' : 'Modifica il peso di oggi'}
      </button>

      {inModifica !== null && (
        <ModificaPeso
          data={inModifica}
          kg={kgDel(inModifica)}
          onChiudi={chiudi}
          onCambiato={() => {
            setInModifica(null);
            setSelezionata(null);
            setVersione((v) => v + 1);
          }}
        />
      )}
    </section>
  );
}
