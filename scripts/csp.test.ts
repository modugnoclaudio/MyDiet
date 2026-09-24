import { describe, expect, it } from 'vitest';
import { creaCsp, DIRETTIVE_CSP } from './csp';

describe('Content Security Policy', () => {
  const csp = creaCsp();

  it('blocca tutto ciò che non è esplicitamente permesso', () => {
    expect(csp.startsWith("default-src 'none'")).toBe(true);
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("form-action 'none'");
  });

  it('permette script, stili e connessioni solo dal sito stesso', () => {
    expect(DIRETTIVE_CSP['script-src']).toEqual(["'self'"]);
    expect(DIRETTIVE_CSP['style-src']).toEqual(["'self'"]);
    expect(DIRETTIVE_CSP['connect-src']).toEqual(["'self'"]);
  });

  it('non contiene eccezioni pericolose', () => {
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*|https?:/);
  });

  it('separa le direttive con punto e virgola', () => {
    expect(creaCsp({ 'default-src': ["'none'"], 'img-src': ["'self'", 'data:'] })).toBe(
      "default-src 'none'; img-src 'self' data:",
    );
  });
});
