import { describe, expect, it } from 'vitest';
import { formattaNumero } from './formato';
import {
  descriviDistanzaObiettivo,
  etichettaPeriodoPeso,
  formattaVariazioneKg,
  indicePiuVicino,
  periodoPeso,
  posizioneNelPeriodo,
  riepilogoPeso,
  scalaPeso,
  spostaPeriodoPeso,
  tacchePeriodoPeso,
  validaPeso,
} from './peso';

describe('validaPeso', () => {
  it('accetta pesi da 20 a 350 kg', () => {
    expect(validaPeso(72.4)).toEqual([]);
    expect(validaPeso(20)).toEqual([]);
    expect(validaPeso(350)).toEqual([]);
  });

  it('rifiuta valori non numerici o fuori intervallo', () => {
    expect(validaPeso(Number.NaN)).toEqual(['Il peso deve essere un numero.']);
    expect(validaPeso(19.9)).toEqual(['Il peso deve essere compreso tra 20 e 350 kg.']);
    expect(validaPeso(724)).toEqual(['Il peso deve essere compreso tra 20 e 350 kg.']);
    expect(validaPeso(5, 'Il peso obiettivo')).toEqual(['Il peso obiettivo deve essere compreso tra 20 e 350 kg.']);
  });
});

describe('periodoPeso', () => {
  it('mese di calendario', () => {
    expect(periodoPeso('mese', '2026-11-23')).toEqual({ tipo: 'mese', inizio: '2026-11-01', fine: '2026-11-30' });
    expect(periodoPeso('mese', '2028-02-10')).toEqual({ tipo: 'mese', inizio: '2028-02-01', fine: '2028-02-29' });
  });

  it('3 mesi e un anno che finiscono con il mese della data', () => {
    expect(periodoPeso('trimestre', '2026-11-23')).toEqual({ tipo: 'trimestre', inizio: '2026-09-01', fine: '2026-11-30' });
    expect(periodoPeso('trimestre', '2027-01-05')).toEqual({ tipo: 'trimestre', inizio: '2026-11-01', fine: '2027-01-31' });
    expect(periodoPeso('anno', '2026-11-23')).toEqual({ tipo: 'anno', inizio: '2025-12-01', fine: '2026-11-30' });
    expect(periodoPeso('anno', '2026-12-31')).toEqual({ tipo: 'anno', inizio: '2026-01-01', fine: '2026-12-31' });
  });
});

describe('spostaPeriodoPeso', () => {
  it('si sposta della durata del periodo', () => {
    expect(spostaPeriodoPeso(periodoPeso('mese', '2026-01-15'), -1)).toEqual(periodoPeso('mese', '2025-12-01'));
    expect(spostaPeriodoPeso(periodoPeso('trimestre', '2026-11-23'), -1)).toEqual({
      tipo: 'trimestre',
      inizio: '2026-06-01',
      fine: '2026-08-31',
    });
    expect(spostaPeriodoPeso(periodoPeso('anno', '2025-11-01'), 1)).toEqual(periodoPeso('anno', '2026-11-23'));
  });
});

describe('etichettaPeriodoPeso', () => {
  it('mostra i mesi del periodo', () => {
    expect(etichettaPeriodoPeso(periodoPeso('mese', '2026-11-23'))).toBe('novembre 2026');
    expect(etichettaPeriodoPeso(periodoPeso('trimestre', '2026-11-23'))).toBe('settembre – novembre 2026');
    expect(etichettaPeriodoPeso(periodoPeso('anno', '2026-11-23'))).toBe('dicembre 2025 – novembre 2026');
  });
});

describe('posizioneNelPeriodo', () => {
  it('va da 0 a 1 in proporzione ai giorni', () => {
    const novembre = periodoPeso('mese', '2026-11-01');
    expect(posizioneNelPeriodo(novembre, '2026-11-01')).toBe(0);
    expect(posizioneNelPeriodo(novembre, '2026-11-30')).toBe(1);
    expect(posizioneNelPeriodo(novembre, '2026-11-16')).toBeCloseTo(15 / 29, 10);
  });
});

describe('tacchePeriodoPeso', () => {
  it('nel mese indica alcuni giorni', () => {
    expect(tacchePeriodoPeso(periodoPeso('mese', '2026-11-01')).map((t) => t.etichetta)).toEqual(['1', '8', '15', '22', '29']);
    expect(tacchePeriodoPeso(periodoPeso('mese', '2027-02-01')).map((t) => t.data)).toEqual([
      '2027-02-01',
      '2027-02-08',
      '2027-02-15',
      '2027-02-22',
    ]);
  });

  it('in 3 mesi e in un anno indica l’inizio dei mesi', () => {
    expect(tacchePeriodoPeso(periodoPeso('trimestre', '2026-11-01'))).toEqual([
      { data: '2026-09-01', etichetta: 'set' },
      { data: '2026-10-01', etichetta: 'ott' },
      { data: '2026-11-01', etichetta: 'nov' },
    ]);
    expect(tacchePeriodoPeso(periodoPeso('anno', '2026-11-01')).map((t) => t.etichetta)).toEqual([
      'dic',
      'feb',
      'apr',
      'giu',
      'ago',
      'ott',
    ]);
  });
});

