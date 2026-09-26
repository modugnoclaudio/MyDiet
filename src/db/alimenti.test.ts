import { beforeEach, describe, expect, it } from 'vitest';
import {
  eliminaAlimentoPersonale,
  elencaAlimentiPersonali,
  leggiAlimentoPersonale,
  salvaAlimentoPersonale,
} from './alimenti';
import { AlimentoDuplicatoError, DatiNonValidiError } from './errori';
import { databaseVuoto } from './test-utils';
import { leggiUnitaPersonali, salvaUnitaPersonali } from './unita';

const valori = { kcal: 97, carboidrati: 4, proteine: 9, grassi: 5 };

beforeEach(databaseVuoto);

describe('alimenti personali', () => {
  it('salva un nuovo alimento assegnando un id e lo rilegge', async () => {
    const salvato = await salvaAlimentoPersonale({ nome: 'Yogurt greco', marca: 'Marca A', valori });
    expect(salvato).toEqual({ id: salvato.id, origine: 'personale', nome: 'Yogurt greco', marca: 'Marca A', valori });
    expect(salvato.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await leggiAlimentoPersonale(salvato.id)).toEqual(salvato);
  });

  it('ripulisce gli spazi e toglie la marca vuota', async () => {
    const salvato = await salvaAlimentoPersonale({ nome: '  Pane   di casa ', marca: '  ', valori });
    expect(salvato.nome).toBe('Pane di casa');
    expect('marca' in salvato).toBe(false);
  });

  it('distingue lo stesso alimento di marche diverse', async () => {
    await salvaAlimentoPersonale({ nome: 'Yogurt greco', marca: 'Marca A', valori });
    await salvaAlimentoPersonale({ nome: 'Yogurt greco', marca: 'Marca B', valori });
    expect(await elencaAlimentiPersonali()).toHaveLength(2);
  });

  it('rifiuta un duplicato di nome e marca, ignorando maiuscole e spazi', async () => {
    await salvaAlimentoPersonale({ nome: 'Yogurt greco', marca: 'Marca A', valori });
    await expect(salvaAlimentoPersonale({ nome: 'yogurt  GRECO', marca: 'marca a ', valori })).rejects.toThrow(
      AlimentoDuplicatoError,
    );
    expect(await elencaAlimentiPersonali()).toHaveLength(1);
  });

  it('aggiorna un alimento esistente mantenendo l’id', async () => {
    const salvato = await salvaAlimentoPersonale({ nome: 'Yogurt greco', marca: 'Marca A', valori });
    await salvaAlimentoPersonale({ ...salvato, valori: { ...valori, kcal: 100 } });
    const elenco = await elencaAlimentiPersonali();
    expect(elenco).toHaveLength(1);
    expect(elenco[0]).toMatchObject({ id: salvato.id, valori: { kcal: 100 } });
  });

  it('non permette di rinominare un alimento come uno già esistente', async () => {
    await salvaAlimentoPersonale({ nome: 'Yogurt greco', marca: 'Marca A', valori });
    const altro = await salvaAlimentoPersonale({ nome: 'Yogurt bianco', marca: 'Marca A', valori });
    await expect(salvaAlimentoPersonale({ ...altro, nome: 'Yogurt greco' })).rejects.toThrow(AlimentoDuplicatoError);
  });

  it('rifiuta dati non validi con i messaggi per l’utente', async () => {
    const errore = await salvaAlimentoPersonale({ nome: '', valori: { ...valori, kcal: -1 } }).catch((e: unknown) => e);
    expect(errore).toBeInstanceOf(DatiNonValidiError);
    expect((errore as DatiNonValidiError).errori).toEqual([
      'Il nome è obbligatorio.',
      'Le calorie non possono essere negative.',
    ]);
  });

  it('elenca in ordine alfabetico ed elimina', async () => {
    const zucchine = await salvaAlimentoPersonale({ nome: 'Zucchine grigliate', valori });
    await salvaAlimentoPersonale({ nome: 'Biscotti', marca: 'Marca B', valori });
    await salvaAlimentoPersonale({ nome: 'Biscotti', marca: 'Marca A', valori });
    expect((await elencaAlimentiPersonali()).map((a) => `${a.nome} ${a.marca ?? ''}`.trim())).toEqual([
      'Biscotti Marca A',
      'Biscotti Marca B',
      'Zucchine grigliate',
    ]);
    await eliminaAlimentoPersonale(zucchine.id);
    expect(await leggiAlimentoPersonale(zucchine.id)).toBeUndefined();
  });

  it('eliminando un alimento elimina anche le sue unità', async () => {
    const yogurt = await salvaAlimentoPersonale({ nome: 'Yogurt greco', valori });
    await salvaUnitaPersonali(yogurt.id, [{ nome: 'vasetto', grammi: 125 }]);
    await eliminaAlimentoPersonale(yogurt.id);
    expect(await leggiUnitaPersonali(yogurt.id)).toEqual([]);
  });
});
