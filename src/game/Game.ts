import * as THREE from 'three';
import { AudioDirector } from '../audio/AudioDirector';
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
  private readonly audio = new AudioDirector();
  private readonly enemies: Array<Enemy | Boss>;
  private readonly boss = new Boss({ x: 0, y: 0, z: -22 });
  private readonly hud: Hud;
  private cameraYaw = 0;
  private cameraPitch = 0.22;
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
    this.audio.startAmbience();
    this.updateCamera();
  }

  start(): void {
    this.loop.start();
  }

  dispose(): void {
    this.loop.stop();
    this.input.dispose();
    this.audio.dispose();
    this.scene.dispose();
  }

  private update(delta: number): void {
    const input = this.input.update();
    if (hasPlayerInteraction(input)) this.audio.unlock();
    this.cameraYaw += input.camera.x;
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch + input.camera.y, 0.08, 0.9);

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
      const previousPlayerState: string = this.player.fsm.state;
      this.player.update(delta, input, this.cameraYaw);
      this.dungeon.update(this.player, input.interact);
      this.player.syncVisuals();
      const currentPlayerState: string = this.player.fsm.state;
      if (previousPlayerState !== 'Attack' && currentPlayerState === 'Attack') this.audio.playAttack();
      if (previousPlayerState !== 'Dodge' && currentPlayerState === 'Dodge') this.audio.playDodge();
      for (const enemy of this.enemies) {
        const previousEnemyState = enemy.fsm.state;
        enemy.update(delta, this.player);
        if (previousEnemyState !== 'Windup' && enemy.fsm.state === 'Windup') this.audio.playEnemyWindup();
        if (previousEnemyState !== 'Attack' && enemy.fsm.state === 'Attack') {
          if (enemy instanceof Boss) this.audio.playBossAttack(enemy.currentAttackCueId);
          else this.audio.playEnemyAttack();
        }
      }
      const beforeHp = this.player.hp;
      const beforeStamina = this.player.stamina;
      const defeatedBefore = this.enemies.filter((enemy) => enemy.fsm.state === 'Dead').length;
      this.combat.update(this.player, this.enemies);
      const defeatedAfter = this.enemies.filter((enemy) => enemy.fsm.state === 'Dead').length;
      if (this.player.hp < beforeHp) this.audio.playHit();
      else if (currentPlayerState === 'Guard' && this.player.stamina < beforeStamina) this.audio.playBlock();
      if (defeatedAfter > defeatedBefore) this.audio.playDeath();
      if (this.boss.fsm.state === 'Dead') this.message = 'The Ashen Warden is defeated.';
    }

    this.updateCamera();
    this.hud.update(this.player, this.boss, this.message);
    this.audio.update(delta);
    this.scene.render(delta);
  }

  private updateCamera(): void {
    const radius = 4.8;
    const target = new THREE.Vector3(this.player.position.x, 0.7, this.player.position.z);
    const behind = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * radius,
      0,
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * radius,
    );
    this.scene.camera.position.copy(target).sub(behind);
    this.scene.camera.position.y = target.y + Math.sin(this.cameraPitch) * radius + 1.3;
    this.scene.camera.lookAt(target);
    this.root.dataset.cameraPosition = [
      this.scene.camera.position.x.toFixed(2),
      this.scene.camera.position.y.toFixed(2),
      this.scene.camera.position.z.toFixed(2),
    ].join(',');
  }
}

const hasPlayerInteraction = (input: ReturnType<InputManager['update']>): boolean =>
  input.attack ||
  input.dodge ||
  input.guard ||
  input.interact ||
  input.heal ||
  input.lockOn ||
  input.run ||
  Math.abs(input.move.x) > 0.01 ||
  Math.abs(input.move.y) > 0.01 ||
  Math.abs(input.camera.x) > 0.01 ||
  Math.abs(input.camera.y) > 0.01;
