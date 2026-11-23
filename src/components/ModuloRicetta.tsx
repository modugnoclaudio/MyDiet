import { useEffect, useMemo, useState } from 'preact/hooks';
import { ALIMENTI_BASE } from '../data/alimentiBase';
import { nomeCompleto } from '../lib/alimenti';
import { creaElemento, totaleVoci, valoriVoce } from '../lib/diario';
import { formattaNumero, leggiNumero } from '../lib/formato';
import { grammiPorzione, pesoIngredienti, valoriRicetta } from '../lib/ricette';
import type { Alimento, AlimentoPersonale, ElementoPasto, Ricetta, Unita } from '../lib/tipi';
import { valoriPerGrammi } from '../lib/valori';
import { descriviMisura, leggiQuantita, unitaDisponibili, unitaIniziale, unitaPerModifica } from '../lib/unita';
import { elencaAlimentiPersonali, salvaRicetta } from '../db/alimenti';
import { AlimentoDuplicatoError, DatiNonValidiError } from '../db/errori';
import { leggiUnitaPersonali } from '../db/unita';
import { CampoQuantita } from './CampoQuantita';
import { Errori } from './Errori';
import { Nutrienti } from './Nutrienti';
import { SceltaAlimento } from './SceltaAlimento';

interface Props {
  /** ricetta da modificare; assente per una nuova ricetta */
  iniziale?: AlimentoPersonale & { ricetta: Ricetta };
  onSalvato: (ricetta: AlimentoPersonale) => void;
  onAnnulla: () => void;
}

/** Ingrediente da aggiungere (indice assente) o da modificare. */
interface InModifica {
  indice?: number;
  alimento: ElementoPasto['alimento'];
  /** alimento completo, se esiste ancora: serve per le unità CREA e della ricetta */
  completo?: Alimento;
  opzioni: Unita[];
  quantita: string;
  unita: Unita | null;
}

function testoNumero(n: number | undefined): string {
  return n === undefined ? '' : String(n).replace('.', ',');
}

