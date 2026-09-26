import { useEffect, useMemo, useState } from 'preact/hooks';
import { ALIMENTI_BASE, FONTE_ALIMENTI_BASE } from '../data/alimentiBase';
import { nomeCompleto } from '../lib/alimenti';
import { creaVoce } from '../lib/diario';
import { formattaNumero } from '../lib/formato';
import { cercaAlimenti } from '../lib/ricerca';
import type { Alimento, AlimentoPersonale, Pasto, Unita } from '../lib/tipi';
import { descriviMisura, leggiQuantita, unitaDisponibili, unitaIniziale } from '../lib/unita';
import { valoriPerGrammi } from '../lib/valori';
import { elencaAlimentiPersonali } from '../db/alimenti';
import { aggiungiVoce } from '../db/diario';
import { leggiUnitaPersonali, salvaUnitaPersonali } from '../db/unita';
import { CampoQuantita } from './CampoQuantita';
import { Dialogo } from './Dialogo';
import { Errori } from './Errori';
import { GestioneUnita } from './GestioneUnita';
import { ModuloAlimento } from './ModuloAlimento';
import { Nutrienti } from './Nutrienti';

interface Props {
  data: string;
  pasto: Pasto;
  onChiudi: () => void;
  onAggiunta: () => void;
}

/** Ricerca di un alimento e inserimento della quantità nel diario. */
export function AggiungiVoce({ data, pasto: pastoIniziale, onChiudi, onAggiunta }: Props) {
  const [personali, setPersonali] = useState<AlimentoPersonale[]>([]);
  const [ricerca, setRicerca] = useState('');
  const [selezionato, setSelezionato] = useState<Alimento | null>(null);
  const [creazione, setCreazione] = useState(false);
  const [quantita, setQuantita] = useState('');
  const [unitaPersonali, setUnitaPersonali] = useState<Unita[]>([]);
  const [unita, setUnita] = useState<Unita | null>(null);
  const [pasto, setPasto] = useState(pastoIniziale);
  const [errori, setErrori] = useState<string[]>([]);

  useEffect(() => {
    void elencaAlimentiPersonali().then(setPersonali);
  }, []);

  const risultati = useMemo(
    () => (ricerca.trim() ? cercaAlimenti<Alimento>([...personali, ...ALIMENTI_BASE], ricerca, 40) : personali),
    [ricerca, personali],
  );

  function scegli(alimento: Alimento) {
    setSelezionato(alimento);
    setQuantita('');
    setErrori([]);
    setUnitaPersonali([]);
    setUnita(unitaIniziale(unitaDisponibili(alimento, []), []));
    void leggiUnitaPersonali(alimento.id).then((personali) => {
      setUnitaPersonali(personali);
      setUnita(unitaIniziale(unitaDisponibili(alimento, personali), personali));
    });
  }

  const opzioniUnita = useMemo(
    () => (selezionato ? unitaDisponibili(selezionato, unitaPersonali) : []),
    [selezionato, unitaPersonali],
  );

  async function cambiaUnitaPersonali(nuove: Unita[]) {
    if (!selezionato) return;
    const salvate = await salvaUnitaPersonali(selezionato.id, nuove);
    setUnitaPersonali(salvate);
    const aggiunta = salvate.find((u) => !unitaPersonali.some((p) => p.nome === u.nome));
    if (aggiunta) setUnita(aggiunta);
    else if (unita && !unitaDisponibili(selezionato, salvate).some((u) => u.nome === unita.nome)) setUnita(null);
  }


  async function aggiungi(evento: Event) {
    evento.preventDefault();
    if (!selezionato) return;
    const letta = leggiQuantita(quantita, unita);
    if (letta.errori) {
      setErrori(letta.errori);
      return;
    }
    try {
      await aggiungiVoce(creaVoce(selezionato, data, pasto, letta.grammi, letta.misura));
      onAggiunta();
    } catch {
      setErrori(['Non è stato possibile salvare. Riprova.']);
    }
  }

  if (creazione) {
    return (
      <Dialogo titolo="Nuovo alimento" onChiudi={onChiudi}>
        <ModuloAlimento
          iniziale={{ nome: ricerca.trim() }}
          onAnnulla={() => setCreazione(false)}
          onSalvato={(alimento) => {
            setPersonali([...personali, alimento]);
            setCreazione(false);
            scegli(alimento);
          }}
        />
      </Dialogo>
    );
  }

  if (selezionato) {
    const letta = leggiQuantita(quantita, unita);
    const anteprima = letta.errori ? undefined : valoriPerGrammi(selezionato.valori, letta.grammi);
    return (
      <Dialogo titolo="Aggiungi al diario" onChiudi={onChiudi}>
        <form class="modulo" onSubmit={aggiungi} noValidate>
          <p class="scelto">
            <strong>{nomeCompleto(selezionato)}</strong>
            <br />
            <span class="nota">{formattaNumero(selezionato.valori.kcal)} kcal per 100 g</span>
          </p>
          <CampoQuantita
            quantita={quantita}
            unita={unita}
            opzioni={opzioniUnita}
            pasto={pasto}
            onQuantita={setQuantita}
            onUnita={setUnita}
            onPasto={setPasto}
          />
          {anteprima && !letta.errori && (
            <div class="anteprima">
              <p>
                <strong>{formattaNumero(anteprima.kcal)} kcal</strong>
                {letta.misura && (
                  <span class="nota">
                    {' '}
                    · {descriviMisura(letta.misura.quantita, letta.misura.unita, formattaNumero)} ={' '}
                    {formattaNumero(letta.grammi, 1)} g
                  </span>
                )}
              </p>
              <Nutrienti valori={anteprima} />
            </div>
          )}
          <Errori errori={errori} />
          <GestioneUnita
            unita={unitaPersonali}
            onCambia={cambiaUnitaPersonali}
            descrizione={
              selezionato.origine === 'base' && selezionato.porzione !== undefined
                ? `Nel menu Unità trovi la porzione standard CREA (${formattaNumero(selezionato.porzione, 1)} g), un valore medio di riferimento. Qui puoi aggiungere le tue unità, per esempio il peso di un pezzo che hai pesato.`
                : 'Le tue unità per questo alimento, per esempio vasetto = 125 g.'
            }
          />
          <div class="azioni">
            <button type="button" class="pulsante-secondario" onClick={() => setSelezionato(null)}>
              Indietro
            </button>
            <button type="submit" class="pulsante">
              Aggiungi
            </button>
          </div>
        </form>
      </Dialogo>
    );
  }

  return (
    <Dialogo titolo="Cerca un alimento" onChiudi={onChiudi}>
      <input
        type="search"
        class="ricerca"
        placeholder="Es. mela, pasta, yogurt…"
        aria-label="Cerca un alimento"
        value={ricerca}
        autofocus
        onInput={(e) => setRicerca(e.currentTarget.value)}
      />
      {!ricerca.trim() && personali.length > 0 && <h3 class="sottotitolo">I tuoi alimenti</h3>}
      {ricerca.trim() && risultati.length === 0 && <p class="nota">Nessun alimento trovato.</p>}
      <ul class="elenco risultati">
        {risultati.map((alimento) => (
          <li key={alimento.id}>
            <button type="button" class="riga" onClick={() => scegli(alimento)}>
              <span class="riga-nome">{nomeCompleto(alimento)}</span>
              <span class="riga-dettaglio">{alimento.origine === 'base' ? alimento.categoria : 'Personale'}</span>
              <span class="riga-kcal">{formattaNumero(alimento.valori.kcal)} kcal/100 g</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" class="pulsante-secondario" onClick={() => setCreazione(true)}>
        + Crea un nuovo alimento{ricerca.trim() ? ` “${ricerca.trim()}”` : ''}
      </button>
      <p class="fonte">{FONTE_ALIMENTI_BASE}</p>
    </Dialogo>
  );
}
