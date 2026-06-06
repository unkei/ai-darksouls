import { describe, expect, it } from 'vitest';
import { Dungeon } from '../../src/world/Dungeon';
import { Player } from '../../src/player/Player';

describe('Dungeon rest interactions', () => {
  it('reports a cinder shrine rest when the player interacts near the active shrine', () => {
    const dungeon = new Dungeon();
    const player = new Player();
    player.hp = 20;
    player.stamina = 12;
    player.flasks = 0;
    player.position = { x: 0, y: 0, z: 2.5 };

    const event = dungeon.update(player, true);

    expect(event.restedAtCinderShrine).toBe(true);
    expect(player.hp).toBe(100);
    expect(player.stamina).toBe(100);
    expect(player.flasks).toBe(3);
  });

  it('does not report a cinder shrine rest when interact is away from a shrine', () => {
    const dungeon = new Dungeon();
    const player = new Player();
    player.position = { x: 5, y: 0, z: 0 };

    const event = dungeon.update(player, true);

    expect(event.restedAtCinderShrine).toBe(false);
  });
});
