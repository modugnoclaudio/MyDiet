import { describe, expect, it } from 'vitest';
import {
  etichettaGiornoAsse,
  etichettaPeriodo,
  giornoSettimana,
  giorniDelPeriodo,
  periodoDi,
  riepilogoPeriodo,
  scalaAsse,
  spostaPeriodo,
} from './andamento';
import type { VoceDiario } from './tipi';

describe('periodi di calendario', () => {
  it('riconosce il giorno della settimana, con il lunedì come primo', () => {
    expect(giornoSettimana('2026-09-21')).toBe(0); // lunedì
    expect(giornoSettimana('2026-09-26')).toBe(5); // sabato
    expect(giornoSettimana('2026-09-27')).toBe(6); // domenica
  });

  it('la settimana va da lunedì a domenica, anche a cavallo di mese e anno', () => {
    expect(periodoDi('settimana', '2026-09-26')).toEqual({ tipo: 'settimana', inizio: '2026-09-21', fine: '2026-09-27' });
    expect(periodoDi('settimana', '2026-09-21')).toEqual({ tipo: 'settimana', inizio: '2026-09-21', fine: '2026-09-27' });
    expect(periodoDi('settimana', '2026-09-27')).toEqual({ tipo: 'settimana', inizio: '2026-09-21', fine: '2026-09-27' });
    expect(periodoDi('settimana', '2027-01-01')).toEqual({ tipo: 'settimana', inizio: '2026-12-28', fine: '2027-01-03' });
  });

  it('il mese va dal primo all’ultimo giorno, bisestili compresi', () => {
    expect(periodoDi('mese', '2026-09-26')).toEqual({ tipo: 'mese', inizio: '2026-09-01', fine: '2026-09-30' });
    expect(periodoDi('mese', '2028-02-10')).toEqual({ tipo: 'mese', inizio: '2028-02-01', fine: '2028-02-29' });
    expect(periodoDi('mese', '2026-12-31').fine).toBe('2026-12-31');
  });

  it('si sposta al periodo precedente e successivo', () => {
    const settimana = periodoDi('settimana', '2026-09-26');
    expect(spostaPeriodo(settimana, -1)).toEqual({ tipo: 'settimana', inizio: '2026-09-14', fine: '2026-09-20' });
    expect(spostaPeriodo(settimana, 1).inizio).toBe('2026-09-28');
    const mese = periodoDi('mese', '2026-01-15');
    expect(spostaPeriodo(mese, -1)).toEqual({ tipo: 'mese', inizio: '2025-12-01', fine: '2025-12-31' });
    expect(spostaPeriodo(mese, 1)).toEqual({ tipo: 'mese', inizio: '2026-02-01', fine: '2026-02-28' });
  });

  it('elenca tutti i giorni del periodo', () => {
    expect(giorniDelPeriodo(periodoDi('settimana', '2026-09-26'))).toHaveLength(7);
    expect(giorniDelPeriodo(periodoDi('mese', '2026-09-26'))).toHaveLength(30);
    expect(giorniDelPeriodo(periodoDi('mese', '2026-09-26'))[29]).toBe('2026-09-30');
  });
});

describe('riepilogoPeriodo', () => {
  function voce(data: string, kcal: number, fibre?: number): VoceDiario {
    return {
      id: `${data}-${kcal}`,
      data,
      pasto: 'pranzo',
      grammi: 100,
      alimento: { id: 'x', nome: 'X', valori: { kcal, carboidrati: 10, proteine: 5, grassi: 2, ...(fibre === undefined ? {} : { fibre }) } },
    };
  }
  const settimana = periodoDi('settimana', '2026-09-26');

  it('calcola i totali per giorno e segna i giorni senza voci', () => {
    const r = riepilogoPeriodo([voce('2026-09-21', 1500), voce('2026-09-21', 300.4), voce('2026-09-23', 2100)], settimana, 1800);
    expect(r.giorni.map((g) => g.kcal)).toEqual([1800, null, 2100, null, null, null, null]);
    expect(r.giorni.map((g) => g.oltreObiettivo)).toEqual([false, null, true, null, null, null, null]);
    expect(r.giorniConDati).toBe(2);
    expect(r.giorniEntroObiettivo).toBe(1);
    expect(r.massimo).toBe(2100);
  });

  it('fa la media solo sui giorni con dati', () => {
    const r = riepilogoPeriodo([voce('2026-09-21', 1000, 4), voce('2026-09-22', 2000)], settimana, null);
    expect(r.media).toEqual({ kcal: 1500, carboidrati: 10, proteine: 5, grassi: 2, fibre: 2 });
    expect(r.giorniEntroObiettivo).toBeNull();
    expect(r.giorni[0]?.oltreObiettivo).toBeNull();
  });

  it('ignora le voci fuori dal periodo e gestisce il periodo vuoto', () => {
    const r = riepilogoPeriodo([voce('2026-09-20', 1000), voce('2026-09-28', 1000)], settimana, 1800);
    expect(r.giorniConDati).toBe(0);
    expect(r.media).toBeNull();
    expect(r.giorniEntroObiettivo).toBe(0);
    expect(r.massimo).toBe(0);
  });

  it('confronta l’obiettivo con le kcal arrotondate mostrate', () => {
    const r = riepilogoPeriodo([voce('2026-09-21', 1800.4)], settimana, 1800);
    expect(r.giorni[0]).toMatchObject({ kcal: 1800, oltreObiettivo: false });
  });
});

describe('scalaAsse', () => {
  it('arrotonda il massimo a valori tondi con al massimo 5 intervalli', () => {
    expect(scalaAsse(2100)).toEqual({ massimo: 2500, tacche: [0, 500, 1000, 1500, 2000, 2500] });
    expect(scalaAsse(1800)).toEqual({ massimo: 2000, tacche: [0, 500, 1000, 1500, 2000] });
    expect(scalaAsse(350)).toEqual({ massimo: 400, tacche: [0, 100, 200, 300, 400] });
    expect(scalaAsse(0)).toEqual({ massimo: 100, tacche: [0, 100] });
  });

  it('funziona anche con valori molto alti', () => {
    const { massimo, tacche } = scalaAsse(23000);
    expect(massimo).toBeGreaterThanOrEqual(23000);
    expect(tacche.length).toBeLessThanOrEqual(6);
  });
});

describe('etichette', () => {
  it('descrivono il periodo in italiano', () => {
    expect(etichettaPeriodo(periodoDi('settimana', '2026-09-26'))).toBe('21–27 settembre 2026');
    expect(etichettaPeriodo(periodoDi('settimana', '2026-10-01'))).toBe('28 settembre – 4 ottobre 2026');
    expect(etichettaPeriodo(periodoDi('settimana', '2027-01-01'))).toBe('28 dicembre 2026 – 3 gennaio 2027');
    expect(etichettaPeriodo(periodoDi('mese', '2026-09-26'))).toBe('settembre 2026');
  });

  it('abbreviano il giorno per l’asse', () => {
    expect(etichettaGiornoAsse('2026-09-21', 'settimana')).toBe('lun 21');
    expect(etichettaGiornoAsse('2026-09-05', 'mese')).toBe('5');
  });
});
