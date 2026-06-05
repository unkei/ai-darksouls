import { createInputState, InputProvider, InputState } from './InputState';

export class TouchInput implements InputProvider {
  private state = createInputState();
  private readonly activeButtons = new Set<string>();
  private movePointer: number | null = null;
  private cameraPointer: number | null = null;
  private moveOrigin = { x: 0, y: 0 };
  private cameraLast = { x: 0, y: 0 };
  readonly root: HTMLElement;

  constructor(private readonly parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'touch-controls';
    this.root.dataset.testid = 'touch-controls';
    this.root.innerHTML = `
      <div class="touch-stick" data-zone="move"><span></span></div>
      <div class="touch-camera" data-zone="camera"></div>
      <div class="touch-buttons">
        <button data-action="attack">ATK</button>
        <button data-action="dodge">ROLL</button>
        <button data-action="guard">GRD</button>
        <button data-action="heal">HEAL</button>
        <button data-action="lockOn">LOCK</button>
        <button data-action="interact">USE</button>
      </div>
    `;
    parent.appendChild(this.root);
    this.root.addEventListener('pointerdown', this.onPointerDown);
    this.root.addEventListener('pointermove', this.onPointerMove);
    this.root.addEventListener('pointerup', this.onPointerUp);
    this.root.addEventListener('pointercancel', this.onPointerUp);
  }

  update(): InputState {
    const next = { ...this.state, move: { ...this.state.move }, camera: { ...this.state.camera } };
    next.attack = this.activeButtons.has('attack');
    next.dodge = this.activeButtons.has('dodge');
    next.guard = this.activeButtons.has('guard');
    next.heal = this.activeButtons.has('heal');
    next.lockOn = this.activeButtons.has('lockOn');
    next.interact = this.activeButtons.has('interact');
    this.state.camera = { x: 0, y: 0 };
    return next;
  }

  dispose(): void {
    this.root.removeEventListener('pointerdown', this.onPointerDown);
    this.root.removeEventListener('pointermove', this.onPointerMove);
    this.root.removeEventListener('pointerup', this.onPointerUp);
    this.root.removeEventListener('pointercancel', this.onPointerUp);
    this.root.remove();
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    const target = event.target as HTMLElement;
    const button = target.closest('button') as HTMLButtonElement | null;
    const zone = (target.closest('[data-zone]') as HTMLElement | null)?.dataset.zone;
    if (button?.dataset.action) this.activeButtons.add(button.dataset.action);
    if (zone === 'move') {
      this.movePointer = event.pointerId;
      this.moveOrigin = { x: event.clientX, y: event.clientY };
    }
    if (zone === 'camera') {
      this.cameraPointer = event.pointerId;
      this.cameraLast = { x: event.clientX, y: event.clientY };
    }
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId === this.movePointer) {
      this.state.move.x = Math.max(-1, Math.min(1, (event.clientX - this.moveOrigin.x) / 55));
      this.state.move.y = Math.max(-1, Math.min(1, -(event.clientY - this.moveOrigin.y) / 55));
    }
    if (event.pointerId === this.cameraPointer) {
      this.state.camera.x += (event.clientX - this.cameraLast.x) * 0.004;
      this.state.camera.y += (event.clientY - this.cameraLast.y) * 0.004;
      this.cameraLast = { x: event.clientX, y: event.clientY };
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const target = event.target as HTMLElement;
    const button = target.closest('button') as HTMLButtonElement | null;
    if (button?.dataset.action) this.activeButtons.delete(button.dataset.action);
    if (event.pointerId === this.movePointer) {
      this.movePointer = null;
      this.state.move = { x: 0, y: 0 };
    }
    if (event.pointerId === this.cameraPointer) this.cameraPointer = null;
  };
}
