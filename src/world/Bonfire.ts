import * as THREE from 'three';
import { Vec3 } from '../core/Vector';

export class Bonfire {
  readonly mesh: THREE.Group;

  constructor(readonly position: Vec3) {
    this.mesh = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0x3a2b22 }));
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 6), new THREE.MeshStandardMaterial({ color: 0xff8a2a, emissive: 0xff5a14, emissiveIntensity: 1.5 }));
    const light = new THREE.PointLight(0xff7a2a, 2.3, 6);
    flame.position.y = 0.48;
    light.position.y = 1.0;
    this.mesh.add(base, flame, light);
    this.mesh.position.set(position.x, position.y, position.z);
  }
}
