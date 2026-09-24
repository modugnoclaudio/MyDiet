import type { Alimento } from './tipi';

function normalizza(testo: string): string {
  return testo.trim().replace(/\s+/g, ' ').toLocaleLowerCase('it');
}

/**
 * Chiave che identifica un alimento personale: nome + marca, senza
 * distinzione tra maiuscole/minuscole e spazi superflui.
 * Due alimenti con la stessa chiave sono lo stesso alimento.
 */
export function chiaveAlimento(nome: string, marca?: string): string {
  return `${normalizza(nome)}|${normalizza(marca ?? '')}`;
}

/** Nome da mostrare, con la marca se presente (es. "Yogurt greco – Marca A"). */
export function nomeCompleto(alimento: Pick<Alimento, 'nome'> & { marca?: string }): string {
  const nome = alimento.nome.trim();
  const marca = alimento.marca?.trim();
  return marca ? `${nome} – ${marca}` : nome;
}
