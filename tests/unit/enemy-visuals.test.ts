import { describe, expect, it } from 'vitest';
import { Boss } from '../../src/enemies/Boss';
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
    expect(enemy.mesh.getObjectByName('enemy-left-shoulder')).toBeTruthy();
    expect(enemy.mesh.getObjectByName('enemy-right-shoulder')).toBeTruthy();
    expect(enemy.mesh.getObjectByName('enemy-left-knee')).toBeTruthy();
    expect(enemy.mesh.getObjectByName('enemy-right-knee')).toBeTruthy();
    expect(enemy.mesh.getObjectByName('enemy-head')).toBeTruthy();
    expect(enemy.mesh.getObjectByName('enemy-weapon')).toBeTruthy();
  });

  it('shows a distinct attack pose during attack frames', () => {
    const enemy = new Enemy(enemyConfigs.grunt, { x: 0, y: 0, z: 0 });
    const player = new Player();
    player.position = { x: 0, y: 0, z: 0.7 };

    enemy.update(0.016, player);
    enemy.update(enemy.config.windup + 0.01, player);

    const weapon = enemy.mesh.getObjectByName('enemy-weapon');
    const weaponGlow = enemy.mesh.getObjectByName('enemy-weapon-glow');
    expect(enemy.fsm.state).toBe('Attack');
    expect(weapon?.visible).toBe(true);
    expect(weapon?.rotation.x).toBeLessThan(-0.35);
    expect(weaponGlow?.visible).toBe(true);
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

  it('lowers threat visuals during recovery', () => {
    const enemy = new Enemy(enemyConfigs.grunt, { x: 0, y: 0, z: 0 });
    const player = new Player();
    player.position = { x: 0, y: 0, z: 0.7 };

    enemy.update(0.016, player);
    enemy.update(enemy.config.windup + 0.01, player);
    enemy.update(enemy.config.active + 0.01, player);

    const recoveryCue = enemy.mesh.getObjectByName('enemy-recovery-cue');
    const weapon = enemy.mesh.getObjectByName('enemy-weapon');

    expect(enemy.fsm.state).toBe('Recovery');
    expect(enemy.mesh.getObjectByName('enemy-warning-ring')?.visible).toBe(false);
    expect(enemy.mesh.getObjectByName('enemy-attack-arc')?.visible).toBe(false);
    expect(recoveryCue?.visible).toBe(true);
    expect(weapon?.rotation.x).toBeGreaterThan(-0.25);
  });

  it('exposes named boss pattern visuals and attack cue ids', () => {
    const boss = new Boss({ x: 0, y: 0, z: 0 });
    const player = new Player();
    player.position = { x: 0, y: 0, z: 1.2 };

    expect(boss.currentPatternId).toBe('boss-cleave');
    expect(boss.currentAttackCueId).toBe('boss-cleave-attack');

    boss.update(4.1, player);

    expect(boss.currentPatternId).toBe('boss-lunge');
    expect(boss.currentAttackCueId).toBe('boss-lunge-attack');
    expect(boss.mesh.getObjectByName('boss-pattern-marker')?.visible).toBe(true);
    expect(boss.mesh.getObjectByName('boss-pattern-marker')?.scale.x).toBeGreaterThan(1.1);
  });
});
