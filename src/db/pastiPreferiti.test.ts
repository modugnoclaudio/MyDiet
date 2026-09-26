import { beforeEach, describe, expect, it } from 'vitest';
import type { ElementoPasto } from '../lib/tipi';
import { DatiNonValidiError } from './errori';
import { eliminaPastoPreferito, elencaPastiPreferiti, salvaPastoPreferito } from './pastiPreferiti';
import { databaseVuoto } from './test-utils';

const latte: ElementoPasto = {
  grammi: 200,
  alimento: { id: 'crea-135010', nome: 'Latte intero', valori: { kcal: 64, carboidrati: 4.9, proteine: 3.3, grassi: 3.6 } },
};
const uova: ElementoPasto = {
  grammi: 100,
  misura: { quantita: 2, unita: { nome: 'uovo', grammi: 50 } },
  alimento: { id: 'crea-181100', nome: 'Uova', valori: { kcal: 128, carboidrati: 0, proteine: 12.4, grassi: 8.7 } },
};

beforeEach(databaseVuoto);

describe('pasti preferiti', () => {
  it('salva, elenca in ordine alfabetico ed elimina', async () => {
    const colazione = await salvaPastoPreferito({ nome: '  Colazione   tipo ', elementi: [latte, uova] });
    await salvaPastoPreferito({ nome: 'Brunch', elementi: [uova] });
    expect(colazione.nome).toBe('Colazione tipo');
    expect(colazione.elementi).toEqual([latte, uova]);
    expect((await elencaPastiPreferiti()).map((p) => p.nome)).toEqual(['Brunch', 'Colazione tipo']);
    await eliminaPastoPreferito(colazione.id);
    expect((await elencaPastiPreferiti()).map((p) => p.nome)).toEqual(['Brunch']);
  });

  it('rinomina un pasto mantenendo l’id', async () => {
    const pasto = await salvaPastoPreferito({ nome: 'Colazione', elementi: [latte] });
    await salvaPastoPreferito({ ...pasto, nome: 'Colazione veloce' });
    expect(await elencaPastiPreferiti()).toEqual([{ ...pasto, nome: 'Colazione veloce' }]);
  });

  it('rifiuta nomi già usati, nomi vuoti e pasti senza alimenti', async () => {
    await salvaPastoPreferito({ nome: 'Colazione tipo', elementi: [latte] });
    await expect(salvaPastoPreferito({ nome: 'colazione TIPO', elementi: [latte] })).rejects.toThrow(
      'Esiste già un pasto preferito chiamato “colazione TIPO”.',
    );
    const errore = await salvaPastoPreferito({ nome: ' ', elementi: [] }).catch((e: unknown) => e);
    expect(errore).toBeInstanceOf(DatiNonValidiError);
    expect((errore as DatiNonValidiError).errori).toEqual(['Il nome è obbligatorio.', 'Il pasto non contiene alimenti.']);
    expect(await elencaPastiPreferiti()).toHaveLength(1);
  });
});
