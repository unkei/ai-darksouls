import { describe, expect, it } from 'vitest';
import { createInputState } from '../../src/input/InputState';
import { Player } from '../../src/player/Player';

describe('Player state machine', () => {
  it('spends stamina and enters attack state', () => {
    const player = new Player();
    const input = createInputState();
    input.attack = true;

    player.update(0.016, input, 0);

    expect(player.fsm.state).toBe('Attack');
    expect(player.stamina).toBeLessThan(100);
  });

  it('blocks dodge when stamina is insufficient', () => {
    const player = new Player();
    player.stamina = 5;
    const input = createInputState();
    input.dodge = true;

    player.update(0.016, input, 0);

    expect(player.fsm.state).not.toBe('Dodge');
  });

  it('moves screen-right input toward camera-right world space', () => {
    const player = new Player();
    const input = createInputState();
    input.move.x = 1;

    player.update(1, input, 0);

    expect(player.position.x).toBeLessThan(0);
  });

  it('dodges screen-left input toward camera-left world space', () => {
    const player = new Player();
    const input = createInputState();
    input.move.x = -1;
    input.dodge = true;

    player.update(0.016, input, 0);
    player.update(0.05, createInputState(), 0);

    expect(player.position.x).toBeGreaterThan(0);
  });

  it('guards damage with reduced HP loss', () => {
    const player = new Player();
    const input = createInputState();
    input.guard = true;
    player.update(0.016, input, 0);

    player.takeDamage(40, player.fsm.state === 'Guard');

    expect(player.hp).toBeGreaterThan(60);
    expect(player.stamina).toBeLessThan(100);
  });
});
