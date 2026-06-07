import { Player } from '../player/Player';
import { Boss } from '../enemies/Boss';
import { GameFlowState } from '../game/GameFlow';

export class Hud {
  readonly root: HTMLElement;
  private overlayRenderKey = '';

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
      <div class="encounter-banner" data-value="encounter">Lesser Foes</div>
      <div class="boss" hidden>
        <label>Ashen Warden</label><div class="bar bossbar"><span data-bar="boss"></span></div>
      </div>
      <div class="center-message" data-value="message"></div>
      <div class="flow-overlay" data-value="flow-overlay" hidden></div>
    `;
    parent.appendChild(this.root);
  }

  update(player: Player, boss: Boss, message: string, flowState: GameFlowState = 'Playing', encounterPhase: 'Minor' | 'Boss' = 'Minor'): void {
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
    setText(this.root, 'encounter', encounterPhase === 'Boss' ? 'Boss: Ashen Warden' : 'Lesser Foes');
    const overlay = this.root.querySelector<HTMLElement>('[data-value="flow-overlay"]');
    if (overlay) {
      const usesFullOverlay = flowState !== 'Playing' && flowState !== 'BossDefeat';
      overlay.hidden = !usesFullOverlay;
      overlay.dataset.flowState = flowState;
      const nextOverlayRenderKey = `${flowState}:${message}`;
      if (!usesFullOverlay) {
        if (this.overlayRenderKey !== nextOverlayRenderKey) overlay.innerHTML = '';
      } else if (this.overlayRenderKey !== nextOverlayRenderKey) {
        overlay.innerHTML = renderFlowOverlay(message, flowState);
      }
      this.overlayRenderKey = nextOverlayRenderKey;
    }
    const bossPanel = this.root.querySelector<HTMLElement>('.boss');
    if (bossPanel) bossPanel.hidden = boss.fsm.state === 'Dead' || boss.fsm.state === 'Idle';
    this.root.dataset.playerState = player.fsm.state;
    this.root.dataset.playerPosition = `${player.position.x.toFixed(2)},${player.position.z.toFixed(2)}`;
    this.root.dataset.flowState = flowState;
    this.root.dataset.encounterPhase = encounterPhase;
  }
}

const setWidth = (root: HTMLElement, key: string, value: number): void => {
  const element = root.querySelector<HTMLElement>(`[data-bar="${key}"]`);
  if (element) element.style.width = `${Math.max(0, Math.min(100, value))}%`;
};

const renderFlowOverlay = (message: string, flowState: GameFlowState): string => {
  if (flowState === 'Ending') return renderCreditsRoll(message);
  const [title = '', subtitle = '', body = '', prompt = ''] = message.split('\n');
  return `
    <div class="flow-panel">
      <div class="flow-kicker">${escapeHtml(subtitle)}</div>
      <div class="flow-title">${escapeHtml(title)}</div>
      <div class="flow-body">${escapeHtml(body)}</div>
      <div class="flow-prompt">${escapeHtml(prompt)}</div>
    </div>
  `;
};

const renderCreditsRoll = (message: string): string => {
  const [title = '', ...lines] = message.split('\n');
  return `
    <div class="credits-window">
      <div class="ending-hold">The End</div>
      <div class="credits-roll">
        <div class="credits-title">${escapeHtml(title)}</div>
        ${lines.map((line) => `<div class="credits-line">${escapeHtml(line)}</div>`).join('')}
      </div>
    </div>
  `;
};

const escapeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const setText = (root: HTMLElement, key: string, value: string): void => {
  const element = root.querySelector<HTMLElement>(`[data-value="${key}"]`);
  if (element) element.textContent = value;
};
