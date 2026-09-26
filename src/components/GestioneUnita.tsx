import { useState } from 'preact/hooks';
import { formattaNumero, leggiNumero } from '../lib/formato';
import type { Unita } from '../lib/tipi';
import { etichettaUnita, validaUnita } from '../lib/unita';
import { Errori } from './Errori';

interface Props {
  unita: readonly Unita[];
  onCambia: (unita: Unita[]) => void | Promise<void>;
  /** testo sopra l'elenco */
  descrizione: string;
}

/** Elenco modificabile delle unità dell'utente per un alimento (es. vasetto = 125 g). */
export function GestioneUnita({ unita, onCambia, descrizione }: Props) {
  const [aperta, setAperta] = useState(false);
  const [nome, setNome] = useState('');
  const [grammi, setGrammi] = useState('');
  const [errori, setErrori] = useState<string[]>([]);

  async function aggiungi() {
    const peso = leggiNumero(grammi);
    const nuova = { nome: nome.trim().replace(/\s+/g, ' '), grammi: peso ?? Number.NaN };
    const erroriUnita = peso === undefined && nuova.nome ? ['Indica il peso dell’unità in grammi.'] : validaUnita(nuova, unita);
    if (erroriUnita.length > 0) {
      setErrori(erroriUnita);
      return;
    }
    try {
      await onCambia([...unita, nuova]);
      setNome('');
      setGrammi('');
      setErrori([]);
      setAperta(false);
    } catch {
      setErrori(['Non è stato possibile salvare l’unità. Riprova.']);
    }
  }

  return (
    <div class="gestione-unita">
      <p class="nota">{descrizione}</p>
      {unita.length > 0 && (
        <ul class="unita-elenco">
          {unita.map((u) => (
            <li key={u.nome}>
              <span>{etichettaUnita(u, formattaNumero)}</span>
              <button
                type="button"
                class="pulsante-icona piccolo"
                aria-label={`Elimina l’unità ${u.nome}`}
                onClick={() => void onCambia(unita.filter((altra) => altra !== u))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {aperta ? (
        <div class="unita-nuova">
          <div class="campi-riga">
            <label class="campo">
              <span>Nome (es. fetta, vasetto)</span>
              <input type="text" autoComplete="off" value={nome} onInput={(e) => setNome(e.currentTarget.value)} />
            </label>
            <label class="campo campo-quantita">
              <span>Peso (g)</span>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={grammi}
                onInput={(e) => setGrammi(e.currentTarget.value)}
              />
            </label>
          </div>
          <Errori errori={errori} />
          <div class="azioni">
            <button
              type="button"
              class="pulsante-secondario"
              onClick={() => {
                setAperta(false);
                setErrori([]);
              }}
            >
              Annulla
            </button>
            <button type="button" class="pulsante" onClick={() => void aggiungi()}>
              Aggiungi unità
            </button>
          </div>
        </div>
      ) : (
        <button type="button" class="collegamento" onClick={() => setAperta(true)}>
          + Aggiungi un’unità
        </button>
      )}
    </div>
  );
}
