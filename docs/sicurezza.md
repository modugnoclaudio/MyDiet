# Sicurezza

MyDiet è un sito statico senza backend, senza account e senza richieste verso altri siti: i dati dell'utente restano nel browser del suo dispositivo. Le misure seguenti riducono i rischi residui.

## Nell'app

- **Content Security Policy** (`scripts/csp.ts`), inserita come `<meta>` nella build di produzione: l'app può caricare script, stili e dati solo da sé stessa. Anche se codice malevolo riuscisse a entrare nella pagina, non potrebbe caricare altri script né inviare dati altrove. Il dev server non la applica.
- **Nessun referrer** inviato ai link esterni (`<meta name="referrer" content="no-referrer">`).
- **Testi mostrati come testo**: Preact non interpreta come HTML nomi e marche inseriti dall'utente o importati da un backup.
- **Backup validati per intero** (`leggiBackup`) prima di toccare il database; l'importazione avviene in un'unica transazione.

Limite noto: GitHub Pages non permette di impostare header HTTP, quindi non si possono usare `frame-ancestors` (protezione dall'inclusione in altri siti) né altre intestazioni di sicurezza lato server.

## Nella pubblicazione (`.github/workflows/deploy.yml`)

- **Permessi minimi**: il token del workflow può solo leggere il repository; solo il job di deploy può pubblicare su Pages.
- **Azioni bloccate a un commit preciso** (SHA), così un tag spostato o compromesso non cambia ciò che viene eseguito.
- **Installazione senza script** (`npm ci --ignore-scripts`) dalle versioni bloccate in `package-lock.json`.
- **`npm audit`** sulle dipendenze dell'app: la pubblicazione si ferma in caso di vulnerabilità alte o critiche.
- **Dependabot** (`.github/dependabot.yml`) propone ogni settimana gli aggiornamenti delle dipendenze npm e ogni mese quelli delle azioni.

## A cura del proprietario del repository

- Verifica in due passaggi sull'account GitHub (Settings → Password and authentication).
- Protezione del branch `main` (Settings → Branches): modifiche solo tramite PR con i controlli superati.
- Rivedere le PR di Dependabot prima del merge, come ogni altra modifica.
- Non pubblicare su `modugnoclaudio.github.io` siti con codice di terzi: condividono con MyDiet lo stesso indirizzo e quindi l'accesso ai dati salvati nel browser. Un dominio personale eliminerebbe il problema.
- Il file di backup non è cifrato e contiene dati personali: va conservato in un posto privato.
