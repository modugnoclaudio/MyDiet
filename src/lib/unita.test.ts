import { describe, expect, it } from 'vitest';
import { formattaNumero } from './formato';
import type { AlimentoBase, AlimentoPersonale } from './tipi';
import {
  descriviMisura,
  etichettaUnita,
  grammiDaQuantita,
  leggiQuantita,
  unitaCrea,
  unitaDisponibili,
  unitaIniziale,
  unitaPerModifica,
  validaQuantitaUnita,
  validaUnita,
} from './unita';

const valori = { kcal: 128, carboidrati: 0, proteine: 12.4, grassi: 8.7 };
function base(nome: string, porzione?: number): AlimentoBase {
  return { id: 'b', origine: 'base', nome, categoria: 'Uova', valori, ...(porzione === undefined ? {} : { porzione }) };
}
const yogurt: AlimentoPersonale = { id: 'p', origine: 'personale', nome: 'Yogurt greco', valori };

describe('unitaCrea', () => {
  it('per le uova di gallina intere usa "uovo"', () => {
    expect(unitaCrea(base('Uova di gallina, intero', 50))).toEqual([{ nome: 'uovo', grammi: 50 }]);
    expect(unitaCrea(base('Uova di gallina, intero, cotto, a frittata o strapazzato', 50))).toEqual([
      { nome: 'uovo', grammi: 50 },
    ]);
  });

  it('per albume e tuorlo usa i loro nomi', () => {
    expect(unitaCrea(base('Uova di gallina, albume', 35))).toEqual([{ nome: 'albume', grammi: 35 }]);
    expect(unitaCrea(base('Uova di gallina, tuorlo, cotto, in camicia', 15))).toEqual([{ nome: 'tuorlo', grammi: 15 }]);
  });

  it('per gli altri alimenti, uova in polvere e di altri animali usa "porzione"', () => {
    expect(unitaCrea(base('Pasta di semola', 80))).toEqual([{ nome: 'porzione', grammi: 80 }]);
    expect(unitaCrea(base('Uova di gallina, intero, in polvere', 100))).toEqual([{ nome: 'porzione', grammi: 100 }]);
    expect(unitaCrea(base('Uova di oca, intero', 50))).toEqual([{ nome: 'porzione', grammi: 50 }]);
  });

  it('senza porzione non ha unità', () => {
    expect(unitaCrea(base('Margarina'))).toEqual([]);
  });
});

describe('unitaDisponibili', () => {
  it('mette prima le unità dell’utente, poi quelle CREA', () => {
    expect(unitaDisponibili(base('Uova di gallina, intero', 50), [{ nome: 'uovo grande', grammi: 60 }])).toEqual([
      { nome: 'uovo grande', grammi: 60 },
      { nome: 'uovo', grammi: 50 },
    ]);
  });

  it('un’unità dell’utente con lo stesso nome sostituisce quella CREA', () => {
    expect(unitaDisponibili(base('Uova di gallina, intero', 50), [{ nome: 'Uovo', grammi: 55 }])).toEqual([
      { nome: 'Uovo', grammi: 55 },
    ]);
  });

  it('per gli alimenti personali ci sono solo le unità dell’utente', () => {
    expect(unitaDisponibili(yogurt, [])).toEqual([]);
    expect(unitaDisponibili(yogurt, [{ nome: 'vasetto', grammi: 125 }])).toEqual([{ nome: 'vasetto', grammi: 125 }]);
  });
});

describe('unitaIniziale', () => {
  it('preferisce la prima unità dell’utente', () => {
    const personali = [{ nome: 'vasetto', grammi: 125 }];
    expect(unitaIniziale(personali, personali)).toEqual({ nome: 'vasetto', grammi: 125 });
  });

  it('altrimenti propone un’unità concreta come "uovo", ma non la generica "porzione"', () => {
    expect(unitaIniziale([{ nome: 'uovo', grammi: 50 }], [])).toEqual({ nome: 'uovo', grammi: 50 });
    expect(unitaIniziale([{ nome: 'porzione', grammi: 80 }], [])).toBeNull();
    expect(unitaIniziale([], [])).toBeNull();
  });
});

describe('grammiDaQuantita', () => {
  it('converte le unità in grammi', () => {
    expect(grammiDaQuantita(3, { nome: 'uovo', grammi: 50 })).toBe(150);
    expect(grammiDaQuantita(1.5, { nome: 'porzione', grammi: 80 })).toBe(120);
  });

  it('senza unità la quantità è già in grammi', () => {
    expect(grammiDaQuantita(125, null)).toBe(125);
  });
});

