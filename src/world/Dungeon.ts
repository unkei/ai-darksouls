import * as THREE from 'three';
import { clamp, distance3, Vec3, vec3 } from '../core/Vector';
import { Player } from '../player/Player';
import { Bonfire } from './Bonfire';
import { ShortcutDoor } from './ShortcutDoor';
import { EchoDrop } from './Item';

type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

export class Dungeon {
  readonly group = new THREE.Group();
  readonly checkpoints = [new Bonfire(vec3(0, 0, 0)), new Bonfire(vec3(0, 0, -15))];
  readonly shortcut = new ShortcutDoor(vec3(-4, 0, -7));
  echoDrop: EchoDrop | null = null;
  activeCheckpoint: Vec3 = vec3(0, 0, 0);
  private readonly bounds: Bounds = { minX: -9, maxX: 9, minZ: -26, maxZ: 4 };

  constructor() {
    this.build();
  }

  update(player: Player, interact: boolean): void {
    player.position.x = clamp(player.position.x, this.bounds.minX, this.bounds.maxX);
    player.position.z = clamp(player.position.z, this.bounds.minZ, this.bounds.maxZ);

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

  dropEchoes(player: Player): void {
    if (player.echoes <= 0) return;
    if (this.echoDrop) this.group.remove(this.echoDrop.mesh);
    this.echoDrop = new EchoDrop({ ...player.position }, player.echoes);
    this.group.add(this.echoDrop.mesh);
    player.echoes = 0;
  }

  private build(): void {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 32), new THREE.MeshStandardMaterial({ color: 0x242624, roughness: 0.95 }));
    floor.position.set(0, -0.1, -11);
    this.group.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x363633, roughness: 0.9 });
    const wallData: Array<[number, number, number, number]> = [
      [0, -27, 18, 1],
      [0, 5, 18, 1],
      [-9, -11, 1, 32],
      [9, -11, 1, 32],
      [-3.5, -5, 1, 10],
      [3.5, -11, 1, 10],
      [0, -20, 10, 1],
    ];
    for (const [x, z, width, depth] of wallData) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 2.5, depth), wallMaterial);
      wall.position.set(x, 1.25, z);
      this.group.add(wall);
    }

    const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x30302d });
    for (const x of [-6, 6]) {
      for (const z of [-22, -17]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 2.8, 6), pillarMaterial);
        pillar.position.set(x, 1.4, z);
        this.group.add(pillar);
      }
    }
    for (const checkpoint of this.checkpoints) this.group.add(checkpoint.mesh);
    this.group.add(this.shortcut.mesh);
  }
}
