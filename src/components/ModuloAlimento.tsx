import { useState } from 'preact/hooks';
import { FATTORI_ETICHETTA, verificaKcal } from '../lib/coerenza';
import { formattaNumero } from '../lib/formato';
import { campiDaValori, leggiCampiValori, type CampiValori } from '../lib/modulo';
import type { AlimentoPersonale } from '../lib/tipi';
import { salvaAlimentoPersonale } from '../db/alimenti';
import { AlimentoDuplicatoError, DatiNonValidiError } from '../db/errori';
import { Errori } from './Errori';

interface Props {
  /** alimento da modificare, oppure solo un nome per precompilare un nuovo alimento */
  iniziale?: AlimentoPersonale | { nome: string };
  onSalvato: (alimento: AlimentoPersonale) => void;
  onAnnulla: () => void;
}

const CAMPI_VUOTI: CampiValori = { kcal: '', carboidrati: '', proteine: '', grassi: '', fibre: '' };

const ETICHETTE: Record<keyof CampiValori, string> = {
  kcal: 'Calorie (kcal)',
  carboidrati: 'Carboidrati (g)',
  proteine: 'Proteine (g)',
  grassi: 'Grassi (g)',
  fibre: 'Fibre (g, facoltative)',
};

/** Modulo per creare o modificare un alimento personale (valori per 100 g). */
export function ModuloAlimento({ iniziale, onSalvato, onAnnulla }: Props) {
  const esistente = iniziale && 'id' in iniziale ? iniziale : undefined;
  const [nome, setNome] = useState(iniziale?.nome ?? '');
  const [marca, setMarca] = useState(esistente?.marca ?? '');
  const [campi, setCampi] = useState<CampiValori>(esistente ? campiDaValori(esistente.valori) : CAMPI_VUOTI);
  const [errori, setErrori] = useState<string[]>([]);
  const [salvataggio, setSalvataggio] = useState(false);

  const lettura = leggiCampiValori(campi);
  const coerenza = lettura.valori ? verificaKcal(lettura.valori, FATTORI_ETICHETTA) : undefined;

  async function salva(evento: Event) {
    evento.preventDefault();
    if (!lettura.valori) {
      setErrori(nome.trim() === '' ? ['Il nome è obbligatorio.', ...lettura.errori] : lettura.errori);
      return;
    }
    setSalvataggio(true);
    try {
      const alimento = await salvaAlimentoPersonale({
        ...(esistente ? { id: esistente.id } : {}),
        nome,
        marca,
        valori: lettura.valori,
      });
      onSalvato(alimento);
    } catch (errore) {
      if (errore instanceof DatiNonValidiError) setErrori(errore.errori);
      else if (errore instanceof AlimentoDuplicatoError) setErrori([errore.message]);
      else setErrori(['Non è stato possibile salvare l’alimento. Riprova.']);
    } finally {
      setSalvataggio(false);
    }
  }

  return (
    <form class="modulo" onSubmit={salva} noValidate>
      <label class="campo">
        <span>Nome</span>
        <input type="text" value={nome} autofocus autoComplete="off" onInput={(e) => setNome(e.currentTarget.value)} />
      </label>
      <label class="campo">
        <span>Marca (facoltativa)</span>
        <input type="text" value={marca} autoComplete="off" onInput={(e) => setMarca(e.currentTarget.value)} />
      </label>
      <fieldset>
        <legend>Valori per 100 g</legend>
        <div class="campi-griglia">
          {(Object.keys(ETICHETTE) as (keyof CampiValori)[]).map((campo) => (
            <label class="campo" key={campo}>
              <span>{ETICHETTE[campo]}</span>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={campi[campo]}
                onInput={(e) => setCampi({ ...campi, [campo]: e.currentTarget.value })}
              />
            </label>
          ))}
        </div>
      </fieldset>
      {coerenza && !coerenza.coerente && (
        <p class="avviso" role="status">
          Le calorie non tornano con i nutrienti: dai valori inseriti risultano circa{' '}
          {formattaNumero(coerenza.kcalStimate)} kcal. Controlla l’etichetta; puoi comunque salvare.
        </p>
      )}
      <Errori errori={errori} />
      <div class="azioni">
        <button type="button" class="pulsante-secondario" onClick={onAnnulla}>
          Annulla
        </button>
        <button type="submit" class="pulsante" disabled={salvataggio}>
          Salva
        </button>
      </div>
    </form>
  );
}
