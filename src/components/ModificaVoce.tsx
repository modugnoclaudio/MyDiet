import { useEffect, useMemo, useState } from 'preact/hooks';
import { ALIMENTI_BASE } from '../data/alimentiBase';
import { nomeCompleto } from '../lib/alimenti';
import { valoriVoce } from '../lib/diario';
import { formattaNumero } from '../lib/formato';
import type { Unita, VoceDiario } from '../lib/tipi';
import { descriviMisura, leggiQuantita, unitaDisponibili, unitaPerModifica } from '../lib/unita';
import { aggiornaVoce, eliminaVoce } from '../db/diario';
import { leggiUnitaPersonali } from '../db/unita';
import { CampoQuantita } from './CampoQuantita';
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
  const [quantita, setQuantita] = useState(
    String(voce.misura ? voce.misura.quantita : voce.grammi).replace('.', ','),
  );
  const [unita, setUnita] = useState<Unita | null>(voce.misura?.unita ?? null);
  const [unitaPersonali, setUnitaPersonali] = useState<Unita[]>([]);
  const [pasto, setPasto] = useState(voce.pasto);
  const [errori, setErrori] = useState<string[]>([]);

  useEffect(() => {
    void leggiUnitaPersonali(voce.alimento.id).then(setUnitaPersonali);
  }, [voce.alimento.id]);

  const opzioniUnita = useMemo(() => {
    const base = ALIMENTI_BASE.find((a) => a.id === voce.alimento.id);
    const disponibili = base ? unitaDisponibili(base, unitaPersonali) : unitaPersonali;
    return unitaPerModifica(disponibili, voce.misura?.unita);
  }, [voce, unitaPersonali]);


  const letta = leggiQuantita(quantita, unita);
  const anteprima = letta.errori ? undefined : valoriVoce({ ...voce, grammi: letta.grammi });

  async function salva(evento: Event) {
    evento.preventDefault();
    if (letta.errori) {
      setErrori(letta.errori);
      return;
    }
    const aggiornata: VoceDiario = { ...voce, grammi: letta.grammi, pasto };
    if (letta.misura) aggiornata.misura = letta.misura;
    else delete aggiornata.misura;
    try {
      await aggiornaVoce(aggiornata);
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
