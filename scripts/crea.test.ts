import { describe, expect, it } from 'vitest';
import { grammiPorzione, leggiElenco, leggiScheda, leggiSchedaSenzaAlcol } from './crea';

// Estratti con la stessa struttura delle pagine di www.alimentinutrizione.it
function riga(nome: string, unita: string, valore: string): string {
  return `<tr class="corponutriente"><td width="250">${nome}</td><td>${unita}</td><td>${valore}</td><td></td><td></td><td>0</td></tr>`;
}

function scheda(opzioni: { fibre?: string; alcool?: string; nomeInglese?: string; porzione?: string } = {}): string {
  return [
    '<h1 class="article-title" itemprop="name">\n Pomodori, San Marzano, freschi <meta itemprop="url" content="x" />\n</h1>',
    '<tr><td>Categoria</td><td>Verdure e ortaggi</td></tr><tr><td>Codice Alimento</td><td>006620</td></tr>',
    `<tr><td>Porzione</td><td>${opzioni.porzione ?? '200 g'}</td></tr>`,
    `<tr><td>English Name</td><td>${opzioni.nomeInglese ?? 'Tomatoes'}</td></tr>`,
    riga('Energia (kcal)', 'kcal', '19&nbsp;'),
    riga('Proteine (g)', 'g (N x 6,25)', '1.0&nbsp;'),
    riga('Lipidi (g)', 'g', 'tr&nbsp;'),
    riga('Carboidrati disponibili (g)', 'g', '3.0&nbsp;<i class="fa fa-info" data-content="revisionato"></i>'),
    riga('Alcool (g)', 'g', opzioni.alcool ?? '0&nbsp;'),
    riga('Fibra totale (g)', 'g', opzioni.fibre ?? '1.2&nbsp;'),
  ].join('\n');
}

describe('leggiElenco', () => {
  it('estrae codice, nome e categoria', () => {
    const html =
      '<a href="/tabelle-nutrizionali/000020">\n Farro perlato, crudo <span class="categoria">01</span></a>' +
      '<a href="/tabelle-nutrizionali/202020">"|Caramelle tipo ""mou""|" <span class="categoria">15</span></a>';
    expect(leggiElenco(html)).toEqual([
      { codice: '000020', nome: 'Farro perlato, crudo', codiceCategoria: '01' },
      { codice: '202020', nome: 'Caramelle tipo "mou"', codiceCategoria: '15' },
    ]);
  });
});

describe('leggiScheda', () => {
  it('legge i valori per 100 g, con le tracce a 0', () => {
    expect(leggiScheda(scheda())).toEqual({
      codice: '006620',
      nome: 'Pomodori, San Marzano, freschi',
      categoria: 'Verdure e ortaggi',
      kcal: 19,
      proteine: 1,
      grassi: 0,
      carboidrati: 3,
      fibre: 1.2,
      porzione: 200,
    });
  });

  it('lascia le fibre non indicate se il dato manca', () => {
    expect(leggiScheda(scheda({ fibre: '&nbsp;' })).fibre).toBeUndefined();
    expect(leggiScheda(scheda({ fibre: '-' })).fibre).toBeUndefined();
  });

  it('fallisce se manca un valore obbligatorio', () => {
    expect(() => leggiScheda(scheda().replace(riga('Lipidi (g)', 'g', 'tr&nbsp;'), ''))).toThrow(
      'Alimento 006620: manca Lipidi (g)',
    );
  });

  it('fallisce se la pagina non è una scheda', () => {
    expect(() => leggiScheda('<html></html>')).toThrow('Scheda non riconosciuta');
  });
});

describe('leggiSchedaSenzaAlcol', () => {
  it('accetta alimenti senza alcol', () => {
    expect(leggiSchedaSenzaAlcol(scheda()).codice).toBe('006620');
  });

  it('rifiuta alimenti con alcol', () => {
    expect(() => leggiSchedaSenzaAlcol(scheda({ alcool: '4.5' }))).toThrow('contiene 4.5 g di alcol');
  });
});

describe('grammiPorzione', () => {
  it('legge i grammi della porzione', () => {
    expect(grammiPorzione('80 g')).toBe(80);
    expect(grammiPorzione(' 12,5 g ')).toBe(12.5);
  });

  it('restituisce undefined se la porzione manca o non è in grammi', () => {
    expect(grammiPorzione(undefined)).toBeUndefined();
    expect(grammiPorzione('')).toBeUndefined();
    expect(grammiPorzione('1 tazza')).toBeUndefined();
    expect(grammiPorzione('0 g')).toBeUndefined();
  });

  it('è letta dalla scheda', () => {
    expect(leggiScheda(scheda({ porzione: '' })).porzione).toBeUndefined();
  });
});
