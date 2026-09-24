import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

interface Props {
  titolo: string;
  onChiudi: () => void;
  children: ComponentChildren;
}

/** Finestra in sovrimpressione; si chiude con Esc, con la × o toccando fuori. */
export function Dialogo({ titolo, onChiudi, children }: Props) {
  const pannello = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const precedente = document.activeElement as HTMLElement | null;
    pannello.current?.querySelector<HTMLElement>('[autofocus], input, select, button:not(.dialogo-chiudi)')?.focus();
    const suTasto = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onChiudi();
    };
    document.addEventListener('keydown', suTasto);
    document.body.classList.add('senza-scorrimento');
    return () => {
      document.removeEventListener('keydown', suTasto);
      document.body.classList.remove('senza-scorrimento');
      precedente?.focus();
    };
  }, [onChiudi]);

  return (
    <div class="dialogo-sfondo" onClick={(e) => e.target === e.currentTarget && onChiudi()}>
      <div class="dialogo" role="dialog" aria-modal="true" aria-label={titolo} ref={pannello}>
        <header class="dialogo-testata">
          <h2>{titolo}</h2>
          <button type="button" class="dialogo-chiudi" aria-label="Chiudi" onClick={onChiudi}>
            ×
          </button>
        </header>
        <div class="dialogo-corpo">{children}</div>
      </div>
    </div>
  );
}
