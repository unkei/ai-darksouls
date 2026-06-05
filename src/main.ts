import './styles/main.css';
import { Game } from './game/Game';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('Missing #app root');
}

const game = new Game(root);
game.start();

window.addEventListener('beforeunload', () => game.dispose());
