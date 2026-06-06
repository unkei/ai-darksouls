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

  constructor(position: Vec3) {
    super({ ...bossConfig }, position);
    this.mesh.scale.setScalar(1.65);
    this.patternMarker = createBossPatternMarker();
    this.mesh.add(this.patternMarker);
    this.syncBossPatternVisuals();
  }

  get currentPatternId(): BossPatternId {
    return BOSS_PATTERNS[this.patternIndex].id;
  }

  get currentAttackCueId(): BossAttackCueId {
    return BOSS_PATTERNS[this.patternIndex].attackCueId;
  }

  override update(delta: number, player: import('../player/Player').Player): void {
    this.patternTimer += delta;
    if (this.patternTimer > 4) {
      this.patternTimer = 0;
      this.patternIndex = (this.patternIndex + 1) % BOSS_PATTERNS.length;
      this.applyPattern(BOSS_PATTERNS[this.patternIndex]);
    }
    super.update(delta, player);
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
