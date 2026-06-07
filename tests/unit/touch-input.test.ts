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

  it('releases a button by pointer id when pointer capture retargets the event to the root', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const input = new TouchInput(parent);

    const attack = input.root.querySelector<HTMLButtonElement>('[data-action="attack"]');
    if (!attack) throw new Error('Missing attack button');

    attack.dispatchEvent(createPointerEvent('pointerdown', { pointerId: 12, clientX: 240, clientY: 340 }));
    expect(input.update().attack).toBe(true);

    input.root.dispatchEvent(createPointerEvent('pointerup', { pointerId: 12, clientX: 240, clientY: 340 }));
    expect(input.update().attack).toBe(false);

    input.dispose();
    parent.remove();
  });

  it('keeps stick and attack pointers independent during multitouch', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const input = new TouchInput(parent);

    const stick = input.root.querySelector<HTMLElement>('[data-zone="move"]');
    const attack = input.root.querySelector<HTMLButtonElement>('[data-action="attack"]');
    if (!stick || !attack) throw new Error('Missing touch controls');

    stick.dispatchEvent(createPointerEvent('pointerdown', { pointerId: 21, clientX: 80, clientY: 400 }));
    attack.dispatchEvent(createPointerEvent('pointerdown', { pointerId: 22, clientX: 280, clientY: 400 }));
    stick.dispatchEvent(createPointerEvent('pointermove', { pointerId: 21, clientX: 118, clientY: 370 }));

    const active = input.update();
    expect(active.attack).toBe(true);
    expect(active.move.x).toBeGreaterThan(0);
    expect(active.move.y).toBeGreaterThan(0);

    input.root.dispatchEvent(createPointerEvent('pointerup', { pointerId: 22, clientX: 280, clientY: 400 }));
    const afterAttackRelease = input.update();
    expect(afterAttackRelease.attack).toBe(false);
    expect(afterAttackRelease.move.x).toBeGreaterThan(0);

    input.root.dispatchEvent(createPointerEvent('pointerup', { pointerId: 21, clientX: 118, clientY: 370 }));
    const released = input.update();
    expect(released.move.x).toBe(0);
    expect(released.move.y).toBe(0);
    expect(released.advance).toBe(false);

    input.dispose();
    parent.remove();
  });
});

const createPointerEvent = (
  type: string,
  init: { pointerId: number; clientX: number; clientY: number },
): Event => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { value: init.pointerId },
    clientX: { value: init.clientX },
    clientY: { value: init.clientY },
  });
  return event;
};
