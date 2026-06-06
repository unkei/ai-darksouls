import { describe, expect, it } from 'vitest';
import { Enemy, enemyConfigs } from '../../src/enemies/Enemy';
import { Player } from '../../src/player/Player';

describe('Enemy visuals', () => {
  it('faces the player while chasing and exposes articulated limbs', () => {
    const enemy = new Enemy(enemyConfigs.grunt, { x: 0, y: 0, z: 0 });
    const player = new Player();
    player.position = { x: 2, y: 0, z: 0 };

    enemy.update(0.2, player);

    expect(enemy.mesh.rotation.y).toBeCloseTo(Math.PI / 2, 1);
    expect(enemy.mesh.getObjectByName('enemy-left-arm')).toBeTruthy();
    expect(enemy.mesh.getObjectByName('enemy-right-arm')).toBeTruthy();
    expect(enemy.mesh.getObjectByName('enemy-weapon')).toBeTruthy();
  });

  it('shows a distinct attack pose during attack frames', () => {
    const enemy = new Enemy(enemyConfigs.grunt, { x: 0, y: 0, z: 0 });
    const player = new Player();
    player.position = { x: 0, y: 0, z: 0.7 };

    enemy.update(0.016, player);
    enemy.update(enemy.config.windup + 0.01, player);

    const weapon = enemy.mesh.getObjectByName('enemy-weapon');
    expect(enemy.fsm.state).toBe('Attack');
    expect(weapon?.visible).toBe(true);
    expect(weapon?.rotation.x).toBeLessThan(-0.35);
  });

  it('exposes readable telegraph and attack effects', () => {
    const enemy = new Enemy(enemyConfigs.grunt, { x: 0, y: 0, z: 0 });
    const player = new Player();
    player.position = { x: 0, y: 0, z: 0.7 };

    enemy.update(0.016, player);

    expect(enemy.fsm.state).toBe('Windup');
    expect(enemy.mesh.getObjectByName('enemy-warning-ring')?.visible).toBe(true);
    expect(enemy.mesh.getObjectByName('enemy-attack-arc')?.visible).toBe(false);

    enemy.update(enemy.config.windup + 0.01, player);

    expect(enemy.fsm.state).toBe('Attack');
    expect(enemy.mesh.getObjectByName('enemy-warning-ring')?.visible).toBe(false);
    expect(enemy.mesh.getObjectByName('enemy-attack-arc')?.visible).toBe(true);

    enemy.takeDamage(1);

    expect(enemy.mesh.getObjectByName('enemy-hit-flash')?.visible).toBe(true);
  });
});
