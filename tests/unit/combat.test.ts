import { describe, expect, it } from 'vitest';
import { CombatSystem } from '../../src/combat/CombatSystem';
import { Enemy, enemyConfigs } from '../../src/enemies/Enemy';
import { createInputState } from '../../src/input/InputState';
import { Player } from '../../src/player/Player';

describe('CombatSystem', () => {
  it('damages nearby enemies when player attacks', () => {
    const player = new Player();
    const enemy = new Enemy(enemyConfigs.grunt, { x: 0, y: 0, z: 1 });
    const input = createInputState();
    input.attack = true;
    player.update(0.016, input, 0);

    new CombatSystem().update(player, [enemy]);

    expect(enemy.hp).toBeLessThan(enemy.config.maxHp);
  });
});
