import { useCallback, useEffect, useState } from 'preact/hooks';
import { totaleVoci } from '../lib/diario';
import { formattaNumero } from '../lib/formato';
import type { PastoPreferito } from '../lib/tipi';
import { DatiNonValidiError } from '../db/errori';
import { eliminaPastoPreferito, elencaPastiPreferiti, salvaPastoPreferito } from '../db/pastiPreferiti';
import { Dialogo } from './Dialogo';
import { Errori } from './Errori';
import { ContenutoPasto } from './SalvaPastoPreferito';

/** Elenco dei pasti preferiti, con possibilità di rinominarli o eliminarli. */
export function PastiPreferiti() {
  const [pasti, setPasti] = useState<PastoPreferito[] | null>(null);
  const [aperto, setAperto] = useState<PastoPreferito | null>(null);
  const [nome, setNome] = useState('');
  const [errori, setErrori] = useState<string[]>([]);

  const carica = useCallback(async () => setPasti(await elencaPastiPreferiti()), []);
  useEffect(() => {
    void carica();
  }, [carica]);
  const chiudi = useCallback(() => setAperto(null), []);

  function apri(pasto: PastoPreferito) {
    setAperto(pasto);
    setNome(pasto.nome);
    setErrori([]);
  }

  async function rinomina(evento: Event) {
    evento.preventDefault();
    if (!aperto) return;
    try {
      await salvaPastoPreferito({ ...aperto, nome });
      setAperto(null);
      await carica();
    } catch (errore) {
      setErrori(errore instanceof DatiNonValidiError ? errore.errori : ['Non è stato possibile salvare. Riprova.']);
    }
  }

  async function elimina() {
    if (!aperto || !window.confirm(`Eliminare il pasto preferito “${aperto.nome}”? Le voci già nel diario non cambiano.`)) return;
    await eliminaPastoPreferito(aperto.id);
    setAperto(null);
    await carica();
  }

  return (
    <section class="pasti-preferiti">
      <h2>Pasti preferiti</h2>
      {pasti === null ? null : pasti.length === 0 ? (
        <p class="nota">
          Nessun pasto preferito. Nel diario, sotto un pasto, tocca “Salva come pasto preferito” per reinserirlo con un
          tocco.
        </p>
      ) : (
        <ul class="elenco">
          {pasti.map((pasto) => (
            <li key={pasto.id}>
              <button type="button" class="riga" onClick={() => apri(pasto)}>
                <span class="riga-nome">{pasto.nome}</span>
                <span class="riga-dettaglio">
                  {pasto.elementi.length === 1 ? '1 alimento' : `${pasto.elementi.length} alimenti`}
                </span>
                <span class="riga-kcal">{formattaNumero(totaleVoci(pasto.elementi).kcal)} kcal</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {aperto && (
        <Dialogo titolo="Pasto preferito" onChiudi={chiudi}>
          <form class="modulo" onSubmit={rinomina} noValidate>
            <label class="campo">
              <span>Nome</span>
              <input type="text" autoComplete="off" value={nome} onInput={(e) => setNome(e.currentTarget.value)} />
            </label>
            <ContenutoPasto voci={aperto.elementi} />
            <Errori errori={errori} />
            <div class="azioni">
              <button type="button" class="pulsante-pericolo" onClick={() => void elimina()}>
                Elimina
              </button>
              <button type="submit" class="pulsante">
                Salva
              </button>
            </div>
          </form>
        </Dialogo>
      )}
    </section>
  );
}
