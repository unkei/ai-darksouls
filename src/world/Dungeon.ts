import * as THREE from 'three';
import { clamp, distance3, Vec3, vec3 } from '../core/Vector';
import { createAtlasTexture } from '../game/GeneratedTextures';
import { Player } from '../player/Player';
import { Bonfire } from './Bonfire';
import { ShortcutDoor } from './ShortcutDoor';
import { EchoDrop } from './Item';

type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };
type WallRect = { minX: number; maxX: number; minZ: number; maxZ: number };
type CircleBlocker = { x: number; z: number; radius: number };
export type DungeonUpdateEvent = { restedAtCinderShrine: boolean };

const PLAYER_COLLISION_RADIUS = 0.55;
const WALL_DATA: Array<[number, number, number, number]> = [
  [0, -37, 24, 1],
  [0, 7, 24, 1],
  [-12, -15, 1, 44],
  [12, -15, 1, 44],
  [-3.5, -5, 1, 10],
  [4.5, -12, 1, 12],
  [0, -24, 12, 1],
  [-7.5, -27, 1, 10],
];

export class Dungeon {
  readonly group = new THREE.Group();
  readonly obstructionMeshes: THREE.Mesh[] = [];
  readonly checkpoints = [new Bonfire(vec3(0, 0, 2.5)), new Bonfire(vec3(0, 0, -20))];
  readonly shortcut = new ShortcutDoor(vec3(-4, 0, -7));
  echoDrop: EchoDrop | null = null;
  activeCheckpoint: Vec3 = vec3(0, 0, 2.5);
  readonly playableBounds: Bounds = { minX: -12, maxX: 12, minZ: -37, maxZ: 7 };
  private readonly bounds = this.playableBounds;
  private readonly walls: WallRect[] = WALL_DATA.map(([x, z, width, depth]) => ({
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
  }));
  private readonly circleBlockers: CircleBlocker[] = [
    { x: -6, z: -22, radius: 0.58 },
    { x: 6, z: -22, radius: 0.58 },
    { x: -6, z: -29, radius: 0.58 },
    { x: 6, z: -29, radius: 0.58 },
  ];
  private readonly raycaster = new THREE.Raycaster();

  constructor() {
    this.build();
  }

  update(player: Player, interact: boolean): DungeonUpdateEvent {
    let restedAtCinderShrine = false;
    this.resolveCircleCollision(player.position, PLAYER_COLLISION_RADIUS);

    for (const checkpoint of this.checkpoints) {
      if (distance3(player.position, checkpoint.position) < 1.4) {
        this.activeCheckpoint = checkpoint.position;
        if (interact) {
          player.refill();
          restedAtCinderShrine = true;
        }
      }
    }
    if (interact && this.shortcut.interact(player.position)) {
      player.fsm.set('Interact');
    }
    if (this.echoDrop?.canCollect(player.position)) {
      player.echoes += this.echoDrop.amount;
      this.group.remove(this.echoDrop.mesh);
      this.echoDrop = null;
    }
    return { restedAtCinderShrine };
  }

