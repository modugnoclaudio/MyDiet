import { useState } from 'preact/hooks';
import { formattaData, formattaNumero, leggiNumero } from '../lib/formato';
import { validaPeso } from '../lib/peso';
import { eliminaPesata, salvaPesata } from '../db/peso';
import { Dialogo } from './Dialogo';
import { Errori } from './Errori';

interface Props {
  /** giorno della pesata, `YYYY-MM-DD` */
  data: string;
  /** kg già registrati quel giorno, se c'è una pesata */
  kg?: number;
  onChiudi: () => void;
  /** dopo il salvataggio o l'eliminazione */
  onCambiato: () => void;
}

/** Registra, modifica o elimina il peso di un giorno. */
export function ModificaPeso({ data, kg, onChiudi, onCambiato }: Props) {
  const [testo, setTesto] = useState(kg === undefined ? '' : formattaNumero(kg, 2));
  const [errori, setErrori] = useState<string[]>([]);

  async function salva(evento: Event) {
    evento.preventDefault();
    const valore = leggiNumero(testo);
    const erroriPeso = valore === undefined ? ['Inserisci il peso in kg.'] : validaPeso(valore);
    if (erroriPeso.length > 0 || valore === undefined) {
      setErrori(erroriPeso);
      return;
    }
    try {
      await salvaPesata(data, valore);
      onCambiato();
    } catch {
      setErrori(['Non è stato possibile salvare. Riprova.']);
    }
  }

  async function elimina() {
    try {
      await eliminaPesata(data);
      onCambiato();
    } catch {
      setErrori(['Non è stato possibile eliminare. Riprova.']);
    }
  }

  return (
    <Dialogo titolo={kg === undefined ? 'Registra il peso' : 'Modifica il peso'} onChiudi={onChiudi}>
      <form class="modulo" onSubmit={salva} noValidate>
        <p class="nota">{formattaData(data)}</p>
        <label class="campo">
          <span>Peso (kg)</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            autofocus
            placeholder="Es. 72,4"
            value={testo}
            onInput={(e) => setTesto(e.currentTarget.value)}
          />
        </label>
        <p class="nota">Per confronti affidabili pesati sempre nelle stesse condizioni, per esempio al mattino a digiuno.</p>
        <Errori errori={errori} />
        <div class="azioni">
          <button type="button" class="pulsante-secondario" onClick={onChiudi}>
            Annulla
          </button>
          <button type="submit" class="pulsante">
            Salva
          </button>
        </div>
        {kg !== undefined && (
          <button type="button" class="pulsante-pericolo" onClick={() => void elimina()}>
            Elimina pesata
          </button>
        )}
      </form>
    </Dialogo>
  );
}
