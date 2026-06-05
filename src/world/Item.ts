import * as THREE from 'three';
import { distance3, Vec3 } from '../core/Vector';

export class EchoDrop {
  readonly mesh: THREE.Mesh;

  constructor(readonly position: Vec3, public amount: number) {
    this.mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), new THREE.MeshStandardMaterial({ color: 0x9ff0d0, emissive: 0x24735f, emissiveIntensity: 0.7 }));
    this.mesh.position.set(position.x, 0.35, position.z);
  }

  canCollect(playerPosition: Vec3): boolean {
    return this.amount > 0 && distance3(playerPosition, this.position) < 1.1;
  }
}
