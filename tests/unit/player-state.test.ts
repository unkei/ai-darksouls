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
