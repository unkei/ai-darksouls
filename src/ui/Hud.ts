import { Player } from '../player/Player';
import { Boss } from '../enemies/Boss';

export class Hud {
  readonly root: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'hud';
    this.root.innerHTML = `
      <div class="bars">
        <label>HP <span data-value="hp-text"></span></label><div class="bar"><span data-bar="hp"></span></div>
        <label>ST <span data-value="stamina-text"></span></label><div class="bar stamina"><span data-bar="stamina"></span></div>
      </div>
      <div class="readout">
        <span data-value="state"></span>
        <span data-value="flasks"></span>
        <span data-value="echoes"></span>
        <span data-value="position"></span>
      </div>
      <div class="controls-help">WASD move / Mouse look / Left attack / Space roll / Right guard-lock / E use / R heal</div>
      <div class="boss" hidden>
        <label>Ashen Warden</label><div class="bar bossbar"><span data-bar="boss"></span></div>
      </div>
      <div class="center-message" data-value="message"></div>
    `;
    parent.appendChild(this.root);
  }

  update(player: Player, boss: Boss, message: string): void {
    setWidth(this.root, 'hp', player.hp);
    setWidth(this.root, 'stamina', player.stamina);
    setWidth(this.root, 'boss', (boss.hp / boss.config.maxHp) * 100);
    setText(this.root, 'hp-text', `${Math.round(player.hp)}/100`);
    setText(this.root, 'stamina-text', `${Math.round(player.stamina)}/100`);
    setText(this.root, 'state', `State: ${player.fsm.state}`);
    setText(this.root, 'flasks', `Flasks: ${player.flasks}`);
    setText(this.root, 'echoes', `Echoes: ${player.echoes}`);
    setText(this.root, 'position', `Pos: ${player.position.x.toFixed(2)}, ${player.position.z.toFixed(2)}`);
    setText(this.root, 'message', message);
    const bossPanel = this.root.querySelector<HTMLElement>('.boss');
    if (bossPanel) bossPanel.hidden = boss.fsm.state === 'Dead';
    this.root.dataset.playerState = player.fsm.state;
    this.root.dataset.playerPosition = `${player.position.x.toFixed(2)},${player.position.z.toFixed(2)}`;
  }
}

const setWidth = (root: HTMLElement, key: string, value: number): void => {
  const element = root.querySelector<HTMLElement>(`[data-bar="${key}"]`);
  if (element) element.style.width = `${Math.max(0, Math.min(100, value))}%`;
};

const setText = (root: HTMLElement, key: string, value: string): void => {
  const element = root.querySelector<HTMLElement>(`[data-value="${key}"]`);
  if (element) element.textContent = value;
};
