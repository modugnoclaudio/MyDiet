import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './components/App';
import { richiediArchiviazionePersistente } from './db/persistenza';
import './style.css';

registerSW({ immediate: true });
void richiediArchiviazionePersistente();

render(<App />, document.getElementById('app')!);
