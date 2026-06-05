import { describe, expect, it } from 'vitest';
import { GamepadInput, GamepadLike } from '../../src/input/GamepadInput';

describe('GamepadInput', () => {
  it('normalizes axes and buttons into shared actions', () => {
    const pad: GamepadLike = {
      axes: [0.5, -1, 0.25, -0.25],
      buttons: [
        { pressed: true },
        { pressed: false },
        { pressed: true },
        { pressed: false },
        { pressed: true },
        { pressed: true },
      ],
    };
    const input = new GamepadInput(() => [pad]).update();

    expect(input.move).toEqual({ x: -0.5, y: 1 });
    expect(input.camera.x).toBeCloseTo(-0.0125);
    expect(input.dodge).toBe(true);
    expect(input.attack).toBe(true);
    expect(input.guard).toBe(true);
    expect(input.lockOn).toBe(true);
  });
});
