import { useEffect, useMemo, useState } from 'preact/hooks';
import { ALIMENTI_BASE, FONTE_ALIMENTI_BASE } from '../data/alimentiBase';
import { nomeCompleto } from '../lib/alimenti';
import { creaVoce } from '../lib/diario';
import { formattaNumero, leggiNumero } from '../lib/formato';
import { cercaAlimenti } from '../lib/ricerca';
import type { Alimento, AlimentoPersonale, Pasto } from '../lib/tipi';
import { validaGrammi } from '../lib/validazione';
import { valoriPerGrammi } from '../lib/valori';
import { elencaAlimentiPersonali } from '../db/alimenti';
import { aggiungiVoce } from '../db/diario';
import { CampoGrammiPasto } from './CampoGrammiPasto';
import { Dialogo } from './Dialogo';
import { Errori } from './Errori';
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
  const [grammi, setGrammi] = useState('');
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
    setGrammi('');
    setErrori([]);
  }

  async function aggiungi(evento: Event) {
    evento.preventDefault();
    if (!selezionato) return;
    const quantita = leggiNumero(grammi);
    const erroriGrammi = quantita === undefined ? ['Inserisci la quantità in grammi.'] : validaGrammi(quantita);
    if (erroriGrammi.length > 0 || quantita === undefined) {
      setErrori(erroriGrammi);
      return;
    }
    try {
      await aggiungiVoce(creaVoce(selezionato, data, pasto, quantita));
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
    const quantita = leggiNumero(grammi);
    const anteprima = quantita !== undefined && validaGrammi(quantita).length === 0 ? valoriPerGrammi(selezionato.valori, quantita) : undefined;
    return (
      <Dialogo titolo="Aggiungi al diario" onChiudi={onChiudi}>
        <form class="modulo" onSubmit={aggiungi} noValidate>
          <p class="scelto">
            <strong>{nomeCompleto(selezionato)}</strong>
            <br />
            <span class="nota">{formattaNumero(selezionato.valori.kcal)} kcal per 100 g</span>
          </p>
          <CampoGrammiPasto grammi={grammi} pasto={pasto} onGrammi={setGrammi} onPasto={setPasto} />
          {anteprima && (
            <div class="anteprima">
              <p>
                <strong>{formattaNumero(anteprima.kcal)} kcal</strong>
              </p>
              <Nutrienti valori={anteprima} />
            </div>
          )}
          <Errori errori={errori} />
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
