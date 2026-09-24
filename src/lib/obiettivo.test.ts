import { describe, expect, it } from 'vitest';
import { avanzamentoObiettivo } from './obiettivo';

describe('avanzamentoObiettivo', () => {
  it('calcola percentuale e kcal rimanenti sotto l’obiettivo', () => {
    expect(avanzamentoObiettivo(500, 2000)).toEqual({
      percentuale: 25,
      percentualeBarra: 25,
      rimanenti: 1500,
      eccedenza: 0,
      superato: false,
    });
  });

  it('a obiettivo esatto è al 100% e non superato', () => {
    expect(avanzamentoObiettivo(2000, 2000)).toMatchObject({
      percentuale: 100,
      percentualeBarra: 100,
      rimanenti: 0,
      superato: false,
    });
  });

  it('oltre l’obiettivo limita la barra a 100 e indica l’eccedenza', () => {
    expect(avanzamentoObiettivo(2500, 2000)).toEqual({
      percentuale: 125,
      percentualeBarra: 100,
      rimanenti: 0,
      eccedenza: 500,
      superato: true,
    });
  });

  it('a zero kcal consumate è allo 0%', () => {
    expect(avanzamentoObiettivo(0, 2000)?.percentualeBarra).toBe(0);
  });

  it('restituisce null se l’obiettivo non è impostato o non è valido', () => {
    expect(avanzamentoObiettivo(500, null)).toBeNull();
    expect(avanzamentoObiettivo(500, 0)).toBeNull();
    expect(avanzamentoObiettivo(500, -100)).toBeNull();
    expect(avanzamentoObiettivo(500, Number.NaN)).toBeNull();
  });
});
