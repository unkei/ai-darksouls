import { distance3 } from '../core/Vector';
import { Enemy } from '../enemies/Enemy';
import { Boss } from '../enemies/Boss';
import { Player } from '../player/Player';

export class CombatSystem {
  update(player: Player, enemies: Array<Enemy | Boss>): void {
    if (player.pendingAttack) {
      for (const enemy of enemies) {
        const distance = distance3(player.position, enemy.position);
        if (distance <= 1.65 && enemy.fsm.state !== 'Dead') {
          player.echoes += enemy.takeDamage(24);
        }
      }
    }

    for (const enemy of enemies) {
      if (enemy.fsm.state !== 'Attack' || enemy.hasHitThisAttack) continue;
      if (distance3(player.position, enemy.position) <= enemy.config.attackRange + 0.45) {
        player.takeDamage(enemy.config.damage, player.fsm.state === 'Guard');
        enemy.hasHitThisAttack = true;
      }
    }
  }
}
