import { useEffect, useState } from 'preact/hooks';
import { FONTE_ALIMENTI_BASE } from '../data/alimentiBase';
import { formattaNumero, leggiNumero } from '../lib/formato';
import { validaPeso } from '../lib/peso';
import { validaObiettivoKcal } from '../lib/validazione';
import { leggiImpostazioni, salvaImpostazioni } from '../db/impostazioni';
import { Backup } from './Backup';
import { Errori } from './Errori';

interface Props {
  oggi: string;
}

/** Obiettivo giornaliero di kcal, backup e informazioni sull'app. */
export function Impostazioni({ oggi }: Props) {
  const [obiettivo, setObiettivo] = useState('');
  const [pesoObiettivo, setPesoObiettivo] = useState('');
  const [errori, setErrori] = useState<string[]>([]);
  const [messaggio, setMessaggio] = useState('');

  async function caricaObiettivo() {
    const impostazioni = await leggiImpostazioni();
    setObiettivo(impostazioni.obiettivoKcal === null ? '' : String(impostazioni.obiettivoKcal));
    setPesoObiettivo(impostazioni.pesoObiettivo === null ? '' : formattaNumero(impostazioni.pesoObiettivo, 1));
  }

  useEffect(() => {
    void caricaObiettivo();
  }, []);

  async function salva(evento: Event) {
    evento.preventDefault();
    setMessaggio('');
    const kcal = leggiNumero(obiettivo);
    const kg = leggiNumero(pesoObiettivo);
    const erroriCampi = [
      ...(kcal === undefined ? [] : validaObiettivoKcal(kcal)),
      ...(kg === undefined ? [] : validaPeso(kg, 'Il peso obiettivo')),
    ];
    if (erroriCampi.length > 0) {
      setErrori(erroriCampi);
      return;
    }
    setErrori([]);
    await salvaImpostazioni({
      obiettivoKcal: kcal === undefined ? null : Math.round(kcal),
      pesoObiettivo: kg === undefined ? null : Math.round(kg * 10) / 10,
    });
    setMessaggio('Obiettivi salvati.');
  }

  return (
    <div class="impostazioni">
      <h1>Impostazioni</h1>
      <form class="modulo" onSubmit={salva} noValidate>
        <label class="campo">
          <span>Obiettivo giornaliero (kcal)</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Es. 2000"
            value={obiettivo}
            onInput={(e) => setObiettivo(e.currentTarget.value)}
          />
        </label>
        <label class="campo">
          <span>Peso obiettivo (kg)</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Es. 68"
            value={pesoObiettivo}
            onInput={(e) => setPesoObiettivo(e.currentTarget.value)}
          />
        </label>
        <p class="nota">Facoltativi: lascia vuoto un campo per non usare quell’obiettivo. Il peso obiettivo compare nel grafico del peso, nello Storico.</p>
        <Errori errori={errori} />
        {messaggio && (
          <p class="conferma" role="status">
            {messaggio}
          </p>
        )}
        <div class="azioni">
          <button type="submit" class="pulsante">
            Salva
          </button>
        </div>
      </form>

      <Backup
        oggi={oggi}
        onImportato={() => {
          setErrori([]);
          setMessaggio('');
          void caricaObiettivo();
        }}
      />

      <section class="informazioni">
        <h2>Informazioni</h2>
        <p>I tuoi dati restano solo su questo dispositivo, nel browser: non vengono inviati a nessun server.</p>
        <p class="fonte">Valori nutrizionali degli alimenti di base. {FONTE_ALIMENTI_BASE}</p>
      </section>
    </div>
  );
}
