import * as THREE from 'three';
import { clamp, distance3, normalize3, Vec3 } from '../core/Vector';
import { StateMachine } from '../core/StateMachine';
import { Player } from '../player/Player';

export type EnemyState = 'Idle' | 'Chase' | 'Windup' | 'Attack' | 'Recovery' | 'HitStun' | 'Dead';

export type EnemyConfig = {
  name: string;
  maxHp: number;
  speed: number;
  damage: number;
  attackRange: number;
  aggroRange: number;
  windup: number;
  active: number;
  recovery: number;
  radius: number;
  color: number;
  echoes: number;
};

export class Enemy {
  readonly mesh: THREE.Group;
  readonly fsm = new StateMachine<EnemyState>('Idle');
  hp: number;
  spawn: Vec3;
  position: Vec3;
  hasHitThisAttack = false;

  constructor(readonly config: EnemyConfig, position: Vec3) {
    this.spawn = { ...position };
    this.position = { ...position };
    this.hp = config.maxHp;
    this.mesh = createEnemyMesh(config);
    this.syncMesh();
  }

  update(delta: number, player: Player): void {
    this.fsm.tick(delta);
    if (this.fsm.state === 'Dead') return;
    const distance = distance3(this.position, player.position);

    if (this.fsm.state === 'HitStun' && this.fsm.timeInState > 0.25) this.fsm.set('Chase');
    if (this.fsm.state === 'Windup' && this.fsm.timeInState >= this.config.windup) {
      this.hasHitThisAttack = false;
      this.fsm.set('Attack');
    }
    if (this.fsm.state === 'Attack' && this.fsm.timeInState >= this.config.active) this.fsm.set('Recovery');
    if (this.fsm.state === 'Recovery' && this.fsm.timeInState >= this.config.recovery) this.fsm.set('Chase');

    if (this.fsm.state === 'Idle' && distance < this.config.aggroRange) this.fsm.set('Chase');
    if (this.fsm.state === 'Chase') {
      if (distance <= this.config.attackRange) {
        this.fsm.set('Windup');
      } else {
        const direction = normalize3({ x: player.position.x - this.position.x, y: 0, z: player.position.z - this.position.z });
        this.position.x += direction.x * this.config.speed * delta;
        this.position.z += direction.z * this.config.speed * delta;
      }
    }
    this.syncMesh();
  }

  takeDamage(amount: number): number {
    if (this.fsm.state === 'Dead') return 0;
    this.hp = clamp(this.hp - amount, 0, this.config.maxHp);
    if (this.hp <= 0) {
      this.fsm.set('Dead');
      this.mesh.visible = false;
      return this.config.echoes;
    }
    this.fsm.set('HitStun');
    return 0;
  }

  respawn(): void {
    this.position = { ...this.spawn };
    this.hp = this.config.maxHp;
    this.mesh.visible = true;
    this.fsm.set('Idle');
    this.syncMesh();
  }

  protected syncMesh(): void {
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    const warn = this.fsm.state === 'Windup' || this.fsm.state === 'Attack';
    this.mesh.scale.setScalar(warn ? 1.15 : 1);
  }
}

const createEnemyMesh = (config: EnemyConfig): THREE.Group => {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(config.radius, 1.15, 5), new THREE.MeshStandardMaterial({ color: config.color }));
  body.position.y = 0.58;
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.05), new THREE.MeshStandardMaterial({ color: 0xff4a35 }));
  eye.position.set(0, 0.85, config.radius * 0.75);
  group.add(body, eye);
  return group;
};

export const enemyConfigs = {
  grunt: { name: 'Grunt', maxHp: 35, speed: 1.6, damage: 18, attackRange: 1.1, aggroRange: 5.5, windup: 0.45, active: 0.22, recovery: 0.45, radius: 0.45, color: 0x7f5541, echoes: 20 },
  shield: { name: 'Shield', maxHp: 55, speed: 1.1, damage: 22, attackRange: 1.25, aggroRange: 4.5, windup: 0.65, active: 0.28, recovery: 0.65, radius: 0.55, color: 0x52605b, echoes: 35 },
  fast: { name: 'Fast', maxHp: 26, speed: 2.6, damage: 14, attackRange: 1.0, aggroRange: 6.5, windup: 0.25, active: 0.18, recovery: 0.35, radius: 0.35, color: 0x6d3854, echoes: 25 },
} satisfies Record<string, EnemyConfig>;
