import * as THREE from 'three';
import { clamp, distance3, Vec3, vec3 } from '../core/Vector';
import { createAtlasTexture } from '../game/GeneratedTextures';
import { Player } from '../player/Player';
import { Bonfire } from './Bonfire';
import { ShortcutDoor } from './ShortcutDoor';
import { EchoDrop } from './Item';

type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };
type WallRect = { minX: number; maxX: number; minZ: number; maxZ: number };

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
  readonly checkpoints = [new Bonfire(vec3(0, 0, 0)), new Bonfire(vec3(0, 0, -15))];
  readonly shortcut = new ShortcutDoor(vec3(-4, 0, -7));
  echoDrop: EchoDrop | null = null;
  activeCheckpoint: Vec3 = vec3(0, 0, 0);
  private readonly bounds: Bounds = { minX: -9, maxX: 9, minZ: -26, maxZ: 4 };
  private readonly walls: WallRect[] = WALL_DATA.map(([x, z, width, depth]) => ({
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
  }));

  constructor() {
    this.build();
  }

  update(player: Player, interact: boolean): void {
    this.resolvePlayerCollision(player);

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

  private resolvePlayerCollision(player: Player): void {
    player.position.x = clamp(player.position.x, this.bounds.minX + PLAYER_COLLISION_RADIUS, this.bounds.maxX - PLAYER_COLLISION_RADIUS);
    player.position.z = clamp(player.position.z, this.bounds.minZ + PLAYER_COLLISION_RADIUS, this.bounds.maxZ - PLAYER_COLLISION_RADIUS);

    for (const wall of this.walls) {
      const expanded = {
        minX: wall.minX - PLAYER_COLLISION_RADIUS,
        maxX: wall.maxX + PLAYER_COLLISION_RADIUS,
        minZ: wall.minZ - PLAYER_COLLISION_RADIUS,
        maxZ: wall.maxZ + PLAYER_COLLISION_RADIUS,
      };
      const insideX = player.position.x > expanded.minX && player.position.x < expanded.maxX;
      const insideZ = player.position.z > expanded.minZ && player.position.z < expanded.maxZ;
      if (!insideX || !insideZ) continue;

      const pushLeft = Math.abs(player.position.x - expanded.minX);
      const pushRight = Math.abs(expanded.maxX - player.position.x);
      const pushBack = Math.abs(player.position.z - expanded.minZ);
      const pushForward = Math.abs(expanded.maxZ - player.position.z);
      const minPush = Math.min(pushLeft, pushRight, pushBack, pushForward);
      if (minPush === pushLeft) player.position.x = expanded.minX;
      else if (minPush === pushRight) player.position.x = expanded.maxX;
      else if (minPush === pushBack) player.position.z = expanded.minZ;
      else player.position.z = expanded.maxZ;
    }

    player.position.x = clamp(player.position.x, this.bounds.minX + PLAYER_COLLISION_RADIUS, this.bounds.maxX - PLAYER_COLLISION_RADIUS);
    player.position.z = clamp(player.position.z, this.bounds.minZ + PLAYER_COLLISION_RADIUS, this.bounds.maxZ - PLAYER_COLLISION_RADIUS);
  }

  dropEchoes(player: Player): void {
    if (player.echoes <= 0) return;
    if (this.echoDrop) this.group.remove(this.echoDrop.mesh);
    this.echoDrop = new EchoDrop({ ...player.position }, player.echoes);
    this.group.add(this.echoDrop.mesh);
    player.echoes = 0;
  }

  private build(): void {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 32), new THREE.MeshStandardMaterial({ color: 0x353532, roughness: 0.96, map: createAtlasTexture('floor', [5, 8]) }));
    floor.position.set(0, -0.1, -11);
    floor.receiveShadow = true;
    this.group.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x5d5a52, roughness: 0.92, map: createAtlasTexture('wall', [2, 4]) });
    for (const [x, z, width, depth] of WALL_DATA) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 2.5, depth), wallMaterial);
      wall.position.set(x, 1.25, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.group.add(wall);
    }

    const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x44413b, roughness: 0.9, map: createAtlasTexture('wall', [1, 2]) });
    for (const x of [-6, 6]) {
      for (const z of [-22, -17]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 2.8, 6), pillarMaterial);
        pillar.position.set(x, 1.4, z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        this.group.add(pillar);
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
