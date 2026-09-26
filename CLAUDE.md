# MyDiet

PWA per il tracciamento alimentare: tiene traccia degli alimenti mangiati durante la giornata e calcola le relative calorie. Funziona interamente nel browser, anche offline: **non c'è backend** e tutti i dati dell'utente restano sul dispositivo, in IndexedDB.

## Stack

- **Vite** (build e dev server) + **vite-plugin-pwa** (manifest e service worker Workbox)
- **TypeScript** in modalità `strict`
- **Preact** per la UI (JSX con `jsxImportSource: preact`)
- **IndexedDB** tramite la libreria `idb` (`src/db/`)
- **Vitest** per i test, **ESLint** (typescript-eslint) per il lint
- Deploy su **GitHub Pages** tramite GitHub Actions (`.github/workflows/deploy.yml`) a ogni push su `main`; sulle PR il workflow esegue solo lint, test e build

## Comandi

| Comando | Descrizione |
| --- | --- |
| `npm install` | Installa le dipendenze |
| `npm run dev` | Avvia il dev server |
| `npm run build` | Typecheck (`tsc -b`) e build di produzione in `dist/` |
| `npm run preview` | Serve la build di produzione in locale |
| `npm test` | Esegue i test una volta (`vitest run`) |
| `npm run test:watch` | Test in modalità watch |
| `npm run lint` | ESLint su tutto il progetto |
| `npm run typecheck` | Solo typecheck |
| `npm run dati:crea` | Riscarica dalle tabelle CREA gli alimenti di base in `src/data/alimenti-crea.json` (Node ≥ 22.18) |

Prima di ogni commit devono passare `npm run lint`, `npm test` e `npm run build`.

## Struttura

```
src/
  main.tsx        # entry point: render dell'app e registrazione del service worker
  components/     # componenti UI Preact
  lib/            # logica di calcolo: funzioni pure + test *.test.ts
  db/             # accesso a IndexedDB (schema, migrazioni, lettura/scrittura)
  data/           # tabella statica degli alimenti di base (sola lettura, inclusa nel bundle)
scripts/          # script Node (es. importazione dati CREA), con test *.test.ts
docs/             # documentazione (es. verifica dei dati CREA) e immagini del README (docs/immagini/)
public/           # asset statici (icone)
```

## Funzionalità previste

Un solo utente per dispositivo, niente account.

- **Alimenti di base**: tabella statica di alimenti comuni e uguali per tutti in `src/data/`, inclusa nell'app e non modificabile dall'utente. Fonte: tabelle di composizione **CREA** (alimentinutrizione.it), che si possono riprodurre solo **citando la fonte**: l'app deve mostrare *"Fonte: CREA Centro di ricerca Alimenti e Nutrizione – www.alimentinutrizione.it"*. Categorie CREA incluse: Frutta, Verdure e ortaggi, Legumi, Frutta secca a guscio e semi oleaginosi, Cereali e derivati, Carni fresche, Prodotti della pesca, Uova, Latte e yogurt, Oli e grassi (crudi e cotti). I prodotti che variano per marca (dolci, formaggi, salumi…) li inserisce l'utente.
- **Veridicità dei dati**: ogni alimento di base deve superare il controllo di coerenza delle kcal (`verificaKcal` con `FATTORI_CREA`, metodo di Southgate); discrepanze con i dati USDA vanno segnalate, non corrette a mano. Il file JSON si rigenera solo con `npm run dati:crea`, mai a mano; l'ultima verifica è in `docs/verifica-dati-crea.md`.
- **Alimenti personali**: creati dall'utente e salvati in IndexedDB, con **nome** e **marca** (facoltativa). Nome + marca identificano l'alimento: due yogurt di marche diverse sono due alimenti distinti.
- **Valori nutrizionali per 100 g**: kcal, carboidrati, proteine e grassi obbligatori; fibre facoltative (assenti ≠ 0). All'inserimento di un alimento personale l'app avvisa se le kcal non tornano con i nutrienti (`verificaKcal` con `FATTORI_ETICHETTA`).
- **Diario giornaliero**: ogni voce ha data (`YYYY-MM-DD`), pasto (colazione, pranzo, cena, spuntino), alimento e grammi. La voce salva una copia di nome, marca e valori dell'alimento, così modificare un alimento non altera lo storico.
- **Quantità in unità** (`src/lib/unita.ts`): oltre ai grammi si può inserire una quantità in un'unità dell'alimento (es. 3 uova). I grammi restano il dato usato per tutti i calcoli; la voce salva anche `misura` (quantità e unità) per mostrarla ("3 uova · 150 g"). Unità disponibili:
  - **CREA**: la porzione standard della scheda (`porzione` in `alimenti-crea.json`), chiamata "uovo"/"albume"/"tuorlo" per le uova di gallina (porzione 50 g = albume 35 g + tuorlo 15 g) e "porzione" per tutti gli altri alimenti. Non inventare pesi di pezzi senza una fonte.
  - **dell'utente**: per qualsiasi alimento (di base o personale), es. vasetto = 125 g; salvate nello store `unita` per id dell'alimento e hanno la precedenza su quelle CREA con lo stesso nome.
- **Preferiti** (`src/lib/preferiti.ts`), per inserire con un tocco:
  - **Usati spesso**: calcolati dal diario degli ultimi 60 giorni (gli inserimenti nello stesso pasto contano di più), con la quantità dell'ultima volta; un tocco li aggiunge, la matita apre la quantità precompilata.
  - **Pasti preferiti**: l'utente salva le voci di un pasto del diario con un nome (store `pastiPreferiti`); un tocco le inserisce tutte insieme (`aggiungiVoci`, un'unica transazione) usando i valori attuali degli alimenti, o quelli salvati se l'alimento non esiste più. Si rinominano ed eliminano dalla sezione Alimenti.
