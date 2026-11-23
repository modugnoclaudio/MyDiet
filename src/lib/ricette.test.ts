import { describe, expect, it } from 'vitest';
import { ALIMENTI_BASE } from '../data/alimentiBase';
import { FATTORI_CREA, verificaKcal } from './coerenza';
import { grammiPorzione, pesoIngredienti, pesoRicetta, validaRicetta, valoriRicetta } from './ricette';
import type { ElementoPasto, Ricetta } from './tipi';

function ingrediente(nome: string, grammi: number): ElementoPasto {
  const alimento = ALIMENTI_BASE.find((a) => a.nome === nome);
  if (!alimento) throw new Error(`Alimento non trovato: ${nome}`);
  return { grammi, alimento: { id: alimento.id, nome: alimento.nome, valori: alimento.valori } };
}

// Pasta al pomodoro con soli alimenti CREA. Totali calcolati a mano dai valori per 100 g:
// pasta 100 g (341 kcal; C 72,7; P 13,5; G 1,2; F 1,7) + olio 10 g (89,9 kcal; G 9,99; F 0)
// + pomodori 150 g (28,5 kcal; C 4,2; P 1,8; G 0,3; F 1,5) = 459,4 kcal; C 76,9; P 15,3; G 11,49; F 3,2; 260 g
const ingredienti = [
  ingrediente('Pasta di semola', 100),
  ingrediente('Olio di oliva extra vergine', 10),
  ingrediente('Pomodori, da insalata, freschi', 150),
];

describe('pesoIngredienti e pesoRicetta', () => {
  it('somma i grammi degli ingredienti', () => {
    expect(pesoIngredienti(ingredienti)).toBe(260);
    expect(pesoIngredienti([])).toBe(0);
  });

  it('usa il peso finale se indicato', () => {
    expect(pesoRicetta({ ingredienti })).toBe(260);
    expect(pesoRicetta({ ingredienti, pesoFinale: 400 })).toBe(400);
  });
});

describe('valoriRicetta', () => {
  it('senza peso finale divide i totali per la somma degli ingredienti', () => {
    const valori = valoriRicetta({ ingredienti });
    expect(valori.kcal).toBeCloseTo((459.4 / 260) * 100, 6);
    expect(valori.carboidrati).toBeCloseTo((76.9 / 260) * 100, 6);
    expect(valori.proteine).toBeCloseTo((15.3 / 260) * 100, 6);
    expect(valori.grassi).toBeCloseTo((11.49 / 260) * 100, 6);
    expect(valori.fibre).toBeCloseTo((3.2 / 260) * 100, 6);
  });

  it('con il peso finale (es. pasta cotta che assorbe acqua) divide per quello', () => {
    const valori = valoriRicetta({ ingredienti, pesoFinale: 400 });
    expect(valori.kcal).toBeCloseTo(114.85, 6);
    expect(valori.grassi).toBeCloseTo(2.8725, 6);
  });

  it('resta coerente con i fattori CREA, come gli ingredienti', () => {
    expect(verificaKcal(valoriRicetta({ ingredienti }), FATTORI_CREA).coerente).toBe(true);
    expect(verificaKcal(valoriRicetta({ ingredienti, pesoFinale: 400 }), FATTORI_CREA).coerente).toBe(true);
  });

  it('indica le fibre solo se tutti gli ingredienti le hanno', () => {
    const senzaFibre: ElementoPasto = {
      grammi: 125,
      alimento: { id: 'p1', nome: 'Yogurt', valori: { kcal: 60, carboidrati: 4, proteine: 10, grassi: 0.2 } },
    };
    expect('fibre' in valoriRicetta({ ingredienti: [...ingredienti, senzaFibre] })).toBe(false);
  });

  it('non divide per zero', () => {
    expect(valoriRicetta({ ingredienti: [] })).toEqual({ kcal: 0, carboidrati: 0, proteine: 0, grassi: 0 });
  });
});

describe('grammiPorzione', () => {
  it('divide il peso del piatto per le porzioni', () => {
    expect(grammiPorzione({ ingredienti, pesoFinale: 400, porzioni: 2 })).toBe(200);
    expect(grammiPorzione({ ingredienti, porzioni: 4 })).toBe(65);
    expect(grammiPorzione({ ingredienti })).toBeUndefined();
  });

  it('una porzione vale il totale diviso le porzioni', () => {
    const ricetta: Ricetta = { ingredienti, pesoFinale: 400, porzioni: 2 };
    expect((valoriRicetta(ricetta).kcal * grammiPorzione(ricetta)!) / 100).toBeCloseTo(459.4 / 2, 6);
  });
});

describe('validaRicetta', () => {
  it('accetta una ricetta valida', () => {
    expect(validaRicetta('Pasta al pomodoro', { ingredienti, pesoFinale: 400, porzioni: 2 })).toEqual([]);
  });

  it('richiede nome e almeno un ingrediente', () => {
    expect(validaRicetta('  ', { ingredienti: [] })).toEqual(['Il nome è obbligatorio.', 'Aggiungi almeno un ingrediente.']);
  });

  it('controlla le quantità degli ingredienti', () => {
    expect(validaRicetta('X', { ingredienti: [{ ...ingredienti[0]!, grammi: 0 }] })).toEqual([
      'La quantità di ogni ingrediente deve essere maggiore di 0 g.',
    ]);
  });

  it('controlla peso finale e porzioni', () => {
    expect(validaRicetta('X', { ingredienti, pesoFinale: 0 })).toEqual([
      'Il peso del piatto finito deve essere maggiore di 0 g.',
    ]);
    expect(validaRicetta('X', { ingredienti, pesoFinale: Number.NaN })).toEqual(['Il peso del piatto finito deve essere un numero.']);
    expect(validaRicetta('X', { ingredienti, pesoFinale: 60000 })).toEqual([
      'Il peso del piatto finito non può superare 50 kg.',
    ]);
    for (const porzioni of [0, 1.5, 51, Number.NaN]) {
      expect(validaRicetta('X', { ingredienti, porzioni })).toEqual(['Le porzioni devono essere un numero intero da 1 a 50.']);
    }
  });

  it('rifiuta un peso finale troppo basso (più di 100 g di nutrienti per 100 g)', () => {
    // 106,89 g di nutrienti negli ingredienti: con 100 g di piatto finito sarebbero più di 100 g per 100 g
    expect(validaRicetta('X', { ingredienti, pesoFinale: 100 })).toEqual([
      'Il peso del piatto finito è troppo basso rispetto agli ingredienti.',
    ]);
    expect(validaRicetta('X', { ingredienti, pesoFinale: 110 })).toEqual([]);
  });
});
