import { useState } from 'preact/hooks';
import { dataISO } from '../lib/date';
import { AlimentiPersonali } from './AlimentiPersonali';
import { BarraNavigazione, type Vista } from './BarraNavigazione';
import { Diario } from './Diario';
import { Impostazioni } from './Impostazioni';
import { Storico } from './Storico';

export function App() {
  const oggi = dataISO(new Date());
  const [vista, setVista] = useState<Vista>('diario');
  const [data, setData] = useState(oggi);

  function cambiaVista(nuova: Vista) {
    if (nuova === 'diario' && vista === 'diario') setData(oggi);
    setVista(nuova);
    window.scrollTo(0, 0);
  }

  return (
    <div class="app">
      <main class="contenuto">
        {vista === 'diario' && <Diario data={data} oggi={oggi} onCambiaData={setData} />}
        {vista === 'storico' && (
          <Storico
            oggi={oggi}
            onApriGiorno={(giorno) => {
              setData(giorno);
              setVista('diario');
            }}
          />
        )}
        {vista === 'alimenti' && <AlimentiPersonali />}
        {vista === 'impostazioni' && <Impostazioni oggi={oggi} />}
      </main>
      <BarraNavigazione vista={vista} onCambia={cambiaVista} />
    </div>
  );
}
