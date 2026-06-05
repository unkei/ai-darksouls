import * as THREE from 'three';

export type SceneLightingConfig = {
  toneMappingExposure: number;
  fogDensity: number;
  hemisphereIntensity: number;
  ambientIntensity: number;
  moonIntensity: number;
  torchIntensity: number;
  torchDistance: number;
};

export class GameScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(60, 1, 0.1, 120);
  readonly renderer: THREE.WebGLRenderer;
  private readonly torchLights: THREE.PointLight[] = [];
  private readonly ambiencePulse = createAmbiencePulse();
  private readonly lighting = createSceneLightingConfig();
  private elapsed = 0;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.lighting.toneMappingExposure;
    this.renderer.domElement.dataset.testid = 'game-canvas';
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x171a18);
    this.scene.fog = new THREE.FogExp2(0x242721, this.lighting.fogDensity);
    this.scene.add(new THREE.HemisphereLight(0xe1e6dc, 0x6a4d38, this.lighting.hemisphereIntensity));
    const fill = new THREE.AmbientLight(0xb5a585, this.lighting.ambientIntensity);
    this.scene.add(fill);
    const moon = new THREE.DirectionalLight(0xd7dfdf, this.lighting.moonIntensity);
    moon.position.set(-5, 9, 3);
    moon.castShadow = true;
    this.scene.add(moon);
    for (const [x, z] of [
      [-5.8, -4],
      [5.8, -11],
      [-5.8, -19],
      [4.8, -23],
    ]) {
      const torch = new THREE.PointLight(0xff9d48, this.lighting.torchIntensity, this.lighting.torchDistance, 1.6);
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
      this.scene.fog.density = this.lighting.fogDensity + Math.sin(this.elapsed * 0.45) * 0.0025;
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
  return (time: number): number => 1.35 + Math.sin(time * 5.1) * 0.16 + Math.sin(time * 11.7) * 0.08;
};

export const createSceneLightingConfig = (): SceneLightingConfig => ({
  toneMappingExposure: 2.25,
  fogDensity: 0.018,
  hemisphereIntensity: 1.35,
  ambientIntensity: 0.82,
  moonIntensity: 2.2,
  torchIntensity: 2.8,
  torchDistance: 12,
});