  resolveCircleCollision(position: Vec3, radius: number): void {
    position.x = clamp(position.x, this.bounds.minX + radius, this.bounds.maxX - radius);
    position.z = clamp(position.z, this.bounds.minZ + radius, this.bounds.maxZ - radius);

    for (const wall of this.walls) {
      const expanded = {
        minX: wall.minX - radius,
        maxX: wall.maxX + radius,
        minZ: wall.minZ - radius,
        maxZ: wall.maxZ + radius,
      };
      const insideX = position.x > expanded.minX && position.x < expanded.maxX;
      const insideZ = position.z > expanded.minZ && position.z < expanded.maxZ;
      if (!insideX || !insideZ) continue;

      const pushLeft = Math.abs(position.x - expanded.minX);
      const pushRight = Math.abs(expanded.maxX - position.x);
      const pushBack = Math.abs(position.z - expanded.minZ);
      const pushForward = Math.abs(expanded.maxZ - position.z);
      const minPush = Math.min(pushLeft, pushRight, pushBack, pushForward);
      if (minPush === pushLeft) position.x = expanded.minX;
      else if (minPush === pushRight) position.x = expanded.maxX;
      else if (minPush === pushBack) position.z = expanded.minZ;
      else position.z = expanded.maxZ;
    }

    for (const blocker of this.circleBlockers) {
      const dx = position.x - blocker.x;
      const dz = position.z - blocker.z;
      const distance = Math.hypot(dx, dz);
      const minDistance = blocker.radius + radius;
      if (distance >= minDistance) continue;
      const nx = distance > 0.0001 ? dx / distance : 1;
      const nz = distance > 0.0001 ? dz / distance : 0;
      position.x = blocker.x + nx * minDistance;
      position.z = blocker.z + nz * minDistance;
    }

    position.x = clamp(position.x, this.bounds.minX + radius, this.bounds.maxX - radius);
    position.z = clamp(position.z, this.bounds.minZ + radius, this.bounds.maxZ - radius);
  }

  updateObstructionFading(camera: THREE.Camera, target: THREE.Vector3): void {
    this.group.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const origin = camera.position;
    const obstructing = new Set<THREE.Object3D>();
    const sampleTargets = [
      target,
      target.clone().add(new THREE.Vector3(0.42, 0, 0)),
      target.clone().add(new THREE.Vector3(-0.42, 0, 0)),
      target.clone().add(new THREE.Vector3(0, 0.45, 0)),
      target.clone().add(new THREE.Vector3(0, 0, 0.42)),
      target.clone().add(new THREE.Vector3(0, 0, -0.42)),
    ];
    for (const sampleTarget of sampleTargets) {
      const direction = sampleTarget.clone().sub(origin);
      const maxDistance = direction.length();
      if (maxDistance <= 0.001) continue;
      direction.normalize();
      this.raycaster.set(origin, direction);
      this.raycaster.far = maxDistance;
      for (const hit of this.raycaster.intersectObjects(this.obstructionMeshes, false)) obstructing.add(hit.object);
    }

    for (const mesh of this.obstructionMeshes) {
      const material = mesh.material;
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      const faded = obstructing.has(mesh);
      material.transparent = faded;
      material.opacity = faded ? 0.26 : 1;
      material.depthWrite = !faded;
      mesh.renderOrder = faded ? 2 : 0;
    }
  }

  dropEchoes(player: Player): void {
    if (player.echoes <= 0) return;
    if (this.echoDrop) this.group.remove(this.echoDrop.mesh);
    this.echoDrop = new EchoDrop({ ...player.position }, player.echoes);
    this.group.add(this.echoDrop.mesh);
    player.echoes = 0;
  }

