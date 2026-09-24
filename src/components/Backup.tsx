import { useEffect, useRef, useState } from 'preact/hooks';
import { backupDaFare, creaBackup, leggiBackup, nomeFileBackup, riepilogoDati, type FileBackup, type RiepilogoDati } from '../lib/backup';
import { dataISO } from '../lib/date';
import { formattaData } from '../lib/formato';
import { leggiTuttiIDati, sostituisciTuttiIDati } from '../db/backup';
import { salvaImpostazioni } from '../db/impostazioni';
import { Errori } from './Errori';

interface Props {
  oggi: string;
  onImportato: () => void;
}

interface ImportazioneDaConfermare {
  backup: FileBackup;
  nelFile: RiepilogoDati;
  attuali: RiepilogoDati;
}

function descrivi({ alimenti, voci, giorni }: RiepilogoDati): string {
  const parti = [
    alimenti === 1 ? '1 alimento personale' : `${alimenti} alimenti personali`,
    voci === 1 ? '1 voce del diario' : `${voci} voci del diario`,
  ];
  return giorni > 0 ? `${parti.join(' e ')} (${giorni === 1 ? '1 giorno' : `${giorni} giorni`})` : parti.join(' e ');
}

/** Esportazione dei dati in un file e importazione da un file di backup. */
export function Backup({ oggi, onImportato }: Props) {
  const [ultimoBackup, setUltimoBackup] = useState<string | null>(null);
  const [ciSonoDati, setCiSonoDati] = useState(false);
  const [daConfermare, setDaConfermare] = useState<ImportazioneDaConfermare | null>(null);
  const [errori, setErrori] = useState<string[]>([]);
  const [messaggio, setMessaggio] = useState('');
  const sceltaFile = useRef<HTMLInputElement>(null);

  async function aggiornaStato() {
    const dati = await leggiTuttiIDati();
    const riepilogo = riepilogoDati(dati);
    setUltimoBackup(dati.impostazioni.ultimoBackup);
    setCiSonoDati(riepilogo.alimenti + riepilogo.voci > 0);
  }

  useEffect(() => {
    void aggiornaStato();
  }, []);

  async function preparaFile(): Promise<File> {
    const contenuto = creaBackup(await leggiTuttiIDati(), new Date());
    return new File([contenuto], nomeFileBackup(oggi), { type: 'application/json' });
  }

  async function registraBackup(testo: string) {
    await salvaImpostazioni({ ultimoBackup: oggi });
    setUltimoBackup(oggi);
    setMessaggio(testo);
  }

  async function scarica() {
    reimposta();
    const file = await preparaFile();
    const url = URL.createObjectURL(file);
    const collegamento = document.createElement('a');
    collegamento.href = url;
    collegamento.download = file.name;
    document.body.append(collegamento);
    collegamento.click();
    collegamento.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    await registraBackup(`File “${file.name}” scaricato. Conservalo in un posto sicuro, per esempio su Drive o via email.`);
  }

  async function condividi() {
    reimposta();
    const file = await preparaFile();
    try {
      await navigator.share({ files: [file], title: 'Backup di MyDiet' });
      await registraBackup('Backup inviato.');
    } catch (errore) {
      if (!(errore instanceof DOMException && errore.name === 'AbortError')) {
        setErrori(['Non è stato possibile condividere il file. Prova con “Scarica il backup”.']);
      }
    }
  }

  async function fileScelto(evento: Event) {
    reimposta();
    const campo = evento.currentTarget as HTMLInputElement;
    const file = campo.files?.[0];
    campo.value = '';
    if (!file) return;
    const esito = leggiBackup(await file.text());
    if (!esito.ok) {
      setErrori(esito.errori);
      return;
    }
    setDaConfermare({
      backup: esito.backup,
      nelFile: riepilogoDati(esito.backup),
      attuali: riepilogoDati(await leggiTuttiIDati()),
    });
  }

  async function confermaImportazione() {
    if (!daConfermare) return;
    try {
      await sostituisciTuttiIDati(daConfermare.backup);
      setDaConfermare(null);
      setMessaggio('Dati importati.');
      await aggiornaStato();
      onImportato();
    } catch {
      setDaConfermare(null);
      setErrori(['Importazione non riuscita: i dati precedenti sono rimasti invariati.']);
    }
  }

  function reimposta() {
    setErrori([]);
    setMessaggio('');
  }

  const puoCondividere =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [new File([''], 'prova.json', { type: 'application/json' })] });

  return (
    <section class="backup">
      <h2>Backup</h2>
      <p>
        I dati sono salvati solo su questo dispositivo. Esporta un backup ogni tanto: ti servirà se cambi telefono o se
        il browser cancella i dati.
      </p>
      <p class="nota">Ultimo backup: {ultimoBackup ? formattaData(ultimoBackup) : 'mai'}</p>
      {backupDaFare(ultimoBackup, oggi, ciSonoDati) && (
        <p class="avviso" role="status">
          {ultimoBackup ? 'È passato più di un mese dall’ultimo backup.' : 'Non hai ancora fatto un backup.'} Ti consigliamo
          di esportare i dati.
        </p>
      )}
      <div class="azioni-colonna">
        <button type="button" class="pulsante" onClick={() => void scarica()}>
          Scarica il backup
        </button>
        {puoCondividere && (
          <button type="button" class="pulsante-secondario" onClick={() => void condividi()}>
            Invia o salva il backup…
          </button>
        )}
        <button type="button" class="pulsante-secondario" onClick={() => sceltaFile.current?.click()}>
          Importa da un file…
        </button>
        <input
          ref={sceltaFile}
          type="file"
          accept=".json,application/json"
          class="visivamente-nascosto"
          tabIndex={-1}
          aria-label="File di backup da importare"
          onChange={(e) => void fileScelto(e)}
        />
      </div>

      {daConfermare && (
        <div class="conferma-importazione" role="alertdialog" aria-label="Conferma importazione">
          <p>
            Il backup del <strong>{formattaData(dataISO(new Date(daConfermare.backup.esportato)))}</strong> contiene{' '}
            {descrivi(daConfermare.nelFile)}.
          </p>
          <p>
            <strong>Sostituirà tutti i dati attuali</strong> ({descrivi(daConfermare.attuali)}), che andranno persi.
          </p>
          <div class="azioni">
            <button type="button" class="pulsante-secondario" onClick={() => setDaConfermare(null)}>
              Annulla
            </button>
            <button type="button" class="pulsante-pericolo" onClick={() => void confermaImportazione()}>
              Sostituisci i dati
            </button>
          </div>
        </div>
      )}
      <Errori errori={errori} />
      {messaggio && (
        <p class="conferma" role="status">
          {messaggio}
        </p>
      )}
    </section>
  );
}
