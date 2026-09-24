export type Vista = 'diario' | 'storico' | 'alimenti' | 'impostazioni';

const VOCI: { vista: Vista; etichetta: string; icona: string }[] = [
  { vista: 'diario', etichetta: 'Diario', icona: 'M4 4h16v16H4zM8 2v4M16 2v4M4 10h16' },
  { vista: 'storico', etichetta: 'Storico', icona: 'M12 7v5l3 3M3 12a9 9 0 1 0 3-6.7M3 4v4h4' },
  { vista: 'alimenti', etichetta: 'Alimenti', icona: 'M4 6h16M4 12h16M4 18h10' },
  {
    vista: 'impostazioni',
    etichetta: 'Impostazioni',
    icona: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .5-1.5-1.5.5-2-3-1-1 2h-2l-1-2-3 1 .5 2L6 7.5 4 7l-1 3 2 1v2l-2 1 1 3 2-.5L7.5 17 7 19l3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3-2-1z',
  },
];

interface Props {
  vista: Vista;
  onCambia: (vista: Vista) => void;
}

/** Barra di navigazione tra le sezioni dell'app. */
export function BarraNavigazione({ vista, onCambia }: Props) {
  return (
    <nav class="navigazione" aria-label="Sezioni">
      {VOCI.map((voce) => (
        <button
          key={voce.vista}
          type="button"
          aria-current={voce.vista === vista ? 'page' : undefined}
          onClick={() => onCambia(voce.vista)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={voce.icona} />
          </svg>
          <span>{voce.etichetta}</span>
        </button>
      ))}
    </nav>
  );
}
