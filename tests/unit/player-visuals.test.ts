import { describe, expect, it } from 'vitest';
import { createInputState } from '../../src/input/InputState';
import { Player } from '../../src/player/Player';

describe('Player visuals', () => {
  it('faces the direction of movement and exposes an articulated rig', () => {
    const player = new Player();
    const input = createInputState();
    input.move.x = 1;

    player.update(0.1, input, 0);

    expect(player.facing).toBeCloseTo(Math.PI / 2, 3);
    expect(player.mesh.rotation.y).toBeCloseTo(player.facing, 3);
    expect(player.mesh.getObjectByName('player-left-arm')).toBeTruthy();
    expect(player.mesh.getObjectByName('player-right-arm')).toBeTruthy();
    expect(player.mesh.getObjectByName('player-weapon')).toBeTruthy();
  });

  it('changes weapon and arm pose while attacking', () => {
    const player = new Player();
    const input = createInputState();
    input.attack = true;

    player.update(0.016, input, 0);

    const weapon = player.mesh.getObjectByName('player-weapon');
    const rightArm = player.mesh.getObjectByName('player-right-arm');
    expect(weapon?.visible).toBe(true);
    expect(weapon?.rotation.x).toBeLessThan(-0.45);
    expect(rightArm?.rotation.x).toBeLessThan(-0.3);
  });
});