describe('riepilogoPeso', () => {
  const pesate = [
    { data: '2026-11-20', kg: 71.6 },
    { data: '2026-10-30', kg: 73.0 },
    { data: '2026-11-02', kg: 72.8 },
    { data: '2026-11-12', kg: 72.1 },
  ];
  const novembre = periodoPeso('mese', '2026-11-23');

  it('considera solo le pesate del periodo, in ordine', () => {
    const riepilogo = riepilogoPeso(pesate, novembre, 68);
    expect(riepilogo.pesate.map((p) => p.data)).toEqual(['2026-11-02', '2026-11-12', '2026-11-20']);
    expect(riepilogo.ultima).toEqual({ data: '2026-11-20', kg: 71.6 });
  });

  it('calcola variazione e distanza dall’obiettivo, arrotondate a 0,1 kg', () => {
    // 71,6 − 72,8 = −1,2 kg; 71,6 − 68 = 3,6 kg
    const riepilogo = riepilogoPeso(pesate, novembre, 68);
    expect(riepilogo.variazione).toBe(-1.2);
    expect(riepilogo.distanzaObiettivo).toBe(3.6);
  });

  it('senza abbastanza dati o senza obiettivo restituisce null', () => {
    expect(riepilogoPeso([{ data: '2026-11-02', kg: 72.8 }], novembre, null)).toEqual({
      pesate: [{ data: '2026-11-02', kg: 72.8 }],
      ultima: { data: '2026-11-02', kg: 72.8 },
      variazione: null,
      distanzaObiettivo: null,
    });
    expect(riepilogoPeso([], novembre, 68)).toEqual({ pesate: [], ultima: null, variazione: null, distanzaObiettivo: null });
  });
});

describe('scalaPeso', () => {
  it('non parte da zero e usa passi tondi con margine', () => {
    expect(scalaPeso([72.4, 73.1])).toEqual({ minimo: 72, massimo: 73.5, tacche: [72, 72.5, 73, 73.5] });
  });

  it('con un solo valore crea comunque un intervallo', () => {
    expect(scalaPeso([70])).toEqual({ minimo: 69.5, massimo: 70.5, tacche: [69.5, 70, 70.5] });
  });

  it('allarga il passo per comprendere anche l’obiettivo, con al massimo 5 intervalli', () => {
    expect(scalaPeso([80, 78.5, 65])).toEqual({ minimo: 60, massimo: 85, tacche: [60, 65, 70, 75, 80, 85] });
    const { tacche } = scalaPeso([55.3, 120]);
    expect(tacche.length - 1).toBeLessThanOrEqual(5);
    expect(tacche[0]).toBeLessThanOrEqual(55.3);
    expect(tacche[tacche.length - 1]).toBeGreaterThanOrEqual(120);
  });
});

describe('formattaVariazioneKg', () => {
  it('mostra il segno, con il meno tipografico', () => {
    expect(formattaVariazioneKg(0.4, formattaNumero)).toBe('+0,4 kg');
    expect(formattaVariazioneKg(-1.2, formattaNumero)).toBe('−1,2 kg');
    expect(formattaVariazioneKg(0, formattaNumero)).toBe('0 kg');
    expect(formattaVariazioneKg(-0.04, formattaNumero)).toBe('0 kg');
  });
});

describe('descriviDistanzaObiettivo', () => {
  it('dice se il peso è sopra o sotto l’obiettivo', () => {
    expect(descriviDistanzaObiettivo(3.6, formattaNumero)).toBe('3,6 kg sopra l’obiettivo');
    expect(descriviDistanzaObiettivo(-0.5, formattaNumero)).toBe('0,5 kg sotto l’obiettivo');
    expect(descriviDistanzaObiettivo(0, formattaNumero)).toBe('Obiettivo raggiunto');
  });
});

describe('indicePiuVicino', () => {
  it('trova la posizione più vicina; a parità la prima', () => {
    expect(indicePiuVicino([10, 20, 40], 33)).toBe(2);
    expect(indicePiuVicino([10, 20, 40], 15)).toBe(0);
    expect(indicePiuVicino([10, 20, 40], -5)).toBe(0);
    expect(indicePiuVicino([], 3)).toBe(-1);
  });
});
