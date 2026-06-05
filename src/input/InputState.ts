import { Vec2, vec2 } from '../core/Vector';

export type InputState = {
  move: Vec2;
  camera: Vec2;
  attack: boolean;
  dodge: boolean;
  guard: boolean;
  interact: boolean;
  heal: boolean;
  lockOn: boolean;
  run: boolean;
};

export const createInputState = (): InputState => ({
  move: vec2(),
  camera: vec2(),
  attack: false,
  dodge: false,
  guard: false,
  interact: false,
  heal: false,
  lockOn: false,
  run: false,
});

export interface InputProvider {
  update(): InputState;
  dispose?(): void;
}

export const mergeInputStates = (states: InputState[]): InputState => {
  const merged = createInputState();
  for (const state of states) {
    merged.move.x += state.move.x;
    merged.move.y += state.move.y;
    merged.camera.x += state.camera.x;
    merged.camera.y += state.camera.y;
    merged.attack ||= state.attack;
    merged.dodge ||= state.dodge;
    merged.guard ||= state.guard;
    merged.interact ||= state.interact;
    merged.heal ||= state.heal;
    merged.lockOn ||= state.lockOn;
    merged.run ||= state.run;
  }
  merged.move.x = Math.max(-1, Math.min(1, merged.move.x));
  merged.move.y = Math.max(-1, Math.min(1, merged.move.y));
  return merged;
};