describe('etichettaUnita e descriviMisura', () => {
  it('mostrano l’unità con i grammi e la quantità al singolare o plurale', () => {
    expect(etichettaUnita({ nome: 'uovo', grammi: 50 }, formattaNumero)).toBe('uovo (50 g)');
    expect(etichettaUnita({ nome: 'fetta', grammi: 12.5 }, formattaNumero)).toBe('fetta (12,5 g)');
    expect(descriviMisura(1, { nome: 'uovo', grammi: 50 }, formattaNumero)).toBe('1 uovo');
    expect(descriviMisura(3, { nome: 'uovo', grammi: 50 }, formattaNumero)).toBe('3 uova');
    expect(descriviMisura(1.5, { nome: 'porzione', grammi: 80 }, formattaNumero)).toBe('1,5 porzioni');
    expect(descriviMisura(2, { nome: 'vasetto', grammi: 125 }, formattaNumero)).toBe('2 × vasetto');
  });
});

describe('validaUnita', () => {
  const esistenti = [{ nome: 'vasetto', grammi: 125 }];

  it('accetta un’unità valida', () => {
    expect(validaUnita({ nome: 'fetta', grammi: 30 }, esistenti)).toEqual([]);
  });

  it('rifiuta nomi vuoti, troppo lunghi, "grammi" e doppioni', () => {
    expect(validaUnita({ nome: ' ', grammi: 30 }, [])).toEqual(['Il nome dell’unità è obbligatorio.']);
    expect(validaUnita({ nome: 'x'.repeat(31), grammi: 30 }, [])).toEqual([
      'Il nome dell’unità può avere al massimo 30 caratteri.',
    ]);
    expect(validaUnita({ nome: 'Grammi', grammi: 1 }, [])).toEqual(['I grammi sono già disponibili: scegli un altro nome.']);
    expect(validaUnita({ nome: ' VASETTO ', grammi: 100 }, esistenti)).toEqual(['Esiste già l’unità “VASETTO”.']);
  });

  it('rifiuta pesi non validi', () => {
    expect(validaUnita({ nome: 'fetta', grammi: 0 }, [])).toEqual(['Il peso dell’unità deve essere maggiore di 0 g.']);
    expect(validaUnita({ nome: 'fetta', grammi: Number.NaN }, [])).toEqual(['Il peso dell’unità deve essere un numero.']);
    expect(validaUnita({ nome: 'fetta', grammi: 6000 }, [])).toEqual(['Il peso dell’unità non può superare 5000 g.']);
  });
});

describe('validaQuantitaUnita', () => {
  it('accetta quantità positive, anche decimali', () => {
    expect(validaQuantitaUnita(3)).toEqual([]);
    expect(validaQuantitaUnita(0.5)).toEqual([]);
  });

  it('rifiuta zero, negativi e non numeri', () => {
    expect(validaQuantitaUnita(0)).toEqual(['La quantità deve essere maggiore di 0.']);
    expect(validaQuantitaUnita(-1)).toEqual(['La quantità deve essere maggiore di 0.']);
    expect(validaQuantitaUnita(Number.NaN)).toEqual(['La quantità deve essere un numero.']);
  });
});

describe('unitaPerModifica', () => {
  const uovo = { nome: 'uovo', grammi: 50 };

  it('non ripete l’unità usata se è ancora disponibile', () => {
    expect(unitaPerModifica([uovo], { nome: 'uovo', grammi: 50 })).toEqual([uovo]);
    expect(unitaPerModifica([uovo], undefined)).toEqual([uovo]);
  });

  it('aggiunge l’unità usata se nel frattempo è stata tolta o cambiata', () => {
    expect(unitaPerModifica([uovo], { nome: 'vasetto', grammi: 125 })).toEqual([uovo, { nome: 'vasetto', grammi: 125 }]);
    expect(unitaPerModifica([uovo], { nome: 'uovo', grammi: 60 })).toEqual([uovo, { nome: 'uovo', grammi: 60 }]);
  });
});

describe('leggiQuantita', () => {
  const uovo = { nome: 'uovo', grammi: 50 };

  it('in grammi restituisce solo i grammi', () => {
    expect(leggiQuantita('125', null)).toEqual({ grammi: 125 });
    expect(leggiQuantita('12,5', null)).toEqual({ grammi: 12.5 });
  });

  it('in unità restituisce i grammi e la misura', () => {
    expect(leggiQuantita('3', uovo)).toEqual({ grammi: 150, misura: { quantita: 3, unita: uovo } });
    expect(leggiQuantita('1,5', uovo)).toEqual({ grammi: 75, misura: { quantita: 1.5, unita: uovo } });
  });

  it('segnala quantità mancanti o non valide', () => {
    expect(leggiQuantita('', null)).toEqual({ errori: ['Inserisci la quantità in grammi.'] });
    expect(leggiQuantita(' ', uovo)).toEqual({ errori: ['Inserisci la quantità.'] });
    expect(leggiQuantita('0', null)).toEqual({ errori: ['La quantità deve essere maggiore di 0 g.'] });
    expect(leggiQuantita('0', uovo)).toEqual({ errori: ['La quantità deve essere maggiore di 0.'] });
    expect(leggiQuantita('tre', uovo)).toEqual({ errori: ['La quantità deve essere un numero.'] });
  });
});
