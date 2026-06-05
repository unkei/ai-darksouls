import * as THREE from 'three';
import { distance3, Vec3 } from '../core/Vector';

export class ShortcutDoor {
  readonly mesh: THREE.Mesh;
  open = false;

  constructor(readonly position: Vec3) {
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.4, 0.28), new THREE.MeshStandardMaterial({ color: 0x2b2724, roughness: 0.8 }));
    this.mesh.position.set(position.x, 1.2, position.z);
  }

  canInteract(playerPosition: Vec3): boolean {
    return !this.open && distance3(playerPosition, this.position) < 1.8;
  }

  interact(playerPosition: Vec3): boolean {
    if (!this.canInteract(playerPosition)) return false;
    this.open = true;
    this.mesh.visible = false;
    return true;
  }
}
