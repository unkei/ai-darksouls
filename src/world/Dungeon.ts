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

const PLAYER_COLLISION_RADIUS = 0.55;
const WALL_DATA: Array<[number, number, number, number]> = [
  [0, -27, 18, 1],
  [0, 5, 18, 1],
  [-9, -11, 1, 32],
  [9, -11, 1, 32],
  [-3.5, -5, 1, 10],
  [3.5, -11, 1, 10],
  [0, -20, 10, 1],
];

export class Dungeon {
  readonly group = new THREE.Group();
  readonly obstructionMeshes: THREE.Mesh[] = [];
  readonly checkpoints = [new Bonfire(vec3(0, 0, 2.5)), new Bonfire(vec3(0, 0, -15))];
  readonly shortcut = new ShortcutDoor(vec3(-4, 0, -7));
  echoDrop: EchoDrop | null = null;
  activeCheckpoint: Vec3 = vec3(0, 0, 2.5);
  private readonly bounds: Bounds = { minX: -9, maxX: 9, minZ: -26, maxZ: 4 };
  private readonly walls: WallRect[] = WALL_DATA.map(([x, z, width, depth]) => ({
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
  }));
  private readonly circleBlockers: CircleBlocker[] = [
    { x: -6, z: -22, radius: 0.58 },
    { x: 6, z: -22, radius: 0.58 },
    { x: -6, z: -17, radius: 0.58 },
    { x: 6, z: -17, radius: 0.58 },
  ];
  private readonly raycaster = new THREE.Raycaster();

  constructor() {
    this.build();
  }

  update(player: Player, interact: boolean): void {
    this.resolveCircleCollision(player.position, PLAYER_COLLISION_RADIUS);

    for (const checkpoint of this.checkpoints) {
      if (distance3(player.position, checkpoint.position) < 1.4) {
        this.activeCheckpoint = checkpoint.position;
        if (interact) player.refill();
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
    const direction = target.clone().sub(origin);
    const maxDistance = direction.length();
    if (maxDistance <= 0.001) return;
    direction.normalize();
    this.raycaster.set(origin, direction);
    this.raycaster.far = maxDistance;
    const obstructing = new Set(this.raycaster.intersectObjects(this.obstructionMeshes, false).map((hit) => hit.object));

    for (const mesh of this.obstructionMeshes) {
      const material = mesh.material;
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      const faded = obstructing.has(mesh);
      material.transparent = faded;
      material.opacity = faded ? 0.32 : 1;
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
      new THREE.BoxGeometry(18, 0.2, 32),
      new THREE.MeshStandardMaterial({
        color: 0x6a5b47,
        emissive: 0x211307,
        emissiveIntensity: 0.16,
        roughness: 0.94,
        map: createAtlasTexture('floor', [5, 8]),
      }),
    );
    floor.position.set(0, -0.1, -11);
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

    const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x44413b, roughness: 0.9, map: createAtlasTexture('wall', [1, 2]) });
    for (const x of [-6, 6]) {
      for (const z of [-22, -17]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 2.8, 6), pillarMaterial.clone());
        pillar.position.set(x, 1.4, z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        this.group.add(pillar);
        this.obstructionMeshes.push(pillar);
      }
    }
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 10),
      new THREE.MeshBasicMaterial({ color: 0x303735, map: createAtlasTexture('backdrop', [1, 1]), transparent: true, opacity: 0.72 }),
    );
    backdrop.name = 'generated-cavern-backdrop';
    backdrop.position.set(0, 4, -27.55);
    this.group.add(backdrop);
    for (const checkpoint of this.checkpoints) this.group.add(checkpoint.mesh);
    this.group.add(this.shortcut.mesh);
  }
}
