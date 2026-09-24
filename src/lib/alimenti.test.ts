import { describe, expect, it } from 'vitest';
import { chiaveAlimento, nomeCompleto } from './alimenti';

describe('chiaveAlimento', () => {
  it('distingue lo stesso alimento di marche diverse', () => {
    expect(chiaveAlimento('Yogurt greco', 'Marca A')).not.toBe(chiaveAlimento('Yogurt greco', 'Marca B'));
  });

  it('ignora maiuscole e spazi superflui', () => {
    expect(chiaveAlimento('  Yogurt   Greco ', ' marca a')).toBe(chiaveAlimento('yogurt greco', 'Marca A'));
  });

  it('tratta marca assente e marca vuota allo stesso modo', () => {
    expect(chiaveAlimento('Mela')).toBe(chiaveAlimento('Mela', '  '));
    expect(chiaveAlimento('Mela')).not.toBe(chiaveAlimento('Mela', 'Marca A'));
  });
});

describe('nomeCompleto', () => {
  it('aggiunge la marca se presente', () => {
    expect(nomeCompleto({ nome: 'Yogurt greco', marca: 'Marca A' })).toBe('Yogurt greco – Marca A');
  });

  it('mostra solo il nome senza marca', () => {
    expect(nomeCompleto({ nome: 'Mela' })).toBe('Mela');
    expect(nomeCompleto({ nome: 'Mela', marca: ' ' })).toBe('Mela');
  });
});
