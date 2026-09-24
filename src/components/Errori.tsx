interface Props {
  errori: readonly string[];
}

/** Elenco di messaggi di errore da mostrare sotto un modulo. */
export function Errori({ errori }: Props) {
  if (errori.length === 0) return null;
  return (
    <ul class="errori" role="alert">
      {errori.map((errore) => (
        <li key={errore}>{errore}</li>
      ))}
    </ul>
  );
}
