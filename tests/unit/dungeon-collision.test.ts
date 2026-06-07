import { describe, expect, it } from 'vitest';
import { createInputState } from '../../src/input/InputState';
import { Player } from '../../src/player/Player';
import { Dungeon } from '../../src/world/Dungeon';

describe('Dungeon collision', () => {
  it('pushes the player out of internal walls', () => {
    const dungeon = new Dungeon();
    const player = new Player();
    player.position = { x: -3.5, y: 0, z: -5 };

    dungeon.update(player, false);

    expect(Math.abs(player.position.x - -3.5)).toBeGreaterThan(0.6);
  });

  it('prevents dodge movement from ending inside the outer wall', () => {
    const dungeon = new Dungeon();
    const player = new Player();
    player.position = { x: 11.8, y: 0, z: 0 };
    const input = createInputState();
    input.dodge = true;
    input.move.x = 1;

    player.update(0.016, input, 0);
    player.update(0.1, createInputState(), 0);
    dungeon.update(player, false);

    expect(player.position.x).toBeLessThanOrEqual(11.45);
  });

  it('pushes the player out of pillar collision', () => {
    const dungeon = new Dungeon();
    const player = new Player();
    player.position = { x: -6, y: 0, z: -22 };

    dungeon.update(player, false);

    expect(Math.hypot(player.position.x - -6, player.position.z - -22)).toBeGreaterThan(0.9);
  });

  it('resolves enemy movement against interior walls', () => {
    const dungeon = new Dungeon();
    const position = { x: -3.5, y: 0, z: -5 };

    dungeon.resolveCircleCollision(position, 0.45);

    expect(Math.abs(position.x - -3.5)).toBeGreaterThan(0.55);
  });
});
