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
docs/             # documentazione (es. verifica dei dati CREA)
public/           # asset statici (icone)
```

## Funzionalità previste

Un solo utente per dispositivo, niente account.

- **Alimenti di base**: tabella statica di alimenti comuni e uguali per tutti in `src/data/`, inclusa nell'app e non modificabile dall'utente. Fonte: tabelle di composizione **CREA** (alimentinutrizione.it), che si possono riprodurre solo **citando la fonte**: l'app deve mostrare *"Fonte: CREA Centro di ricerca Alimenti e Nutrizione – www.alimentinutrizione.it"*. Categorie CREA incluse: Frutta, Verdure e ortaggi, Legumi, Frutta secca a guscio e semi oleaginosi, Cereali e derivati, Carni fresche, Prodotti della pesca, Uova, Latte e yogurt, Oli e grassi (crudi e cotti). I prodotti che variano per marca (dolci, formaggi, salumi…) li inserisce l'utente.
- **Veridicità dei dati**: ogni alimento di base deve superare il controllo di coerenza delle kcal (`verificaKcal` con `FATTORI_CREA`, metodo di Southgate); discrepanze con i dati USDA vanno segnalate, non corrette a mano. Il file JSON si rigenera solo con `npm run dati:crea`, mai a mano; l'ultima verifica è in `docs/verifica-dati-crea.md`.
- **Alimenti personali**: creati dall'utente e salvati in IndexedDB, con **nome** e **marca** (facoltativa). Nome + marca identificano l'alimento: due yogurt di marche diverse sono due alimenti distinti.
- **Valori nutrizionali per 100 g**: kcal, carboidrati, proteine e grassi obbligatori; fibre facoltative (assenti ≠ 0). All'inserimento di un alimento personale l'app avvisa se le kcal non tornano con i nutrienti (`verificaKcal` con `FATTORI_ETICHETTA`).
- **Diario giornaliero**: ogni voce ha data (`YYYY-MM-DD`), pasto (colazione, pranzo, cena, spuntino), alimento e grammi (solo grammi, niente porzioni). La voce salva una copia di nome, marca e valori dell'alimento, così modificare un alimento non altera lo storico.
- **Totali**: kcal e macronutrienti per pasto e per giorno, calcolati in `src/lib/`.
- **Obiettivo giornaliero di kcal** impostabile dall'utente, con barra di avanzamento.
- **Storico**: consultazione dei giorni precedenti.
- **Backup**: esportazione di tutti i dati (alimenti personali, diario, impostazioni) in un file e importazione dello stesso file, per cambio dispositivo o cancellazione dei dati del browser.

Il modello dati è in `src/lib/tipi.ts`.

## Convenzioni

- **Logica di calcolo in `src/lib/`** come **funzioni pure** (niente DOM, niente IndexedDB, niente stato globale, niente `Date.now()` implicito: le date si passano come parametro). Ogni funzione in `src/lib/` è **sempre coperta da test** in un file `*.test.ts` accanto (es. `arrotonda.ts` → `arrotonda.test.ts`). Nessuna nuova funzione di calcolo senza test.
- **Componenti UI in `src/components/`**, uno per file, con nome in PascalCase ed export nominale. I componenti non contengono logica di calcolo: la importano da `src/lib/`.
- **Persistenza** solo tramite i moduli in `src/db/` (`alimenti.ts`, `diario.ts`, `impostazioni.ts`); i componenti non usano direttamente le API di IndexedDB. I moduli validano i dati con le funzioni di `src/lib/validazione.ts` e lanciano `DatiNonValidiError` / `AlimentoDuplicatoError` (`src/db/errori.ts`) con messaggi in italiano da mostrare all'utente. Ogni modifica allo schema incrementa `DB_VERSION` e aggiunge una migrazione in `upgrade` (`if (oldVersion < N)`), con un test di migrazione. I test di `src/db/` usano `fake-indexeddb` tramite `databaseVuoto()` in `src/db/test-utils.ts`.
- **Testi dell'interfaccia in italiano** (etichette, messaggi, errori mostrati all'utente, manifest della PWA).
- In Preact usare `class` (non `className`) negli attributi JSX.
- Percorsi relativi al `base` di Vite: in produzione l'app è servita da `/MyDiet/` (vedi `vite.config.ts`, variabile `GITHUB_PAGES`), quindi niente URL assoluti hardcoded che iniziano con `/`.