- **Totali**: kcal e macronutrienti per pasto e per giorno, calcolati in `src/lib/`.
- **Obiettivo giornaliero di kcal** impostabile dall'utente, con barra di avanzamento.
- **Storico** e **andamento** (`src/lib/andamento.ts`): grafico a colonne delle kcal giornaliere per **settimana (lunedì–domenica) o mese di calendario**, con la linea dell'obiettivo e le colonne oltre l'obiettivo in un altro colore; media giornaliera e dei macronutrienti calcolata **solo sui giorni con dati**, giorni entro l'obiettivo, dettaglio del giorno al tocco (anche da tastiera), tabella dei valori; sotto, l'elenco di tutti i giorni. Grafici in SVG disegnati a mano (`GraficoKcal`), senza librerie.
- **Colori dei grafici** (`--grafico-entro` / `--grafico-oltre` in `style.css`): coppie verde/ambra verificate per il daltonismo (separazione ΔE ≥ 8 in chiaro e in scuro). L'informazione "oltre l'obiettivo" non è mai affidata solo al colore (▲ + testo nel dettaglio e nella tabella). Non usare rosso/verde per distinguere dati.
- **Backup** (Impostazioni): esportazione di tutti i dati (alimenti personali, diario, impostazioni, unità dell'utente, pasti preferiti) in un file JSON `mydiet-backup-YYYY-MM-DD.json` (scaricato o condiviso) e importazione dello stesso file, che **sostituisce** tutti i dati in un'unica transazione. Il file è letto e validato per intero da `leggiBackup` (`src/lib/backup.ts`) prima di toccare il database; se cambia la struttura dei dati, incrementare `FORMATO_BACKUP` e gestire i formati precedenti (oggi formato 3; restano importabili il formato 1, senza unità, e il 2, senza pasti preferiti). Promemoria se l'ultimo backup ha più di 30 giorni.

Il modello dati è in `src/lib/tipi.ts`.

Interfaccia (`src/components/App.tsx`): quattro sezioni nella barra in basso — **Diario** (giorno con riepilogo, barra dell'obiettivo e pasti; navigazione tra i giorni), **Storico** (giorni con voci), **Alimenti** (alimenti personali e pasti preferiti) e **Impostazioni** (obiettivo, informazioni e citazione CREA). Le finestre di inserimento usano `Dialogo`; numeri scritti dall'utente con virgola o punto si leggono con `leggiNumero` / `leggiCampiValori` e si mostrano con `formattaNumero` (formato italiano).

## Sicurezza

Dettagli in `docs/sicurezza.md`. Regole da rispettare:

- **Nessuna richiesta verso altri siti**: la Content Security Policy (`scripts/csp.ts`) permette solo `'self'`. Se una funzione richiede un servizio esterno (es. Open Food Facts), aggiungere il dominio **solo** alla direttiva necessaria (es. `connect-src`), mai `*`, `'unsafe-inline'` o `'unsafe-eval'`, e aggiornare `scripts/csp.test.ts`.
- Niente script o stili inline in `index.html`; gli stili dinamici si impostano da JSX (`style={{ ... }}`), non con stringhe.
- Mai `dangerouslySetInnerHTML` né HTML costruito da testo dell'utente.
- Nel workflow le azioni sono bloccate a uno SHA con la versione in commento; i permessi restano minimi (`contents: read`, `pages`/`id-token` solo nel job di deploy).

## Convenzioni

- **Logica di calcolo in `src/lib/`** come **funzioni pure** (niente DOM, niente IndexedDB, niente stato globale, niente `Date.now()` implicito: le date si passano come parametro). Ogni funzione in `src/lib/` è **sempre coperta da test** in un file `*.test.ts` accanto (es. `arrotonda.ts` → `arrotonda.test.ts`). Nessuna nuova funzione di calcolo senza test.
- **Componenti UI in `src/components/`**, uno per file, con nome in PascalCase ed export nominale. I componenti non contengono logica di calcolo: la importano da `src/lib/`.
- **Persistenza** solo tramite i moduli in `src/db/` (`alimenti.ts`, `diario.ts`, `impostazioni.ts`, `unita.ts`, `pastiPreferiti.ts`, `backup.ts`); i componenti non usano direttamente le API di IndexedDB. I moduli validano i dati con le funzioni di `src/lib/validazione.ts` e lanciano `DatiNonValidiError` / `AlimentoDuplicatoError` (`src/db/errori.ts`) con messaggi in italiano da mostrare all'utente. Ogni modifica allo schema incrementa `DB_VERSION` e aggiunge una migrazione in `upgrade` (`if (oldVersion < N)`), con un test di migrazione. I test di `src/db/` usano `fake-indexeddb` tramite `databaseVuoto()` in `src/db/test-utils.ts`.
- **Testi dell'interfaccia in italiano** (etichette, messaggi, errori mostrati all'utente, manifest della PWA).
- In Preact usare `class` (non `className`) negli attributi JSX.
- Percorsi relativi al `base` di Vite: in produzione l'app è servita da `/MyDiet/` (vedi `vite.config.ts`, variabile `GITHUB_PAGES`), quindi niente URL assoluti hardcoded che iniziano con `/`.
