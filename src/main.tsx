import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './components/App';
import './style.css';

registerSW({ immediate: true });

render(<App />, document.getElementById('app')!);
