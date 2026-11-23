import { beforeEach, describe, expect, it } from 'vitest';
import {
  eliminaAlimentoPersonale,
  elencaAlimentiPersonali,
  leggiAlimentoPersonale,
  salvaAlimentoPersonale,
  salvaRicetta,
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

describe('ricette', () => {
  const pasta = { id: 'crea-000800', nome: 'Pasta di semola', valori: { kcal: 341, carboidrati: 72.7, proteine: 13.5, grassi: 1.2, fibre: 1.7 } };
  const olio = { id: 'crea-009210', nome: 'Olio di oliva extra vergine', valori: { kcal: 899, carboidrati: 0, proteine: 0, grassi: 99.9, fibre: 0 } };
  const ingredienti = [
    { grammi: 100, alimento: pasta },
    { grammi: 10, alimento: olio },
  ];

  it('salva una ricetta calcolando i valori per 100 g dal peso finale', async () => {
    const salvata = await salvaRicetta({ nome: ' Pasta  all’olio ', ricetta: { ingredienti, pesoFinale: 250, porzioni: 2 } });
    expect(salvata).toMatchObject({ origine: 'personale', nome: 'Pasta all’olio', ricetta: { pesoFinale: 250, porzioni: 2 } });
    // (341 + 89,9) kcal in 250 g di piatto finito
    expect(salvata.valori.kcal).toBeCloseTo(172.36, 6);
    expect(await leggiAlimentoPersonale(salvata.id)).toEqual(salvata);
  });

  it('aggiorna la ricetta mantenendo l’id e ricalcolando i valori', async () => {
    const salvata = await salvaRicetta({ nome: 'Pasta all’olio', ricetta: { ingredienti } });
    const aggiornata = await salvaRicetta({ id: salvata.id, nome: 'Pasta all’olio', ricetta: { ingredienti: ingredienti.slice(0, 1) } });
    expect(aggiornata.id).toBe(salvata.id);
    expect(aggiornata.valori.kcal).toBeCloseTo(341, 6);
    expect(await elencaAlimentiPersonali()).toHaveLength(1);
  });

  it('rifiuta ricette non valide e nomi già usati', async () => {
    await expect(salvaRicetta({ nome: 'X', ricetta: { ingredienti: [] } })).rejects.toThrow(DatiNonValidiError);
    await salvaAlimentoPersonale({ nome: 'Lasagna', valori });
    await expect(salvaRicetta({ nome: 'lasagna', ricetta: { ingredienti } })).rejects.toThrow(AlimentoDuplicatoError);
  });

  it('non permette di sovrascrivere una ricetta con valori scritti a mano', async () => {
    const salvata = await salvaRicetta({ nome: 'Pasta all’olio', ricetta: { ingredienti } });
    const errore = await salvaAlimentoPersonale({ id: salvata.id, nome: 'Pasta all’olio', valori }).catch((e: unknown) => e);
    expect(errore).toBeInstanceOf(DatiNonValidiError);
    expect((await leggiAlimentoPersonale(salvata.id))?.ricetta).toBeDefined();
  });
});
