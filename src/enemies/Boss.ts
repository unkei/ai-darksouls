import * as THREE from 'three';
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
  private patternIndex = 0;
  private readonly patternMarker: THREE.Object3D;
  private readonly defeatRing: THREE.Object3D;
  private readonly ashBurst: THREE.Object3D;
  private defeatTime = 0;

  constructor(position: Vec3) {
    super({ ...bossConfig }, position);
    this.mesh.scale.setScalar(1.65);
    this.patternMarker = createBossPatternMarker();
    this.defeatRing = createBossDefeatRing();
    this.ashBurst = createBossAshBurst();
    this.mesh.add(this.patternMarker, this.defeatRing, this.ashBurst);
    this.syncBossPatternVisuals();
  }

  get currentPatternId(): BossPatternId {
    return BOSS_PATTERNS[this.patternIndex].id;
  }

  get currentAttackCueId(): BossAttackCueId {
    return BOSS_PATTERNS[this.patternIndex].attackCueId;
  }

  override update(delta: number, player: import('../player/Player').Player): void {
    if (this.fsm.state === 'Dead') {
      this.updateDefeatPresentation(delta);
      return;
    }
    this.patternTimer += delta;
    if (this.patternTimer > 4) {
      this.patternTimer = 0;
      this.patternIndex = (this.patternIndex + 1) % BOSS_PATTERNS.length;
      this.applyPattern(BOSS_PATTERNS[this.patternIndex]);
    }
    super.update(delta, player);
    this.syncBossPatternVisuals();
  }

  override takeDamage(amount: number): number {
    const echoes = super.takeDamage(amount);
    if (this.fsm.state === 'Dead') {
      this.mesh.visible = true;
      this.defeatTime = 0;
      this.updateDefeatPresentation(0);
    }
    return echoes;
  }

  updateDefeatPresentation(delta: number): void {
    this.defeatTime += delta;
    this.mesh.visible = true;
    this.patternMarker.visible = false;
    this.defeatRing.visible = true;
    this.ashBurst.visible = true;
    const collapse = Math.min(1, this.defeatTime / 2.4);
    this.mesh.scale.set(1.65 + collapse * 0.16, 1.65 - collapse * 0.85, 1.65 + collapse * 0.16);
    this.mesh.rotation.x = collapse * 0.38;
    this.mesh.position.y = this.position.y - collapse * 0.34;
    this.defeatRing.scale.setScalar(0.8 + collapse * 3.6);
    this.defeatRing.rotation.z = this.defeatTime * 1.2;
    const ringMaterial = this.defeatRing instanceof THREE.Mesh ? this.defeatRing.material : null;
    if (ringMaterial instanceof THREE.MeshBasicMaterial) ringMaterial.opacity = 0.66 * (1 - collapse * 0.72);
    this.ashBurst.scale.setScalar(0.7 + collapse * 2.4);
    this.ashBurst.rotation.y = this.defeatTime * 0.8;
    const ashMaterial = this.ashBurst instanceof THREE.Mesh ? this.ashBurst.material : null;
    if (ashMaterial instanceof THREE.MeshBasicMaterial) ashMaterial.opacity = 0.52 * (1 - collapse * 0.35);
  }

  override respawn(): void {
    super.respawn();
    this.defeatTime = 0;
    this.mesh.scale.setScalar(1.65);
    this.mesh.rotation.set(0, this.facing, 0);
    this.mesh.position.y = this.position.y;
    this.defeatRing.visible = false;
    this.ashBurst.visible = false;
    this.syncBossPatternVisuals();
  }

  private applyPattern(pattern: BossPattern): void {
    this.config.windup = pattern.windup;
    this.config.damage = pattern.damage;
    this.config.attackRange = pattern.attackRange;
  }

  private syncBossPatternVisuals(): void {
    const pattern = BOSS_PATTERNS[this.patternIndex];
    this.patternMarker.visible = this.fsm.state !== 'Dead';
    this.defeatRing.visible = this.fsm.state === 'Dead';
    this.ashBurst.visible = this.fsm.state === 'Dead';
    this.patternMarker.scale.set(pattern.markerScale, pattern.markerScale, pattern.markerScale);
    const material = this.patternMarker instanceof THREE.Mesh ? this.patternMarker.material : null;
    if (material instanceof THREE.MeshBasicMaterial) material.color.setHex(pattern.markerColor);
  }
}

type BossPatternId = 'boss-cleave' | 'boss-lunge';
export type BossAttackCueId = 'boss-cleave-attack' | 'boss-lunge-attack';

type BossPattern = {
  id: BossPatternId;
  attackCueId: BossAttackCueId;
  windup: number;
  damage: number;
  attackRange: number;
  markerScale: number;
  markerColor: number;
};

const createBossDefeatRing = (): THREE.Object3D => {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.68, 0.9, 24),
    new THREE.MeshBasicMaterial({ color: 0xffc36b, transparent: true, opacity: 0.66, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.name = 'boss-defeat-ring';
  ring.position.y = 0.08;
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  ring.renderOrder = 2;
  return ring;
};

const createBossAshBurst = (): THREE.Object3D => {
  const burst = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.0, 1),
    new THREE.MeshBasicMaterial({ color: 0xd8b58a, transparent: true, opacity: 0.52, wireframe: true, depthWrite: false }),
  );
  burst.name = 'boss-ash-burst';
  burst.position.y = 1.0;
  burst.visible = false;
  burst.renderOrder = 2;
  return burst;
};

const BOSS_PATTERNS: BossPattern[] = [
  {
    id: 'boss-cleave',
    attackCueId: 'boss-cleave-attack',
    windup: 0.8,
    damage: 28,
    attackRange: 1.8,
    markerScale: 1,
    markerColor: 0xff9d52,
  },
  {
    id: 'boss-lunge',
    attackCueId: 'boss-lunge-attack',
    windup: 1.1,
    damage: 36,
    attackRange: 2.45,
    markerScale: 1.28,
    markerColor: 0xff4b4b,
  },
];

const createBossPatternMarker = (): THREE.Object3D => {
  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.045, 6, 20),
    new THREE.MeshBasicMaterial({ color: 0xff9d52, transparent: true, opacity: 0.58, depthWrite: false }),
  );
  marker.name = 'boss-pattern-marker';
  marker.position.y = 1.52;
  marker.rotation.x = Math.PI / 2;
  marker.renderOrder = 1;
  return marker;
};
