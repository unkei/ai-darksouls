import * as THREE from 'three';

export class GameScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(60, 1, 0.1, 120);
  readonly renderer: THREE.WebGLRenderer;
  private readonly torchLights: THREE.PointLight[] = [];
  private readonly ambiencePulse = createAmbiencePulse();
  private elapsed = 0;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.domElement.dataset.testid = 'game-canvas';
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x0e1110);
    this.scene.fog = new THREE.FogExp2(0x141715, 0.046);
    this.scene.add(new THREE.HemisphereLight(0xc5ccc7, 0x3a2a22, 0.95));
    const fill = new THREE.AmbientLight(0x8d8170, 0.42);
    this.scene.add(fill);
    const moon = new THREE.DirectionalLight(0xb9c2cc, 1.3);
    moon.position.set(-5, 9, 3);
    moon.castShadow = true;
    this.scene.add(moon);
    for (const [x, z] of [
      [-5.8, -4],
      [5.8, -11],
      [-5.8, -19],
      [4.8, -23],
    ]) {
      const torch = new THREE.PointLight(0xff8b3d, 1.6, 8, 1.8);
      torch.position.set(x, 1.7, z);
      this.torchLights.push(torch);
      this.scene.add(torch);
    }
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  render(delta = 0): void {
    this.elapsed += delta;
    const pulse = this.ambiencePulse(this.elapsed);
    for (let index = 0; index < this.torchLights.length; index += 1) {
      this.torchLights[index].intensity = pulse + Math.sin(this.elapsed * 4.9 + index) * 0.08;
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = 0.04 + Math.sin(this.elapsed * 0.45) * 0.006;
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private readonly resize = (): void => {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };
}

export const createAmbiencePulse = (): ((time: number) => number) => {
  return (time: number): number => 1.02 + Math.sin(time * 5.1) * 0.12 + Math.sin(time * 11.7) * 0.06;
};
