import { createInputState, InputProvider, InputState } from './InputState';

export class KeyboardMouseInput implements InputProvider {
  private readonly keys = new Set<string>();
  private readonly buttons = new Set<number>();
  private cameraX = 0;
  private cameraY = 0;

  constructor(private readonly target: HTMLElement, private readonly win: Window = window) {
    win.addEventListener('keydown', this.onKeyDown);
    win.addEventListener('keyup', this.onKeyUp);
    win.addEventListener('mousemove', this.onMouseMove);
    target.addEventListener('pointerdown', this.onPointerDown);
    win.addEventListener('pointerup', this.onPointerUp);
    target.addEventListener('contextmenu', this.preventContext);
  }

  update(): InputState {
    const state = createInputState();
    state.move.x = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0);
    state.move.y = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0);
    state.camera.x = this.cameraX * 0.003;
    state.camera.y = this.cameraY * 0.003;
    state.attack = this.buttons.has(0);
    state.guard = this.buttons.has(2);
    state.dodge = this.keys.has('Space');
    state.interact = this.keys.has('KeyE');
    state.heal = this.keys.has('KeyR');
    state.lockOn = this.buttons.has(2) || this.keys.has('KeyQ');
    state.run = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    this.cameraX = 0;
    this.cameraY = 0;
    return state;
  }

  dispose(): void {
    this.win.removeEventListener('keydown', this.onKeyDown);
    this.win.removeEventListener('keyup', this.onKeyUp);
    this.win.removeEventListener('mousemove', this.onMouseMove);
    this.target.removeEventListener('pointerdown', this.onPointerDown);
    this.win.removeEventListener('pointerup', this.onPointerUp);
    this.target.removeEventListener('contextmenu', this.preventContext);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    this.keys.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private readonly onMouseMove = (event: MouseEvent): void => {
    if (document.pointerLockElement === this.target || event.buttons > 0) {
      this.cameraX += event.movementX;
      this.cameraY += event.movementY;
    }
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.buttons.add(event.button);
    this.target.requestPointerLock?.();
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.buttons.delete(event.button);
  };

  private readonly preventContext = (event: Event): void => event.preventDefault();
}
