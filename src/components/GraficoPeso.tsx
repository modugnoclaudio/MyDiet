import { useEffect, useRef, useState } from 'preact/hooks';
import { formattaData, formattaNumero } from '../lib/formato';
import { indicePiuVicino, posizioneNelPeriodo, scalaPeso, tacchePeriodoPeso, type PeriodoPeso } from '../lib/peso';
import type { Pesata } from '../lib/tipi';

interface Props {
  pesate: readonly Pesata[];
  periodo: PeriodoPeso;
  pesoObiettivo: number | null;
  selezionata: string | null;
  onSeleziona: (data: string) => void;
}

const ALTEZZA = 190;
const MARGINE = { sopra: 14, destra: 10, sotto: 24, sinistra: 42 };
const RAGGIO_PUNTO = 5;

/** Grafico a linea del peso nel periodo, con la linea del peso obiettivo. L'asse verticale non parte da zero. */
export function GraficoPeso({ pesate, periodo, pesoObiettivo, selezionata, onSeleziona }: Props) {
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

  const { minimo, massimo, tacche } = scalaPeso([...pesate.map((p) => p.kg), ...(pesoObiettivo === null ? [] : [pesoObiettivo])]);
  const areaL = larghezza - MARGINE.sinistra - MARGINE.destra;
  const areaA = ALTEZZA - MARGINE.sopra - MARGINE.sotto;
  const x = (data: string) => MARGINE.sinistra + posizioneNelPeriodo(periodo, data) * areaL;
  const y = (kg: number) => MARGINE.sopra + areaA - ((kg - minimo) / (massimo - minimo)) * areaA;
  const linea = pesate.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.data)},${y(p.kg)}`).join(' ');
  // Con molte pesate (es. in un anno) i punti si toccherebbero: si disegnano più piccoli
  // o, se fittissimi, solo quello scelto (la linea basta a mostrare l'andamento).
  const posizioni = pesate.map((p) => x(p.data));
  const spazio = Math.min(Infinity, ...posizioni.slice(1).map((pos, i) => pos - posizioni[i]!));
  const raggio = spazio >= 16 ? RAGGIO_PUNTO : spazio >= 8 ? 3.5 : 0;
  const decimaliAsse = tacche.some((t) => !Number.isInteger(t)) ? 1 : 0;

  const ultima = pesate[pesate.length - 1];
  const descrizione =
    pesate.length === 0
      ? 'Grafico del peso: nessuna pesata nel periodo.'
      : `Grafico del peso: ${pesate.length === 1 ? '1 pesata' : `${pesate.length} pesate`}, l’ultima ${formattaNumero(ultima!.kg, 2)} kg` +
        (pesoObiettivo !== null ? `, obiettivo ${formattaNumero(pesoObiettivo, 1)} kg.` : '.');

  return (
    <div class="grafico" ref={contenitore}>
      <svg width={larghezza} height={ALTEZZA} role="img" aria-label={descrizione}>
        {tacche.map((t) => (
          <g key={t}>
            <line class="grafico-griglia" x1={MARGINE.sinistra} x2={larghezza - MARGINE.destra} y1={y(t)} y2={y(t)} />
            <text class="grafico-asse" x={MARGINE.sinistra - 6} y={y(t)} text-anchor="end" dominant-baseline="middle">
              {formattaNumero(t, decimaliAsse)}
            </text>
          </g>
        ))}
        {tacchePeriodoPeso(periodo).map((t) => (
          <text key={t.data} class="grafico-asse" x={x(t.data)} y={ALTEZZA - 8} text-anchor="middle">
            {t.etichetta}
          </text>
        ))}

        {pesoObiettivo !== null && (
          <g class="grafico-obiettivo tratteggiato" aria-hidden="true">
            <line x1={MARGINE.sinistra} x2={larghezza - MARGINE.destra} y1={y(pesoObiettivo)} y2={y(pesoObiettivo)} />
            <text x={larghezza - MARGINE.destra} y={y(pesoObiettivo) - 5} text-anchor="end">
              Obiettivo {formattaNumero(pesoObiettivo, 1)} kg
            </text>
          </g>
        )}

        {/* Un tocco nell'area del grafico sceglie la pesata più vicina: i punti possono essere molto fitti. */}
        <rect
          class="grafico-peso-area"
          x={MARGINE.sinistra}
          y={MARGINE.sopra}
          width={areaL}
          height={areaA}
          onClick={(e) => {
            const svg = e.currentTarget.ownerSVGElement;
            if (!svg) return;
            const toccato = e.clientX - svg.getBoundingClientRect().left;
            const indice = indicePiuVicino(posizioni, toccato);
            if (indice >= 0) onSeleziona(pesate[indice]!.data);
          }}
        />

        {pesate.length > 1 && <path class="grafico-peso-linea" d={linea} />}

        {pesate.map((p) => {
          const attiva = p.data === selezionata;
          return (
            <g
              key={p.data}
              class={`grafico-peso-punto${attiva ? ' attivo' : ''}`}
              role="button"
              tabindex={0}
              aria-label={`${formattaData(p.data)}: ${formattaNumero(p.kg, 2)} kg`}
              aria-pressed={attiva}
              onClick={() => onSeleziona(p.data)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSeleziona(p.data);
                }
              }}
            >
              <circle
                class={`grafico-peso-cerchio${!attiva && raggio < RAGGIO_PUNTO ? ' piccolo' : ''}`}
                cx={x(p.data)}
                cy={y(p.kg)}
                r={attiva ? RAGGIO_PUNTO + 1 : raggio}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
