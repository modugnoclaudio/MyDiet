import { useMemo, useState } from 'preact/hooks';
import { ALIMENTI_BASE, FONTE_ALIMENTI_BASE } from '../data/alimentiBase';
import { cercaAlimenti } from '../lib/ricerca';
import type { Alimento, AlimentoPersonale } from '../lib/tipi';
import { RigaAlimento } from './RigaAlimento';

interface Props {
  personali: readonly AlimentoPersonale[];
  /** id da non proporre (es. la ricetta che si sta modificando) */
  escludi?: string;
  onScegli: (alimento: Alimento) => void;
  onAnnulla: () => void;
}

/** Ricerca di un alimento di base o personale (es. un ingrediente di una ricetta). */
export function SceltaAlimento({ personali, escludi, onScegli, onAnnulla }: Props) {
  const [ricerca, setRicerca] = useState('');
  const disponibili = useMemo(() => personali.filter((a) => a.id !== escludi), [personali, escludi]);
  const risultati = useMemo(
    () => (ricerca.trim() ? cercaAlimenti<Alimento>([...disponibili, ...ALIMENTI_BASE], ricerca, 40) : disponibili),
    [ricerca, disponibili],
  );

  return (
    <div class="scelta-alimento">
      <input
        type="search"
        class="ricerca"
        placeholder="Es. pasta, pomodori, olio…"
        aria-label="Cerca un ingrediente"
        value={ricerca}
        autofocus
        onInput={(e) => setRicerca(e.currentTarget.value)}
      />
      {!ricerca.trim() && disponibili.length > 0 && <h3 class="sottotitolo">I tuoi alimenti</h3>}
      {ricerca.trim() && risultati.length === 0 && <p class="nota">Nessun alimento trovato.</p>}
      <ul class="elenco risultati">
        {risultati.map((alimento) => (
          <li key={alimento.id}>
            <RigaAlimento alimento={alimento} onScegli={onScegli} />
          </li>
        ))}
      </ul>
      <div class="azioni">
        <button type="button" class="pulsante-secondario" onClick={onAnnulla}>
          Indietro
        </button>
      </div>
      <p class="fonte">{FONTE_ALIMENTI_BASE}</p>
    </div>
  );
}
