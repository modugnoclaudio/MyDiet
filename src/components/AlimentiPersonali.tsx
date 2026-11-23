import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { nomeCompleto } from '../lib/alimenti';
import { formattaNumero } from '../lib/formato';
import { cercaAlimenti } from '../lib/ricerca';
import type { AlimentoPersonale, Ricetta } from '../lib/tipi';
import { eliminaAlimentoPersonale, elencaAlimentiPersonali } from '../db/alimenti';
import { Dialogo } from './Dialogo';
import { ModuloAlimento } from './ModuloAlimento';
import { ModuloRicetta } from './ModuloRicetta';
import { PastiPreferiti } from './PastiPreferiti';

type RicettaSalvata = AlimentoPersonale & { ricetta: Ricetta };

function eRicetta(alimento: AlimentoPersonale): alimento is RicettaSalvata {
  return alimento.ricetta !== undefined;
}

/** Elenco e gestione degli alimenti e delle ricette creati dall'utente. */
export function AlimentiPersonali() {
  const [tutti, setTutti] = useState<AlimentoPersonale[] | null>(null);
  const [ricerca, setRicerca] = useState('');
  // undefined = chiuso, null = nuovo alimento
  const [inModifica, setInModifica] = useState<AlimentoPersonale | null | undefined>(undefined);
  // undefined = chiuso, null = nuova ricetta
  const [ricettaInModifica, setRicettaInModifica] = useState<RicettaSalvata | null | undefined>(undefined);

  const carica = useCallback(async () => setTutti(await elencaAlimentiPersonali()), []);
  const alimenti = useMemo(() => tutti && tutti.filter((a) => !eRicetta(a)), [tutti]);
  const ricette = useMemo(() => (tutti ?? []).filter(eRicetta), [tutti]);
  useEffect(() => {
    void carica();
  }, [carica]);

  const visibili = useMemo(
    () => (alimenti && ricerca.trim() ? cercaAlimenti(alimenti, ricerca, alimenti.length) : alimenti ?? []),
    [alimenti, ricerca],
  );
  const chiudi = useCallback(() => setInModifica(undefined), []);
  const chiudiRicetta = useCallback(() => setRicettaInModifica(undefined), []);

  async function elimina(alimento: AlimentoPersonale) {
    if (!window.confirm(`Eliminare “${nomeCompleto(alimento)}”? Le voci del diario già inserite non cambiano.`)) return;
    await eliminaAlimentoPersonale(alimento.id);
    setInModifica(undefined);
    setRicettaInModifica(undefined);
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

      <section class="ricette">
        <h2>Le tue ricette</h2>
        <p class="nota">
          Piatti fatti in casa: indichi gli ingredienti e l’app calcola i valori per 100 g e per porzione.
        </p>
        <button type="button" class="pulsante" onClick={() => setRicettaInModifica(null)}>
          + Nuova ricetta
        </button>
        {tutti !== null && ricette.length === 0 && <p class="nota">Non hai ancora inserito ricette.</p>}
        {ricette.length > 0 && (
          <ul class="elenco">
            {ricette.map((r) => (
              <li key={r.id}>
                <button type="button" class="riga" onClick={() => setRicettaInModifica(r)}>
                  <span class="riga-nome">{r.nome}</span>
                  <span class="riga-dettaglio">
                    {r.ricetta.ingredienti.length === 1 ? '1 ingrediente' : `${r.ricetta.ingredienti.length} ingredienti`}
                    {r.ricetta.porzioni !== undefined &&
                      ` · ${r.ricetta.porzioni === 1 ? '1 porzione' : `${r.ricetta.porzioni} porzioni`}`}
                  </span>
                  <span class="riga-kcal">{formattaNumero(r.valori.kcal)} kcal/100 g</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PastiPreferiti />

      {ricettaInModifica !== undefined && (
        <Dialogo titolo={ricettaInModifica ? 'Modifica ricetta' : 'Nuova ricetta'} onChiudi={chiudiRicetta}>
          <ModuloRicetta
            iniziale={ricettaInModifica ?? undefined}
            onAnnulla={chiudiRicetta}
            onSalvato={() => {
              setRicettaInModifica(undefined);
              void carica();
            }}
          />
          {ricettaInModifica && (
            <>
              <p class="nota">Le modifiche valgono per i prossimi inserimenti: le voci già nel diario non cambiano.</p>
              <button type="button" class="pulsante-pericolo" onClick={() => void elimina(ricettaInModifica)}>
                Elimina ricetta
              </button>
            </>
          )}
        </Dialogo>
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
