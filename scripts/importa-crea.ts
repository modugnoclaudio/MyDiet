// Scarica dalle tabelle CREA gli alimenti delle categorie incluse e genera
// src/data/alimenti-crea.json. Uso: npm run dati:crea
import { writeFile } from 'node:fs/promises';
import { CATEGORIE_INCLUSE, leggiElenco, leggiSchedaSenzaAlcol, type SchedaCrea } from './crea.ts';

const BASE = 'https://www.alimentinutrizione.it';
const DESTINAZIONE = new URL('../src/data/alimenti-crea.json', import.meta.url);
const RICHIESTE_PARALLELE = 3;

async function scarica(percorso: string): Promise<string> {
  for (let tentativo = 1; ; tentativo++) {
    try {
      const risposta = await fetch(BASE + percorso);
      if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
      return await risposta.text();
    } catch (errore) {
      if (tentativo >= 3) throw new Error(`${percorso}: ${String(errore)}`, { cause: errore });
      await new Promise((r) => setTimeout(r, 2000 * tentativo));
    }
  }
}

const elenco = leggiElenco(await scarica('/tabelle-nutrizionali/ricerca-per-categoria')).filter(
  (voce) => voce.codiceCategoria in CATEGORIE_INCLUSE,
);
console.log(`Alimenti da scaricare: ${elenco.length}`);

const schede: SchedaCrea[] = [];
let prossimo = 0;
async function lavora(): Promise<void> {
  while (prossimo < elenco.length) {
    const voce = elenco[prossimo++]!;
    const scheda = leggiSchedaSenzaAlcol(await scarica(`/tabelle-nutrizionali/${voce.codice}`));
    if (scheda.categoria !== CATEGORIE_INCLUSE[voce.codiceCategoria]) {
      throw new Error(`Alimento ${voce.codice}: categoria "${scheda.categoria}" inattesa`);
    }
    schede.push(scheda);
    if (schede.length % 50 === 0) console.log(`  ${schede.length}/${elenco.length}`);
  }
}
await Promise.all(Array.from({ length: RICHIESTE_PARALLELE }, lavora));

schede.sort((a, b) => a.codice.localeCompare(b.codice));
const dati = {
  fonte: 'CREA Centro di ricerca Alimenti e Nutrizione – Tabelle di composizione degli alimenti',
  url: 'https://www.alimentinutrizione.it',
  estratto: new Date().toISOString().slice(0, 10),
  alimenti: schede,
};
// Un alimento per riga: file compatto ma con diff leggibili.
const righe = schede.map((scheda) => '    ' + JSON.stringify(scheda));
const json =
  '{\n' +
  `  "fonte": ${JSON.stringify(dati.fonte)},\n` +
  `  "url": ${JSON.stringify(dati.url)},\n` +
  `  "estratto": ${JSON.stringify(dati.estratto)},\n` +
  '  "alimenti": [\n' +
  righe.join(',\n') +
  '\n  ]\n}\n';
await writeFile(DESTINAZIONE, json);
console.log(`Scritti ${schede.length} alimenti in src/data/alimenti-crea.json`);
