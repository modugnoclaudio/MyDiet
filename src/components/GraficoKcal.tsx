import { useEffect, useRef, useState } from 'preact/hooks';
import { etichettaGiornoAsse, scalaAsse, type GiornoAndamento, type TipoPeriodo } from '../lib/andamento';
import { formattaData, formattaNumero } from '../lib/formato';

interface Props {
  giorni: readonly GiornoAndamento[];
  obiettivoKcal: number | null;
  tipo: TipoPeriodo;
  selezionato: string | null;
  onSeleziona: (data: string) => void;
}

const ALTEZZA = 190;
const MARGINE = { sopra: 14, destra: 6, sotto: 34, sinistra: 42 };
const BARRA_MASSIMA = 24;
const RAGGIO = 4;

/** Colonna con estremità arrotondata in alto e base squadrata. */
function colonna(x: number, y: number, larghezza: number, altezza: number): string {
  const r = Math.min(RAGGIO, larghezza / 2, altezza);
  const base = y + altezza;
  return [
    `M${x},${base}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + larghezza - r}`,
    `Q${x + larghezza},${y} ${x + larghezza},${y + r}`,
    `V${base}`,
    'Z',
  ].join(' ');
}

/** Grafico a colonne delle kcal giornaliere con la linea dell'obiettivo. */
export function GraficoKcal({ giorni, obiettivoKcal, tipo, selezionato, onSeleziona }: Props) {
  const contenitore = useRef<HTMLDivElement>(null);
  const [larghezza, setLarghezza] = useState(320);

  useEffect(() => {
    const elemento = contenitore.current;
    if (!elemento) return;
    const aggiorna = () => setLarghezza(Math.max(260, Math.floor(elemento.clientWidth)));
    aggiorna();
    const osservatore = new ResizeObserver(aggiorna);
    osservatore.observe(elemento);
    return () => osservatore.disconnect();
  }, []);

  const massimoDati = Math.max(0, ...giorni.map((g) => g.kcal ?? 0));
  const { massimo, tacche } = scalaAsse(Math.max(massimoDati, obiettivoKcal ?? 0));
  const areaL = larghezza - MARGINE.sinistra - MARGINE.destra;
  const areaA = ALTEZZA - MARGINE.sopra - MARGINE.sotto;
  const y = (kcal: number) => MARGINE.sopra + areaA - (kcal / massimo) * areaA;
  const banda = areaL / giorni.length;
  const barra = Math.max(3, Math.min(BARRA_MASSIMA, banda - 2));

  const conDati = giorni.filter((g) => g.kcal !== null).length;
  const descrizione =
    conDati === 0
      ? 'Grafico delle kcal giornaliere: nessun dato nel periodo.'
      : `Grafico delle kcal giornaliere: ${conDati} giorni con dati, massimo ${formattaNumero(massimoDati)} kcal` +
        (obiettivoKcal !== null ? `, obiettivo ${formattaNumero(obiettivoKcal)} kcal.` : '.');

  return (
    <div class="grafico" ref={contenitore}>
      <svg width={larghezza} height={ALTEZZA} role="img" aria-label={descrizione}>
        {tacche.map((t) => (
          <g key={t}>
            <line class="grafico-griglia" x1={MARGINE.sinistra} x2={larghezza - MARGINE.destra} y1={y(t)} y2={y(t)} />
            <text class="grafico-asse" x={MARGINE.sinistra - 6} y={y(t)} text-anchor="end" dominant-baseline="middle">
              {formattaNumero(t)}
            </text>
          </g>
        ))}

        {giorni.map((g, i) => {
          const x0 = MARGINE.sinistra + i * banda;
          const centro = x0 + banda / 2;
          const attivo = g.data === selezionato;
          const mostraEtichetta =
            tipo === 'settimana' || i === 0 || (i + 1) % 5 === 0 || i === giorni.length - 1;
          const [primaRiga, secondaRiga] =
            tipo === 'settimana' ? etichettaGiornoAsse(g.data, tipo).split(' ') : [etichettaGiornoAsse(g.data, tipo), ''];
          const etichettaAccessibile = `${formattaData(g.data)}: ${
            g.kcal === null ? 'nessun dato' : `${formattaNumero(g.kcal)} kcal${g.oltreObiettivo ? ', oltre l’obiettivo' : ''}`
          }`;
          return (
            <g
              key={g.data}
              class={`grafico-giorno${attivo ? ' attivo' : ''}`}
              role="button"
              tabindex={0}
              aria-label={etichettaAccessibile}
              aria-pressed={attivo}
              onClick={() => onSeleziona(g.data)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSeleziona(g.data);
                }
              }}
            >
              <rect class="grafico-sfondo-giorno" x={x0} y={MARGINE.sopra} width={banda} height={areaA} />
              {g.kcal !== null && g.kcal > 0 && (
                <path
                  class={g.oltreObiettivo ? 'grafico-barra oltre' : 'grafico-barra'}
                  d={colonna(centro - barra / 2, y(g.kcal), barra, y(0) - y(g.kcal))}
                />
              )}
              {mostraEtichetta && (
                <text class="grafico-asse" x={centro} y={ALTEZZA - MARGINE.sotto + 14} text-anchor="middle">
                  {primaRiga}
                  {secondaRiga && (
                    <tspan x={centro} dy="12">
                      {secondaRiga}
                    </tspan>
                  )}
                </text>
              )}
            </g>
          );
        })}

        <line class="grafico-base" x1={MARGINE.sinistra} x2={larghezza - MARGINE.destra} y1={y(0)} y2={y(0)} />

        {obiettivoKcal !== null && (
          <g class="grafico-obiettivo" aria-hidden="true">
            <line x1={MARGINE.sinistra} x2={larghezza - MARGINE.destra} y1={y(obiettivoKcal)} y2={y(obiettivoKcal)} />
            <text x={larghezza - MARGINE.destra} y={y(obiettivoKcal) - 5} text-anchor="end">
              Obiettivo {formattaNumero(obiettivoKcal)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
