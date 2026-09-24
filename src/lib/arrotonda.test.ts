import { describe, expect, it } from 'vitest';
import { arrotonda } from './arrotonda';

describe('arrotonda', () => {
  it('arrotonda all’intero per default', () => {
    expect(arrotonda(12.6)).toBe(13);
    expect(arrotonda(12.4)).toBe(12);
  });

  it('arrotonda al numero di decimali indicato', () => {
    expect(arrotonda(1.005, 2)).toBe(1.01);
    expect(arrotonda(3.14159, 3)).toBe(3.142);
  });
});