/** Modulo per creare o modificare una ricetta: ingredienti, peso del piatto finito e porzioni. */
export function ModuloRicetta({ iniziale, onSalvato, onAnnulla }: Props) {
  const [nome, setNome] = useState(iniziale?.nome ?? '');
  const [ingredienti, setIngredienti] = useState<ElementoPasto[]>(iniziale?.ricetta.ingredienti ?? []);
  const [pesoFinale, setPesoFinale] = useState(testoNumero(iniziale?.ricetta.pesoFinale));
  const [porzioni, setPorzioni] = useState(testoNumero(iniziale?.ricetta.porzioni));
  const [personali, setPersonali] = useState<AlimentoPersonale[]>([]);
  const [scelta, setScelta] = useState(false);
  const [inModifica, setInModifica] = useState<InModifica | null>(null);
  const [errori, setErrori] = useState<string[]>([]);
  const [salvataggio, setSalvataggio] = useState(false);

  useEffect(() => {
    void elencaAlimentiPersonali().then(setPersonali);
  }, []);

  const perId = useMemo(() => new Map<string, Alimento>([...ALIMENTI_BASE, ...personali].map((a) => [a.id, a])), [personali]);

  const ricetta: Ricetta = useMemo(() => {
    const peso = leggiNumero(pesoFinale);
    const n = leggiNumero(porzioni);
    return {
      ingredienti,
      ...(peso === undefined ? {} : { pesoFinale: peso }),
      ...(n === undefined ? {} : { porzioni: n }),
    };
  }, [ingredienti, pesoFinale, porzioni]);

  /** Apre la quantità di un ingrediente, con le unità dell'alimento (utente, CREA, ricetta). */
  async function apriQuantita(alimento: ElementoPasto['alimento'], completo: Alimento | undefined, indice?: number) {
    const esistente = indice === undefined ? undefined : ingredienti[indice];
    const unitaUtente = await leggiUnitaPersonali(alimento.id);
    const disponibili = completo ? unitaDisponibili(completo, unitaUtente) : unitaUtente;
    const opzioni = unitaPerModifica(disponibili, esistente?.misura?.unita);
    setScelta(false);
    setErrori([]);
    setInModifica({
      indice,
      alimento,
      completo,
      opzioni,
      quantita: esistente ? testoNumero(esistente.misura ? esistente.misura.quantita : esistente.grammi) : '',
      unita: esistente ? (esistente.misura?.unita ?? null) : unitaIniziale(disponibili, unitaUtente, completo),
    });
  }

  function confermaIngrediente(evento: Event) {
    evento.preventDefault();
    if (!inModifica) return;
    const letta = leggiQuantita(inModifica.quantita, inModifica.unita);
    if (letta.errori) {
      setErrori(letta.errori);
      return;
    }
    // Un ingrediente nuovo copia i valori attuali dell'alimento; uno modificato mantiene la sua copia.
    const elemento: ElementoPasto =
      inModifica.indice === undefined && inModifica.completo
        ? creaElemento(inModifica.completo, letta.grammi, letta.misura)
        : { grammi: letta.grammi, ...(letta.misura ? { misura: letta.misura } : {}), alimento: inModifica.alimento };
    setIngredienti(
      inModifica.indice === undefined
        ? [...ingredienti, elemento]
        : ingredienti.map((ingrediente, i) => (i === inModifica.indice ? elemento : ingrediente)),
    );
    setInModifica(null);
    setErrori([]);
  }

  async function salva(evento: Event) {
    evento.preventDefault();
    setSalvataggio(true);
    try {
      onSalvato(await salvaRicetta({ ...(iniziale ? { id: iniziale.id } : {}), nome, ricetta }));
    } catch (errore) {
      if (errore instanceof DatiNonValidiError) setErrori(errore.errori);
      else if (errore instanceof AlimentoDuplicatoError) setErrori(['Esiste già un alimento o una ricetta con questo nome.']);
      else setErrori(['Non è stato possibile salvare la ricetta. Riprova.']);
    } finally {
      setSalvataggio(false);
    }
  }

  if (scelta) {
    return (
      <SceltaAlimento
        personali={personali}
        escludi={iniziale?.id}
        onScegli={(alimento) => void apriQuantita(creaElemento(alimento, 0).alimento, alimento)}
        onAnnulla={() => setScelta(false)}
      />
    );
  }

  if (inModifica) {
    const letta = leggiQuantita(inModifica.quantita, inModifica.unita);
    const kcal = letta.errori ? undefined : valoriVoce({ grammi: letta.grammi, alimento: inModifica.alimento }).kcal;
    return (
      <form class="modulo" onSubmit={confermaIngrediente} noValidate>
        <p class="scelto">
          <strong>{nomeCompleto(inModifica.alimento)}</strong>
          <br />
          <span class="nota">{formattaNumero(inModifica.alimento.valori.kcal)} kcal per 100 g</span>
        </p>
        <CampoQuantita
          quantita={inModifica.quantita}
          unita={inModifica.unita}
          opzioni={inModifica.opzioni}
          onQuantita={(quantita) => setInModifica({ ...inModifica, quantita })}
          onUnita={(unita) => setInModifica({ ...inModifica, unita })}
        />
        {kcal !== undefined && (
          <p class="anteprima">
            <strong>{formattaNumero(kcal)} kcal</strong>
            {!letta.errori && letta.misura && <span class="nota"> · {formattaNumero(letta.grammi, 1)} g</span>}
          </p>
        )}
        <Errori errori={errori} />
        <div class="azioni">
          <button
            type="button"
            class="pulsante-secondario"
            onClick={() => {
              setInModifica(null);
              setErrori([]);
            }}
          >
            Indietro
          </button>
          <button type="submit" class="pulsante">
            {inModifica.indice === undefined ? 'Aggiungi' : 'Conferma'}
          </button>
        </div>
      </form>
    );
  }

  const somma = pesoIngredienti(ingredienti);
  const totale = totaleVoci(ingredienti);
  const per100 = valoriRicetta(ricetta);
  const porzione = grammiPorzione(ricetta);
  const anteprimaValida =
    ingredienti.length > 0 &&
    Number.isFinite(per100.kcal) &&
    (ricetta.pesoFinale === undefined || ricetta.pesoFinale > 0) &&
    (ricetta.porzioni === undefined || (Number.isInteger(ricetta.porzioni) && ricetta.porzioni > 0));

  return (
    <form class="modulo" onSubmit={salva} noValidate>
      <label class="campo">
        <span>Nome</span>
        <input
          type="text"
          value={nome}
          autofocus
          autoComplete="off"
          placeholder="Es. Lasagna della domenica"
          onInput={(e) => setNome(e.currentTarget.value)}
        />
      </label>

      <fieldset>
        <legend>Ingredienti</legend>
        {ingredienti.length === 0 ? (
          <p class="nota">Aggiungi gli ingredienti con le quantità usate per tutto il piatto.</p>
        ) : (
          <ul class="elenco">
            {ingredienti.map((ingrediente, indice) => (
              <li key={`${ingrediente.alimento.id}-${indice}`} class="riga-con-azione">
                <button
                  type="button"
                  class="riga"
                  onClick={() => void apriQuantita(ingrediente.alimento, perId.get(ingrediente.alimento.id), indice)}
                >
                  <span class="riga-nome">{nomeCompleto(ingrediente.alimento)}</span>
                  <span class="riga-dettaglio">
                    {ingrediente.misura
                      ? `${descriviMisura(ingrediente.misura.quantita, ingrediente.misura.unita, formattaNumero)} · ${formattaNumero(ingrediente.grammi, 1)} g`
                      : `${formattaNumero(ingrediente.grammi, 1)} g`}
                  </span>
                  <span class="riga-kcal">{formattaNumero(valoriVoce(ingrediente).kcal)} kcal</span>
                </button>
                <button
                  type="button"
                  class="pulsante-icona piccolo"
                  aria-label={`Togli ${nomeCompleto(ingrediente.alimento)}`}
                  onClick={() => setIngredienti(ingredienti.filter((_, i) => i !== indice))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" class="pulsante-secondario" onClick={() => setScelta(true)}>
          + Aggiungi ingrediente
        </button>
      </fieldset>

      <div class="campi-riga">
        <label class="campo">
          <span>Peso del piatto finito (g)</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder={somma > 0 ? formattaNumero(somma) : 'facoltativo'}
            value={pesoFinale}
            onInput={(e) => setPesoFinale(e.currentTarget.value)}
          />
        </label>
        <label class="campo campo-quantita">
          <span>Porzioni</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="facoltative"
            value={porzioni}
            onInput={(e) => setPorzioni(e.currentTarget.value)}
          />
        </label>
      </div>
      <p class="nota">
        Facoltativo ma consigliato: la cottura cambia il peso (la pasta assorbe acqua, il sugo si restringe). Pesa la pentola piena e
        togli il peso della pentola vuota. Se lo lasci vuoto si usa la somma degli ingredienti
        {somma > 0 ? ` (${formattaNumero(somma)} g)` : ''}.
      </p>

      {anteprimaValida && (
        <div class="anteprima">
          <p>
            <strong>{formattaNumero(totale.kcal)} kcal</strong> in tutto ·{' '}
            <strong>{formattaNumero(per100.kcal)} kcal</strong> per 100 g
            {porzione !== undefined && (
              <>
                {' '}
                · <strong>{formattaNumero(valoriPerGrammi(per100, porzione).kcal)} kcal</strong> a porzione ({formattaNumero(porzione)} g)
              </>
            )}
          </p>
          <p class="nota">Valori per 100 g:</p>
          <Nutrienti valori={per100} />
        </div>
      )}

      <p class="nota">
        Gli ingredienti salvano i valori di quando li aggiungi: se poi modifichi un alimento, la ricetta non cambia.
      </p>
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