  private build(): void {
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(24, 0.2, 44),
      new THREE.MeshStandardMaterial({
        color: 0x6a5b47,
        emissive: 0x211307,
        emissiveIntensity: 0.16,
        roughness: 0.94,
        map: createAtlasTexture('floor', [5, 8]),
      }),
    );
    floor.position.set(0, -0.1, -15);
    floor.receiveShadow = true;
    this.group.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x726553,
      emissive: 0x120d08,
      emissiveIntensity: 0.08,
      roughness: 0.9,
      map: createAtlasTexture('wall', [2, 4]),
    });
    for (const [x, z, width, depth] of WALL_DATA) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 2.5, depth), wallMaterial.clone());
      wall.position.set(x, 1.25, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.group.add(wall);
      this.obstructionMeshes.push(wall);
    }

    this.addRuinedCastleExterior(wallMaterial);
    this.addUpperBailey();

    const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x44413b, roughness: 0.9, map: createAtlasTexture('wall', [1, 2]) });
    for (const x of [-6, 6]) {
      for (const z of [-29, -22]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 2.8, 6), pillarMaterial.clone());
        pillar.position.set(x, 1.4, z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        this.group.add(pillar);
        this.obstructionMeshes.push(pillar);
      }
    }
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 10),
      new THREE.MeshBasicMaterial({ color: 0x303735, map: createAtlasTexture('backdrop', [1, 1]), transparent: true, opacity: 0.72 }),
    );
    backdrop.name = 'generated-cavern-backdrop';
    backdrop.position.set(0, 4, -38.1);
    this.group.add(backdrop);
    for (const checkpoint of this.checkpoints) this.group.add(checkpoint.mesh);
    this.group.add(this.shortcut.mesh);
  }

  private addRuinedCastleExterior(wallMaterial: THREE.MeshStandardMaterial): void {
    const courtyard = new THREE.Mesh(
      new THREE.BoxGeometry(13, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0x4f5a43, roughness: 0.98, emissive: 0x081008, emissiveIntensity: 0.08 }),
    );
    courtyard.name = 'exposed-courtyard-stone';
    courtyard.position.set(0, -0.16, -22.5);
    courtyard.receiveShadow = true;
    this.group.add(courtyard);

    const brokenParapetData: Array<[number, number, number, number, number]> = [
      [-10.2, -34.4, 1.2, 1.1, 0.2],
      [-6.8, -34.9, 1.8, 0.85, -0.15],
      [6.8, -34.7, 1.5, 0.95, 0.16],
      [10.1, -30.2, 1.1, 1.35, -0.22],
    ];
    for (const [x, z, width, height, tilt] of brokenParapetData) {
      const ruin = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.38), wallMaterial.clone());
      ruin.name = 'broken-castle-parapet';
      ruin.position.set(x, height / 2 - 0.02, z);
      ruin.rotation.z = tilt;
      ruin.castShadow = true;
      ruin.receiveShadow = true;
      this.group.add(ruin);
      this.obstructionMeshes.push(ruin);
    }

    const weedMaterial = new THREE.MeshStandardMaterial({ color: 0x627a42, emissive: 0x0b1505, emissiveIntensity: 0.16, roughness: 1 });
    const weedPositions: Array<[number, number, number]> = [
      [-9.2, -33.2, 0.9],
      [-7.6, -25.4, 0.65],
      [-2.7, -31.0, 0.8],
      [3.2, -27.2, 0.7],
      [8.8, -33.0, 1.0],
      [9.3, -24.6, 0.6],
    ];
    for (const [x, z, scale] of weedPositions) {
      const weed = new THREE.Group();
      weed.name = 'courtyard-weeds';
      for (let blade = 0; blade < 5; blade += 1) {
        const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.5 + blade * 0.04, 4), weedMaterial);
        mesh.position.set((blade - 2) * 0.08, 0.18, Math.sin(blade) * 0.05);
        mesh.rotation.set(0.18 + blade * 0.04, blade * 0.9, (blade - 2) * 0.12);
        weed.add(mesh);
      }
      weed.position.set(x, 0.02, z);
      weed.scale.setScalar(scale);
      this.group.add(weed);
    }

    const skyGap = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 6),
      new THREE.MeshBasicMaterial({ color: 0x6f7f86, transparent: true, opacity: 0.34, depthWrite: false }),
    );
    skyGap.name = 'open-sky-gap';
    skyGap.position.set(0, 4.2, -31.4);
    skyGap.rotation.x = -0.14;
    this.group.add(skyGap);
  }

  private addUpperBailey(): void {
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.14, 12),
      new THREE.MeshStandardMaterial({ color: 0x5b5d4e, roughness: 0.96, emissive: 0x0a0f08, emissiveIntensity: 0.08 }),
    );
    floor.name = 'upper-bailey-floor';
    floor.position.set(0, -0.08, -31);
    floor.receiveShadow = true;
    this.group.add(floor);
  }
}
