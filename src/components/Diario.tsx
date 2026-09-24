import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { spostaGiorni } from '../lib/date';
import { totaleVoci } from '../lib/diario';
import { etichettaGiorno, formattaData } from '../lib/formato';
import { PASTI, type Impostazioni, type Pasto, type VoceDiario } from '../lib/tipi';
import { leggiVociDelGiorno } from '../db/diario';
import { leggiImpostazioni } from '../db/impostazioni';
import { AggiungiVoce } from './AggiungiVoce';
import { ModificaVoce } from './ModificaVoce';
import { RiepilogoGiorno } from './RiepilogoGiorno';
import { SezionePasto } from './SezionePasto';

interface Props {
  data: string;
  oggi: string;
  onCambiaData: (data: string) => void;
}

/** Diario di un giorno: riepilogo, pasti e navigazione tra i giorni. */
export function Diario({ data, oggi, onCambiaData }: Props) {
  const [voci, setVoci] = useState<VoceDiario[] | null>(null);
  const [impostazioni, setImpostazioni] = useState<Impostazioni | null>(null);
  const [aggiungiA, setAggiungiA] = useState<Pasto | null>(null);
  const [inModifica, setInModifica] = useState<VoceDiario | null>(null);
  const sceltaData = useRef<HTMLInputElement>(null);
  const titolo = etichettaGiorno(data, oggi, spostaGiorni(oggi, -1));

  const carica = useCallback(async () => {
    const [vociGiorno, impostazioniSalvate] = await Promise.all([leggiVociDelGiorno(data), leggiImpostazioni()]);
    setVoci(vociGiorno);
    setImpostazioni(impostazioniSalvate);
  }, [data]);

  useEffect(() => {
    setVoci(null);
    void carica();
  }, [carica]);

  const chiudiAggiungi = useCallback(() => setAggiungiA(null), []);
  const chiudiModifica = useCallback(() => setInModifica(null), []);

  return (
    <div class="diario">
      <nav class="giorno" aria-label="Giorno">
        <button type="button" class="pulsante-icona" aria-label="Giorno precedente" onClick={() => onCambiaData(spostaGiorni(data, -1))}>
          ‹
        </button>
        <div class="giorno-titolo">
          <h1>{titolo}</h1>
          <button
            type="button"
            class="giorno-data"
            onClick={() => {
              const campo = sceltaData.current;
              if (!campo) return;
              if (typeof campo.showPicker === 'function') campo.showPicker();
              else campo.focus();
            }}
          >
            {titolo === 'Oggi' || titolo === 'Ieri' ? formattaData(data) : 'Cambia data'}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5h16v15H4zM8 3v4M16 3v4M4 10h16" />
            </svg>
          </button>
          <input
            ref={sceltaData}
            type="date"
            class="visivamente-nascosto"
            aria-label="Scegli la data"
            tabIndex={-1}
            value={data}
            max={oggi}
            onChange={(e) => e.currentTarget.value && onCambiaData(e.currentTarget.value)}
          />
        </div>
        <button
          type="button"
          class="pulsante-icona"
          aria-label="Giorno successivo"
          disabled={data >= oggi}
          onClick={() => onCambiaData(spostaGiorni(data, 1))}
        >
          ›
        </button>
      </nav>
      {data !== oggi && (
        <button type="button" class="collegamento torna-oggi" onClick={() => onCambiaData(oggi)}>
          Torna a oggi
        </button>
      )}

      {voci === null || impostazioni === null ? (
        <p class="nota">Caricamento…</p>
      ) : (
        <>
          <RiepilogoGiorno totale={totaleVoci(voci)} obiettivoKcal={impostazioni.obiettivoKcal} />
          {PASTI.map((pasto) => (
            <SezionePasto
              key={pasto}
              pasto={pasto}
              voci={voci.filter((voce) => voce.pasto === pasto)}
              onAggiungi={setAggiungiA}
              onModifica={setInModifica}
            />
          ))}
        </>
      )}

      {aggiungiA && (
        <AggiungiVoce
          data={data}
          pasto={aggiungiA}
          onChiudi={chiudiAggiungi}
          onAggiunta={() => {
            setAggiungiA(null);
            void carica();
          }}
        />
      )}
      {inModifica && (
        <ModificaVoce
          voce={inModifica}
          onChiudi={chiudiModifica}
          onModificata={() => {
            setInModifica(null);
            void carica();
          }}
        />
      )}
    </div>
  );
}
