// Parsing delle pagine delle tabelle di composizione CREA (www.alimentinutrizione.it).

export const CATEGORIE_INCLUSE: Readonly<Record<string, string>> = {
  '01': 'Cereali e derivati',
  '02': 'Legumi',
  '03': 'Verdure e ortaggi',
  '04': 'Frutta',
  '05': 'Frutta secca a guscio e semi oleaginosi',
  '06': 'Carni fresche',
  '10': 'Prodotti della pesca',
  '11': 'Latte e yogurt',
  '13': 'Uova',
  '14': 'Oli e grassi',
};

export interface VoceElenco {
  codice: string;
  nome: string;
  codiceCategoria: string;
}

export interface SchedaCrea {
  codice: string;
  nome: string;
  categoria: string;
  /** valori per 100 g di parte edibile */
  kcal: number;
  proteine: number;
  grassi: number;
  carboidrati: number;
  /** `undefined` se il dato non è disponibile */
  fibre: number | undefined;
}

function testo(html: string): string {
  const pulito = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  // Alcuni campi del sito sono racchiusi tra "| e |" con virgolette raddoppiate,
  // es. "|Tomatoes, type ""San Marzano"", fresh|"
  const citato = /^"\|(.*)\|"$/.exec(pulito);
  return citato ? citato[1]!.replace(/""/g, '"') : pulito;
}

/** Elenco degli alimenti dalla pagina "ricerca per categoria". */
export function leggiElenco(html: string): VoceElenco[] {
  const voci: VoceElenco[] = [];
  const re = /href="\/tabelle-nutrizionali\/(\d+)">([\s\S]*?)<span class="categoria">(\d*)<\/span>/g;
  for (const m of html.matchAll(re)) {
    voci.push({ codice: m[1]!, nome: testo(m[2]!), codiceCategoria: m[3]! });
  }
  return voci;
}

function campo(html: string, etichetta: string): string | undefined {
  const re = new RegExp(`<td>${etichetta}</td><td>([\\s\\S]*?)</td>`);
  const m = re.exec(html);
  return m ? testo(m[1]!) : undefined;
}

/**
 * Valore per 100 g di un nutriente. Restituisce `undefined` se il dato
 * manca, 0 per le tracce ("tr").
 */
function nutriente(html: string, nome: string): number | undefined {
  const nomeRe = nome.replace(/[()]/g, '\\$&');
  const re = new RegExp(`<td width="250">${nomeRe}</td><td>[^<]*</td><td>([\\s\\S]*?)</td>`);
  const m = re.exec(html);
  if (!m) return undefined;
  const valore = testo(m[1]!);
  if (valore === '' || valore === '-') return undefined;
  if (valore.toLowerCase() === 'tr') return 0;
  const numero = Number(valore.replace(',', '.'));
  if (!Number.isFinite(numero)) throw new Error(`Valore non numerico per ${nome}: "${valore}"`);
  return numero;
}

function obbligatorio(html: string, nome: string, codice: string): number {
  const valore = nutriente(html, nome);
  if (valore === undefined) throw new Error(`Alimento ${codice}: manca ${nome}`);
  return valore;
}

/** Legge la scheda di un alimento. */
export function leggiScheda(html: string): SchedaCrea {
  const codice = campo(html, 'Codice Alimento');
  const categoria = campo(html, 'Categoria');
  const titolo = /itemprop="name">([\s\S]*?)<meta/.exec(html);
  if (!codice || !categoria || !titolo) throw new Error('Scheda non riconosciuta');
  return {
    codice,
    nome: testo(titolo[1]!),
    categoria,
    kcal: obbligatorio(html, 'Energia (kcal)', codice),
    proteine: obbligatorio(html, 'Proteine (g)', codice),
    grassi: obbligatorio(html, 'Lipidi (g)', codice),
    carboidrati: obbligatorio(html, 'Carboidrati disponibili (g)', codice),
    fibre: nutriente(html, 'Fibra totale (g)'),
  };
}

/**
 * Legge la scheda e verifica che non contenga alcol: il modello dati
 * dell'app non lo prevede e le kcal non tornerebbero.
 */
export function leggiSchedaSenzaAlcol(html: string): SchedaCrea {
  const scheda = leggiScheda(html);
  const alcool = nutriente(html, 'Alcool (g)') ?? 0;
  if (alcool > 0) throw new Error(`Alimento ${scheda.codice}: contiene ${alcool} g di alcol`);
  return scheda;
}
