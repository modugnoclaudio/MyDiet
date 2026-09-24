import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { nomeCompleto } from '../lib/alimenti';
import { formattaNumero } from '../lib/formato';
import { cercaAlimenti } from '../lib/ricerca';
import type { AlimentoPersonale } from '../lib/tipi';
import { eliminaAlimentoPersonale, elencaAlimentiPersonali } from '../db/alimenti';
import { Dialogo } from './Dialogo';
import { ModuloAlimento } from './ModuloAlimento';

/** Elenco e gestione degli alimenti creati dall'utente. */
export function AlimentiPersonali() {
  const [alimenti, setAlimenti] = useState<AlimentoPersonale[] | null>(null);
  const [ricerca, setRicerca] = useState('');
  // undefined = chiuso, null = nuovo alimento
  const [inModifica, setInModifica] = useState<AlimentoPersonale | null | undefined>(undefined);

  const carica = useCallback(async () => setAlimenti(await elencaAlimentiPersonali()), []);
  useEffect(() => {
    void carica();
  }, [carica]);

  const visibili = useMemo(
    () => (alimenti && ricerca.trim() ? cercaAlimenti(alimenti, ricerca, alimenti.length) : alimenti ?? []),
    [alimenti, ricerca],
  );
  const chiudi = useCallback(() => setInModifica(undefined), []);

  async function elimina(alimento: AlimentoPersonale) {
    if (!window.confirm(`Eliminare “${nomeCompleto(alimento)}”? Le voci del diario già inserite non cambiano.`)) return;
    await eliminaAlimentoPersonale(alimento.id);
    setInModifica(undefined);
    await carica();
  }

  return (
    <div class="alimenti">
      <h1>I tuoi alimenti</h1>
      <p class="nota">
        Alimenti inseriti da te con i valori per 100 g dell’etichetta. Nome e marca insieme li distinguono.
      </p>
      <button type="button" class="pulsante" onClick={() => setInModifica(null)}>
        + Nuovo alimento
      </button>
      {alimenti && alimenti.length > 0 && (
        <input
          type="search"
          class="ricerca"
          placeholder="Cerca tra i tuoi alimenti"
          aria-label="Cerca tra i tuoi alimenti"
          value={ricerca}
          onInput={(e) => setRicerca(e.currentTarget.value)}
        />
      )}
      {alimenti === null ? (
        <p class="nota">Caricamento…</p>
      ) : alimenti.length === 0 ? (
        <p class="nota">Non hai ancora inserito alimenti.</p>
      ) : (
        <ul class="elenco">
          {visibili.map((alimento) => (
            <li key={alimento.id}>
              <button type="button" class="riga" onClick={() => setInModifica(alimento)}>
                <span class="riga-nome">{nomeCompleto(alimento)}</span>
                <span class="riga-kcal">{formattaNumero(alimento.valori.kcal)} kcal/100 g</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {inModifica !== undefined && (
        <Dialogo titolo={inModifica ? 'Modifica alimento' : 'Nuovo alimento'} onChiudi={chiudi}>
          <ModuloAlimento
            iniziale={inModifica ?? undefined}
            onAnnulla={chiudi}
            onSalvato={() => {
              setInModifica(undefined);
              void carica();
            }}
          />
          {inModifica && (
            <>
              <p class="nota">Le modifiche valgono per i prossimi inserimenti: le voci già nel diario non cambiano.</p>
              <button type="button" class="pulsante-pericolo" onClick={() => void elimina(inModifica)}>
                Elimina alimento
              </button>
            </>
          )}
        </Dialogo>
      )}
    </div>
  );
}
