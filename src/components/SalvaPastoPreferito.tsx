import { useState } from 'preact/hooks';
import { nomeCompleto } from '../lib/alimenti';
import { totaleVoci, valoriVoce } from '../lib/diario';
import { formattaNumero } from '../lib/formato';
import { elementiDaVoci } from '../lib/preferiti';
import { ETICHETTE_PASTI, type Pasto, type VoceDiario } from '../lib/tipi';
import { descriviMisura } from '../lib/unita';
import { DatiNonValidiError } from '../db/errori';
import { salvaPastoPreferito } from '../db/pastiPreferiti';
import { Dialogo } from './Dialogo';
import { Errori } from './Errori';

interface Props {
  pasto: Pasto;
  voci: VoceDiario[];
  onChiudi: () => void;
  onSalvato: (nome: string) => void;
}

/** Salva le voci di un pasto del diario come pasto preferito, con un nome. */
export function SalvaPastoPreferito({ pasto, voci, onChiudi, onSalvato }: Props) {
  const [nome, setNome] = useState(`${ETICHETTE_PASTI[pasto]} tipo`);
  const [errori, setErrori] = useState<string[]>([]);

  async function salva(evento: Event) {
    evento.preventDefault();
    try {
      const salvato = await salvaPastoPreferito({ nome, elementi: elementiDaVoci(voci) });
      onSalvato(salvato.nome);
    } catch (errore) {
      setErrori(errore instanceof DatiNonValidiError ? errore.errori : ['Non è stato possibile salvare. Riprova.']);
    }
  }

  return (
    <Dialogo titolo="Salva come pasto preferito" onChiudi={onChiudi}>
      <form class="modulo" onSubmit={salva} noValidate>
        <label class="campo">
          <span>Nome</span>
          <input type="text" autoComplete="off" autofocus value={nome} onInput={(e) => setNome(e.currentTarget.value)} />
        </label>
        <ContenutoPasto voci={voci} />
        <p class="nota">Lo ritroverai in cima quando aggiungi un alimento: un tocco e le voci vengono inserite tutte.</p>
        <Errori errori={errori} />
        <div class="azioni">
          <button type="button" class="pulsante-secondario" onClick={onChiudi}>
            Annulla
          </button>
          <button type="submit" class="pulsante">
            Salva
          </button>
        </div>
      </form>
    </Dialogo>
  );
}

/** Elenco degli alimenti di un pasto con quantità e kcal. */
export function ContenutoPasto({ voci }: { voci: readonly Pick<VoceDiario, 'grammi' | 'misura' | 'alimento'>[] }) {
  return (
    <div>
      <ul class="elenco">
        {voci.map((voce, i) => (
          <li key={i} class="riga statica">
            <span class="riga-nome">{nomeCompleto(voce.alimento)}</span>
            <span class="riga-dettaglio">
              {voce.misura
                ? `${descriviMisura(voce.misura.quantita, voce.misura.unita, formattaNumero)} · ${formattaNumero(voce.grammi, 1)} g`
                : `${formattaNumero(voce.grammi, 1)} g`}
            </span>
            <span class="riga-kcal">{formattaNumero(valoriVoce(voce).kcal)} kcal</span>
          </li>
        ))}
      </ul>
      <p class="totale-pasto">Totale: {formattaNumero(totaleVoci(voci).kcal)} kcal</p>
    </div>
  );
}
