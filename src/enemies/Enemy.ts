import * as THREE from 'three';
import { clamp, distance3, normalize3, Vec3 } from '../core/Vector';
import { createAtlasTexture } from '../game/GeneratedTextures';
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
  facing = 0;
  protected readonly rig: EnemyRig;

  constructor(readonly config: EnemyConfig, position: Vec3) {
    this.spawn = { ...position };
    this.position = { ...position };
    this.hp = config.maxHp;
    const built = createEnemyMesh(config);
    this.mesh = built.group;
    this.rig = built.rig;
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
        this.facing = Math.atan2(direction.x, direction.z);
        this.position.x += direction.x * this.config.speed * delta;
        this.position.z += direction.z * this.config.speed * delta;
      }
    }
    if (this.fsm.state === 'Windup' || this.fsm.state === 'Attack' || this.fsm.state === 'Recovery') {
      this.facing = Math.atan2(player.position.x - this.position.x, player.position.z - this.position.z);
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
    this.mesh.rotation.y = this.facing;
    const warn = this.fsm.state === 'Windup' || this.fsm.state === 'Attack';
    this.mesh.scale.setScalar(warn ? 1.08 : 1);
    poseEnemyRig(this.rig, this.fsm.state, this.fsm.timeInState);
  }
}

type EnemyRig = {
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  weapon: THREE.Object3D;
};

const createEnemyMesh = (config: EnemyConfig): { group: THREE.Group; rig: EnemyRig } => {
  const group = new THREE.Group();
  const armorTexture = createAtlasTexture('armor', [1, 1]);
  const hide = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.9, metalness: 0.05, map: armorTexture });
  const ember = new THREE.MeshStandardMaterial({ color: 0xff4a35, emissive: 0x7a1208, emissiveIntensity: 1.5 });
  const bone = new THREE.MeshStandardMaterial({ color: 0x776452, roughness: 0.8, map: armorTexture });
  const iron = new THREE.MeshStandardMaterial({ color: 0x8f948d, roughness: 0.55, metalness: 0.48 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(config.radius * 0.72, 0.75, 4, 8), hide);
  body.name = 'enemy-body';
  body.position.y = 0.72;
  const head = new THREE.Mesh(new THREE.ConeGeometry(config.radius * 0.55, 0.42, 5), hide);
  head.name = 'enemy-head';
  head.position.y = 1.25;
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.05), ember);
  eye.name = 'enemy-eye';
  eye.position.set(0, 1.23, config.radius * 0.45);
  const leftArm = enemyLimb('enemy-left-arm', bone, config.radius * 0.18, 0.5);
  leftArm.position.set(-config.radius * 0.8, 0.9, 0);
  const rightArm = enemyLimb('enemy-right-arm', bone, config.radius * 0.18, 0.5);
  rightArm.position.set(config.radius * 0.8, 0.9, 0);
  const leftLeg = enemyLimb('enemy-left-leg', hide, config.radius * 0.2, 0.46);
  leftLeg.position.set(-config.radius * 0.28, 0.32, 0);
  const rightLeg = enemyLimb('enemy-right-leg', hide, config.radius * 0.2, 0.46);
  rightLeg.position.set(config.radius * 0.28, 0.32, 0);
  const weapon = new THREE.Mesh(new THREE.BoxGeometry(config.radius * 0.15, config.radius * 0.15, config.radius * 1.6), iron);
  weapon.name = 'enemy-weapon';
  weapon.position.set(0, -0.25, config.radius * 0.7);
  rightArm.add(weapon);

  group.add(body, head, eye, leftArm, rightArm, leftLeg, rightLeg);
  return { group, rig: { leftArm, rightArm, leftLeg, rightLeg, weapon } };
};

const enemyLimb = (name: string, material: THREE.Material, radius: number, length: number): THREE.Mesh => {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 8), material);
  mesh.name = name;
  return mesh;
};

const poseEnemyRig = (rig: EnemyRig, state: EnemyState, time: number): void => {
  const stride = Math.sin(time * 10) * 0.35;
  rig.weapon.visible = state !== 'Dead';
  rig.leftArm.rotation.set(0.05, 0, 0.35);
  rig.rightArm.rotation.set(0.05, 0, -0.35);
  rig.leftLeg.rotation.set(stride, 0, 0.03);
  rig.rightLeg.rotation.set(-stride, 0, -0.03);
  rig.weapon.rotation.set(-0.1, 0, 0);

  if (state === 'Windup') {
    rig.rightArm.rotation.set(0.75, -0.25, -0.55);
    rig.weapon.rotation.set(0.55, 0, 0);
  }
  if (state === 'Attack') {
    rig.rightArm.rotation.set(-0.95, -0.12, -0.4);
    rig.leftArm.rotation.set(-0.3, 0.18, 0.45);
    rig.weapon.rotation.set(-0.7, 0, 0);
  }
  if (state === 'Recovery') {
    rig.rightArm.rotation.set(-0.35, 0, -0.35);
  }
  if (state === 'HitStun') {
    rig.leftArm.rotation.x = 0.8;
    rig.rightArm.rotation.x = 0.8;
  }
};

export const enemyConfigs = {
  grunt: { name: 'Grunt', maxHp: 35, speed: 1.6, damage: 18, attackRange: 1.1, aggroRange: 5.5, windup: 0.45, active: 0.22, recovery: 0.45, radius: 0.45, color: 0x7f5541, echoes: 20 },
  shield: { name: 'Shield', maxHp: 55, speed: 1.1, damage: 22, attackRange: 1.25, aggroRange: 4.5, windup: 0.65, active: 0.28, recovery: 0.65, radius: 0.55, color: 0x52605b, echoes: 35 },
  fast: { name: 'Fast', maxHp: 26, speed: 2.6, damage: 14, attackRange: 1.0, aggroRange: 6.5, windup: 0.25, active: 0.18, recovery: 0.35, radius: 0.35, color: 0x6d3854, echoes: 25 },
} satisfies Record<string, EnemyConfig>;
