// Content Security Policy dell'app, inserita come <meta> nella build di produzione
// (GitHub Pages non permette di impostare header HTTP). L'app non carica nulla da
// altri siti: se in futuro servisse un servizio esterno, va aggiunto qui in modo esplicito.
import type { Plugin } from 'vite';

export const DIRETTIVE_CSP: Readonly<Record<string, readonly string[]>> = {
  'default-src': ["'none'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'manifest-src': ["'self'"],
  'worker-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'none'"],
};

export function creaCsp(direttive: Readonly<Record<string, readonly string[]>> = DIRETTIVE_CSP): string {
  return Object.entries(direttive)
    .map(([nome, valori]) => `${nome} ${valori.join(' ')}`)
    .join('; ');
}

/**
 * Aggiunge CSP e politica del referrer all'index.html della build.
 * Non si applica al dev server, che usa script inline per l'aggiornamento a caldo.
 */
export function pluginSicurezza(): Plugin {
  return {
    name: 'mydiet-sicurezza',
    apply: 'build',
    transformIndexHtml() {
      return [
        { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: creaCsp() }, injectTo: 'head-prepend' },
        { tag: 'meta', attrs: { name: 'referrer', content: 'no-referrer' }, injectTo: 'head-prepend' },
      ];
    },
  };
}
