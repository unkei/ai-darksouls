import * as THREE from 'three';
import { CombatSystem } from '../combat/CombatSystem';
import { Boss } from '../enemies/Boss';
import { Enemy, enemyConfigs } from '../enemies/Enemy';
import { GamepadInput } from '../input/GamepadInput';
import { InputManager } from '../input/InputManager';
import { KeyboardMouseInput } from '../input/KeyboardMouseInput';
import { TouchInput } from '../input/TouchInput';
import { Player } from '../player/Player';
import { Dungeon } from '../world/Dungeon';
import { Hud } from '../ui/Hud';
import { Loop } from './Loop';
import { GameScene } from './Scene';

export class Game {
  private readonly scene: GameScene;
  private readonly loop: Loop;
  private readonly input: InputManager;
  private readonly player = new Player();
  private readonly dungeon = new Dungeon();
  private readonly combat = new CombatSystem();
  private readonly enemies: Array<Enemy | Boss>;
  private readonly boss = new Boss({ x: 0, y: 0, z: -22 });
  private readonly hud: Hud;
  private cameraYaw = 0;
  private cameraPitch = 0.52;
  private deathHandled = false;
  private message = 'Explore the keep. Open the shortcut. Defeat the warden.';

  constructor(private readonly root: HTMLElement) {
    this.root.className = 'game-root';
    this.scene = new GameScene(root);
    this.hud = new Hud(root);
    const touch = new TouchInput(root);
    this.input = new InputManager([new KeyboardMouseInput(this.scene.renderer.domElement), new GamepadInput(), touch]);
    this.enemies = [
      new Enemy(enemyConfigs.grunt, { x: -3, y: 0, z: -7 }),
      new Enemy(enemyConfigs.shield, { x: 4, y: 0, z: -10 }),
      new Enemy(enemyConfigs.fast, { x: -5, y: 0, z: -15 }),
      this.boss,
    ];
    this.scene.scene.add(this.dungeon.group, this.player.mesh, ...this.enemies.map((enemy) => enemy.mesh));
    this.loop = new Loop((delta) => this.update(delta));
    this.updateCamera();
  }

  start(): void {
    this.loop.start();
  }

  dispose(): void {
    this.loop.stop();
    this.input.dispose();
    this.scene.dispose();
  }

  private update(delta: number): void {
    const input = this.input.update();
    this.cameraYaw += input.camera.x;
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch + input.camera.y, 0.18, 0.9);

    if (this.player.fsm.state === 'Dead') {
      if (!this.deathHandled) {
        this.deathHandled = true;
        this.dungeon.dropEchoes(this.player);
        this.message = 'You fell. Press Interact to rise at the cinder shrine.';
      }
      if (input.interact) {
        this.player.respawn(this.dungeon.activeCheckpoint);
        for (const enemy of this.enemies) enemy.respawn();
        this.deathHandled = false;
        this.message = 'Echoes remain where you fell.';
      }
    } else {
      this.player.update(delta, input, this.cameraYaw);
      this.dungeon.update(this.player, input.interact);
      for (const enemy of this.enemies) enemy.update(delta, this.player);
      this.combat.update(this.player, this.enemies);
      if (this.boss.fsm.state === 'Dead') this.message = 'The Ashen Warden is defeated.';
    }

    this.updateCamera();
    this.hud.update(this.player, this.boss, this.message);
    this.scene.render();
  }

  private updateCamera(): void {
    const radius = 6.5;
    const target = new THREE.Vector3(this.player.position.x, 1.0, this.player.position.z);
    const offset = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * radius,
      Math.sin(this.cameraPitch) * radius + 1.3,
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * radius,
    );
    this.scene.camera.position.copy(target).sub(offset);
    this.scene.camera.lookAt(target);
  }
}
