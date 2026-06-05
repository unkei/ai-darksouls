import * as THREE from 'three';

export class GameScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(60, 1, 0.1, 120);
  readonly renderer: THREE.WebGLRenderer;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.shadowMap.enabled = true;
    this.renderer.domElement.dataset.testid = 'game-canvas';
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x111312);
    this.scene.fog = new THREE.FogExp2(0x151615, 0.035);
    this.scene.add(new THREE.HemisphereLight(0x9aa2a2, 0x211a16, 0.8));
    const moon = new THREE.DirectionalLight(0xb9c2cc, 1.3);
    moon.position.set(-5, 9, 3);
    moon.castShadow = true;
    this.scene.add(moon);
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  render(): void {
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
