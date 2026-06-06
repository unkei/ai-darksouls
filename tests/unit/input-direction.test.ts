import { describe, expect, it } from 'vitest';
import { GamepadInput, GamepadLike } from '../../src/input/GamepadInput';
import { KeyboardMouseInput } from '../../src/input/KeyboardMouseInput';
import { TouchInput } from '../../src/input/TouchInput';

describe('shared horizontal input direction', () => {
  it('maps keyboard A to left and D to right', () => {
    const target = document.createElement('div');
    const input = new KeyboardMouseInput(target);

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    expect(input.update().move.x).toBe(-1);

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
    expect(input.update().move.x).toBe(1);

    input.dispose();
  });

  it('maps touch stick drag left to negative x and right to positive x', () => {
    const parent = document.createElement('div');
    const input = new TouchInput(parent);
    const stick = input.root.querySelector<HTMLElement>('[data-zone="move"]');
    expect(stick).toBeTruthy();

    stick?.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 100, clientY: 100, bubbles: true }));
    input.root.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 45, clientY: 100, bubbles: true }));
    expect(input.update().move.x).toBe(-1);

    input.root.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 155, clientY: 100, bubbles: true }));
    expect(input.update().move.x).toBe(1);

    input.dispose();
  });

  it('preserves corrected gamepad left and right convention', () => {
    const leftPad: GamepadLike = { axes: [-1, 0, 0, 0], buttons: [] };
    const rightPad: GamepadLike = { axes: [1, 0, 0, 0], buttons: [] };

    expect(new GamepadInput(() => [leftPad]).update().move.x).toBe(-1);
    expect(new GamepadInput(() => [rightPad]).update().move.x).toBe(1);
  });

  it('marks keyboard, touch, and gamepad buttons as flow advance input', () => {
    const target = document.createElement('div');
    const keyboard = new KeyboardMouseInput(target);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ' }));
    expect(keyboard.update().advance).toBe(true);
    keyboard.dispose();

    const parent = document.createElement('div');
    const touch = new TouchInput(parent);
    const stick = touch.root.querySelector<HTMLElement>('[data-zone="move"]');
    stick?.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 100, clientY: 100, bubbles: true }));
    expect(touch.update().advance).toBe(true);
    touch.dispose();

    const pad: GamepadLike = { axes: [0, 0, 0, 0], buttons: [{ pressed: true }] };
    expect(new GamepadInput(() => [pad]).update().advance).toBe(true);
  });
});
