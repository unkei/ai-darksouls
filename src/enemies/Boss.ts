import { Enemy, EnemyConfig } from './Enemy';
import { Vec3 } from '../core/Vector';

const bossConfig: EnemyConfig = {
  name: 'Ashen Warden',
  maxHp: 180,
  speed: 1.35,
  damage: 28,
  attackRange: 1.8,
  aggroRange: 10,
  windup: 0.8,
  active: 0.35,
  recovery: 0.8,
  radius: 0.9,
  color: 0x3f4652,
  echoes: 160,
};

export class Boss extends Enemy {
  private patternTimer = 0;

  constructor(position: Vec3) {
    super(bossConfig, position);
    this.mesh.scale.setScalar(1.65);
  }

  override update(delta: number, player: import('../player/Player').Player): void {
    this.patternTimer += delta;
    if (this.patternTimer > 4) {
      this.patternTimer = 0;
      this.config.windup = this.config.windup === 0.8 ? 1.1 : 0.8;
      this.config.damage = this.config.damage === 28 ? 36 : 28;
      this.config.attackRange = this.config.attackRange === 1.8 ? 2.45 : 1.8;
    }
    super.update(delta, player);
  }
}
