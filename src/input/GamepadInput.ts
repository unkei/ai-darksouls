import { createInputState, InputProvider, InputState } from './InputState';

export type GamepadLike = {
  axes: readonly number[];
  buttons: readonly { pressed: boolean }[];
};

export class GamepadInput implements InputProvider {
  constructor(private readonly getPads: () => readonly (GamepadLike | null)[] = () => navigator.getGamepads()) {}

  update(): InputState {
    const state = createInputState();
    const pad = this.getPads().find((candidate): candidate is GamepadLike => Boolean(candidate));
    if (!pad) return state;

    state.move.x = deadzone(pad.axes[0] ?? 0);
    state.move.y = -deadzone(pad.axes[1] ?? 0);
    state.camera.x = deadzone(pad.axes[2] ?? 0) * 0.05;
    state.camera.y = deadzone(pad.axes[3] ?? 0) * 0.05;
    state.dodge = Boolean(pad.buttons[0]?.pressed);
    state.attack = Boolean(pad.buttons[2]?.pressed);
    state.interact = Boolean(pad.buttons[1]?.pressed);
    state.heal = Boolean(pad.buttons[3]?.pressed);
    state.guard = Boolean(pad.buttons[4]?.pressed);
    state.lockOn = Boolean(pad.buttons[5]?.pressed);
    return state;
  }
}

const deadzone = (value: number): number => (Math.abs(value) < 0.18 ? 0 : value);
