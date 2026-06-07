import { describe, expect, it } from 'vitest';
import { TouchInput } from '../../src/input/TouchInput';

describe('TouchInput', () => {
  it('prevents browser touch gestures on touch controls', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const input = new TouchInput(parent);

    const attack = input.root.querySelector<HTMLButtonElement>('[data-action="attack"]');
    if (!attack) throw new Error('Missing attack button');

    const touchStart = new Event('touchstart', { bubbles: true, cancelable: true });
    attack.dispatchEvent(touchStart);
    expect(touchStart.defaultPrevented).toBe(true);

    const touchEnd = new Event('touchend', { bubbles: true, cancelable: true });
    attack.dispatchEvent(touchEnd);
    expect(touchEnd.defaultPrevented).toBe(true);

    const gestureStart = new Event('gesturestart', { bubbles: true, cancelable: true });
    input.root.dispatchEvent(gestureStart);
    expect(gestureStart.defaultPrevented).toBe(true);

    input.dispose();
    parent.remove();
  });
});
