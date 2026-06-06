import { describe, expect, it } from 'vitest';
import { createInputState } from '../../src/input/InputState';
import { Player } from '../../src/player/Player';

describe('Player visuals', () => {
  it('faces the direction of movement and exposes an articulated rig', () => {
    const player = new Player();
    const input = createInputState();
    input.move.x = 1;

    player.update(0.1, input, 0);

    expect(player.facing).toBeCloseTo(-Math.PI / 2, 3);
    expect(player.mesh.rotation.y).toBeCloseTo(player.facing, 3);
    expect(player.mesh.getObjectByName('player-left-arm')).toBeTruthy();
    expect(player.mesh.getObjectByName('player-right-arm')).toBeTruthy();
    expect(player.mesh.getObjectByName('player-left-foot')).toBeTruthy();
    expect(player.mesh.getObjectByName('player-right-foot')).toBeTruthy();
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

  it('separates attack startup from active arc orientation', () => {
    const player = new Player();
    const input = createInputState();
    input.attack = true;

    player.update(0.016, input, 0);

    const startup = player.mesh.getObjectByName('player-attack-startup');
    const activeArc = player.mesh.getObjectByName('player-attack-arc');
    const direction = player.mesh.getObjectByName('player-weapon-direction');
    const facingMarker = player.mesh.getObjectByName('player-face');

    expect(startup?.visible).toBe(true);
    expect(activeArc?.visible).toBe(false);
    expect(direction?.visible).toBe(true);
    expect(direction?.position.z).toBeGreaterThan(0.55);
    expect(facingMarker?.visible).toBe(true);

    player.update(0.14, createInputState(), 0);

    expect(startup?.visible).toBe(false);
    expect(activeArc?.visible).toBe(true);
    expect(activeArc?.rotation.z).toBeGreaterThan(0.1);
  });

  it('exposes readable state effects for combat actions', () => {
    const player = new Player();
    const attack = createInputState();
    attack.attack = true;

    player.update(0.016, attack, 0);

    expect(player.mesh.getObjectByName('player-attack-startup')?.visible).toBe(true);
    expect(player.mesh.getObjectByName('player-attack-arc')?.visible).toBe(false);
    expect(player.mesh.getObjectByName('player-guard-shield')?.visible).toBe(false);

    player.respawn({ x: 0, y: 0, z: 0 });
    const guard = createInputState();
    guard.guard = true;
    player.update(0.016, guard, 0);

    expect(player.mesh.getObjectByName('player-guard-shield')?.visible).toBe(true);

    player.respawn({ x: 0, y: 0, z: 0 });
    const dodge = createInputState();
    dodge.dodge = true;
    player.update(0.016, dodge, 0);

    expect(player.mesh.getObjectByName('player-dodge-trail')?.visible).toBe(true);

    player.takeDamage(10, false);
    player.syncVisuals();

    expect(player.mesh.getObjectByName('player-hit-flash')?.visible).toBe(true);
  });

  it('hides state-only effects after their action ends', () => {
    const player = new Player();
    const dodge = createInputState();
    dodge.dodge = true;

    player.update(0.016, dodge, 0);
    expect(player.mesh.getObjectByName('player-dodge-trail')?.visible).toBe(true);

    player.update(0.5, createInputState(), 0);

    expect(player.mesh.getObjectByName('player-dodge-trail')?.visible).toBe(false);

    player.takeDamage(10, false);
    player.syncVisuals();
    expect(player.mesh.getObjectByName('player-hit-flash')?.visible).toBe(true);

    player.update(0.5, createInputState(), 0);

    expect(player.mesh.getObjectByName('player-hit-flash')?.visible).toBe(false);
  });
});
