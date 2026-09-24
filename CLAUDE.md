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

Prima di ogni commit devono passare `npm run lint`, `npm test` e `npm run build`.

## Struttura

```
src/
  main.tsx        # entry point: render dell'app e registrazione del service worker
  components/     # componenti UI Preact
  lib/            # logica di calcolo: funzioni pure + test *.test.ts
  db/             # accesso a IndexedDB (schema, migrazioni, lettura/scrittura)
public/           # asset statici (icone)
```

## Convenzioni

- **Logica di calcolo in `src/lib/`** come **funzioni pure** (niente DOM, niente IndexedDB, niente stato globale, niente `Date.now()` implicito: le date si passano come parametro). Ogni funzione in `src/lib/` è **sempre coperta da test** in un file `*.test.ts` accanto (es. `arrotonda.ts` → `arrotonda.test.ts`). Nessuna nuova funzione di calcolo senza test.
- **Componenti UI in `src/components/`**, uno per file, con nome in PascalCase ed export nominale. I componenti non contengono logica di calcolo: la importano da `src/lib/`.
- **Persistenza** solo tramite i moduli in `src/db/`; i componenti non usano direttamente le API di IndexedDB. Ogni modifica allo schema incrementa `DB_VERSION` e aggiunge una migrazione in `upgrade`.
- **Testi dell'interfaccia in italiano** (etichette, messaggi, errori mostrati all'utente, manifest della PWA).
- In Preact usare `class` (non `className`) negli attributi JSX.
- Percorsi relativi al `base` di Vite: in produzione l'app è servita da `/MyDiet/` (vedi `vite.config.ts`, variabile `GITHUB_PAGES`), quindi niente URL assoluti hardcoded che iniziano con `/`.
