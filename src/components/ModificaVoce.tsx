import { useState } from 'preact/hooks';
import { nomeCompleto } from '../lib/alimenti';
import { valoriVoce } from '../lib/diario';
import { formattaNumero, leggiNumero } from '../lib/formato';
import type { VoceDiario } from '../lib/tipi';
import { validaGrammi } from '../lib/validazione';
import { aggiornaVoce, eliminaVoce } from '../db/diario';
import { CampoGrammiPasto } from './CampoGrammiPasto';
import { Dialogo } from './Dialogo';
import { Errori } from './Errori';
import { Nutrienti } from './Nutrienti';

interface Props {
  voce: VoceDiario;
  onChiudi: () => void;
  onModificata: () => void;
}

/** Modifica di quantità e pasto di una voce del diario, o sua eliminazione. */
export function ModificaVoce({ voce, onChiudi, onModificata }: Props) {
  const [grammi, setGrammi] = useState(String(voce.grammi).replace('.', ','));
  const [pasto, setPasto] = useState(voce.pasto);
  const [errori, setErrori] = useState<string[]>([]);

  const quantita = leggiNumero(grammi);
  const valida = quantita !== undefined && validaGrammi(quantita).length === 0;
  const anteprima = valida ? valoriVoce({ ...voce, grammi: quantita }) : undefined;

  async function salva(evento: Event) {
    evento.preventDefault();
    if (quantita === undefined || !valida) {
      setErrori(quantita === undefined ? ['Inserisci la quantità in grammi.'] : validaGrammi(quantita));
      return;
    }
    try {
      await aggiornaVoce({ ...voce, grammi: quantita, pasto });
      onModificata();
    } catch {
      setErrori(['Non è stato possibile salvare. Riprova.']);
    }
  }

  async function elimina() {
    if (!window.confirm(`Eliminare “${nomeCompleto(voce.alimento)}” dal diario?`)) return;
    await eliminaVoce(voce.id);
    onModificata();
  }

  return (
    <Dialogo titolo="Modifica" onChiudi={onChiudi}>
      <form class="modulo" onSubmit={salva} noValidate>
        <p class="scelto">
          <strong>{nomeCompleto(voce.alimento)}</strong>
          <br />
          <span class="nota">{formattaNumero(voce.alimento.valori.kcal)} kcal per 100 g</span>
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
          <button type="button" class="pulsante-pericolo" onClick={() => void elimina()}>
            Elimina
          </button>
          <button type="submit" class="pulsante">
            Salva
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
