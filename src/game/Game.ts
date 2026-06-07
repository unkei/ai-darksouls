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
import { GameFlow } from './GameFlow';
import { GameScene } from './Scene';

export class Game {
  private readonly scene: GameScene;
  private readonly loop: Loop;
  private readonly input: InputManager;
  private readonly player = new Player();
  private readonly dungeon = new Dungeon();
  private readonly combat = new CombatSystem();
  private readonly audio = new AudioDirector();
  private readonly flow = new GameFlow();
  private readonly enemies: Array<Enemy | Boss>;
  private readonly boss = new Boss({ x: 0, y: 0, z: -31 });
  private readonly hud: Hud;
  private cameraYaw = 0;
  private cameraPitch = 0.22;
  private deathHandled = false;
  private message = 'Explore the keep. Open the shortcut. Defeat the warden.';
  private encounterPhase: 'Minor' | 'Boss' = 'Minor';
  private endingTime = 0;
  private bossDefeatTime = 0;

  constructor(private readonly root: HTMLElement) {
    this.root.className = 'game-root';
    this.scene = new GameScene(root);
    this.hud = new Hud(root);
    const touch = new TouchInput(root);
    this.input = new InputManager([new KeyboardMouseInput(this.scene.renderer.domElement), new GamepadInput(), touch]);
    this.enemies = [
      new Enemy(enemyConfigs.grunt, { x: -4.5, y: 0, z: -8 }),
      new Enemy(enemyConfigs.shield, { x: 5.2, y: 0, z: -14 }),
      new Enemy(enemyConfigs.fast, { x: -6.2, y: 0, z: -21 }),
      this.boss,
    ];
    this.scene.scene.add(this.dungeon.group, this.player.mesh, ...this.enemies.map((enemy) => enemy.mesh));
    this.loop = new Loop((delta) => this.update(delta));
    this.audio.startBgm();
    this.audio.startAmbience();
    if (new URLSearchParams(window.location.search).get('e2eFlow') === 'ending') {
      this.flow.forceStateForTest('Ending');
      this.endingTime = 0;
    }
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
    const previousFlowState = this.flow.state;
    this.flow.update({
      advance: input.advance,
      interact: input.interact,
      delta,
      playerDead: this.player.fsm.state === 'Dead',
      bossDead: this.boss.fsm.state === 'Dead',
    });
    if (previousFlowState !== 'Opening' && this.flow.state === 'Opening') this.resetRunForTitle();
    if (previousFlowState !== 'BossDefeat' && this.flow.state === 'BossDefeat') this.bossDefeatTime = 0;
    if (previousFlowState !== 'Ending' && this.flow.state === 'Ending') this.endingTime = 0;
    if (previousFlowState === 'GameOver' && this.flow.state === 'Playing') {
      this.player.respawn(this.dungeon.activeCheckpoint);
      for (const enemy of this.enemies) enemy.respawn();
      this.deathHandled = false;
      this.message = 'Echoes remain where you fell.';
    }

    if (this.flow.state === 'Opening' || this.flow.state === 'Ending') {
      if (this.flow.state === 'Ending') {
        this.endingTime += delta;
        this.updateEndingCamera(this.endingTime);
      } else {
        this.updateCamera();
      }
      this.hud.update(this.player, this.boss, this.flow.message, this.flow.state);
      this.audio.update(delta);
      this.scene.render(delta);
      return;
    }

    if (this.flow.state === 'GameOver') {
      if (!this.deathHandled) {
        this.deathHandled = true;
        this.dungeon.dropEchoes(this.player);
        this.message = this.flow.message;
      }
    } else if (this.flow.state === 'BossDefeat') {
      this.bossDefeatTime += delta;
      this.boss.updateDefeatPresentation(delta);
      this.message = this.flow.message;
      if (this.bossDefeatTime >= 3.2) {
        this.flow.update({ advance: false, interact: false, playerDead: false, bossDead: true, bossDefeatComplete: true });
        this.message = this.flow.message;
      }
    } else if (this.flow.state === 'Clear') {
      this.message = this.flow.message;
    } else {
      const previousPlayerState: string = this.player.fsm.state;
      this.player.update(delta, input, this.cameraYaw);
      const dungeonEvent = this.dungeon.update(this.player, input.interact);
      if (dungeonEvent.restedAtCinderShrine) {
        for (const enemy of this.enemies) {
          if (!(enemy instanceof Boss)) enemy.respawn();
        }
        this.message = 'Rested at the cinder shrine. The keep stirs and lesser foes return.';
      }
      this.player.syncVisuals();
      const nextEncounterPhase = this.player.position.z < -25 ? 'Boss' : 'Minor';
      if (this.encounterPhase !== nextEncounterPhase) {
        this.encounterPhase = nextEncounterPhase;
        this.message =
          nextEncounterPhase === 'Boss'
            ? 'Boss arena ahead. The Ashen Warden stands apart from the lesser dead.'
            : 'Lesser patrols haunt the outer keep.';
      }
      const currentPlayerState: string = this.player.fsm.state;
      if (previousPlayerState !== 'Attack' && currentPlayerState === 'Attack') {
        this.audio.playAttack();
        this.audio.playWeaponWhoosh();
      }
      if (previousPlayerState !== 'Dodge' && currentPlayerState === 'Dodge') this.audio.playDodge();
      for (const enemy of this.enemies) {
        const previousEnemyState = enemy.fsm.state;
        enemy.update(delta, this.player);
        this.dungeon.resolveCircleCollision(enemy.position, enemy.config.radius);
        enemy.syncVisuals();
        if (previousEnemyState !== 'Windup' && enemy.fsm.state === 'Windup') this.audio.playEnemyWindup();
        if (previousEnemyState !== 'Attack' && enemy.fsm.state === 'Attack') {
          if (enemy instanceof Boss) this.audio.playBossAttack(enemy.currentAttackCueId);
          else this.audio.playEnemyAttack();
        }
      }
      const beforeHp = this.player.hp;
      const beforeStamina = this.player.stamina;
      const defeatedBefore = this.enemies.filter((enemy) => enemy.fsm.state === 'Dead').length;
      const enemyHpBefore = this.enemies.map((enemy) => enemy.hp);
      this.combat.update(this.player, this.enemies);
      const defeatedAfter = this.enemies.filter((enemy) => enemy.fsm.state === 'Dead').length;
      if (this.enemies.some((enemy, index) => enemy.hp < enemyHpBefore[index])) this.audio.playWeaponHit();
      if (this.player.hp < beforeHp) this.audio.playHit();
      else if (currentPlayerState === 'Guard' && this.player.stamina < beforeStamina) this.audio.playBlock();
      if (defeatedAfter > defeatedBefore) {
        this.audio.playDeath();
        this.audio.playEnemyDefeatRoar();
      }
      if (this.boss.fsm.state === 'Dead') {
        this.flow.update({ advance: false, interact: false, playerDead: false, bossDead: true });
        this.message = this.flow.message;
      }
    }

    this.updateCamera();
    const target = new THREE.Vector3(this.player.position.x, 0.7, this.player.position.z);
    this.dungeon.updateObstructionFading(this.scene.camera, target);
    this.hud.update(this.player, this.boss, this.message, this.flow.state, this.encounterPhase);
    this.audio.update(delta);
    this.scene.render(delta);
  }

  private resetRunForTitle(): void {
    this.player.respawn(this.dungeon.activeCheckpoint);
    for (const enemy of this.enemies) enemy.respawn();
    this.deathHandled = false;
    this.message = 'Explore the keep. Open the shortcut. Defeat the warden.';
    this.encounterPhase = this.player.position.z < -25 ? 'Boss' : 'Minor';
    this.bossDefeatTime = 0;
    this.endingTime = 0;
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

  private updateEndingCamera(time: number): void {
    const rig = createEndingCameraRig(time);
    this.scene.camera.position.copy(rig.position);
    this.scene.camera.lookAt(rig.target);
    this.root.dataset.cameraPosition = [
      this.scene.camera.position.x.toFixed(2),
      this.scene.camera.position.y.toFixed(2),
      this.scene.camera.position.z.toFixed(2),
    ].join(',');
  }
}

export const createEndingCameraRig = (time: number): { position: THREE.Vector3; target: THREE.Vector3 } => {
  const target = new THREE.Vector3(0, 1.2, -31);
  const angle = time * 0.22;
  const radius = 10.5;
  return {
    position: new THREE.Vector3(Math.sin(angle) * radius, 6.8 + Math.sin(time * 0.18) * 0.6, -31 + Math.cos(angle) * radius),
    target,
  };
};

const hasPlayerInteraction = (input: ReturnType<InputManager['update']>): boolean =>
  input.attack ||
  input.dodge ||
  input.guard ||
  input.interact ||
  input.heal ||
  input.lockOn ||
  input.run ||
  input.advance ||
  Math.abs(input.move.x) > 0.01 ||
  Math.abs(input.move.y) > 0.01 ||
  Math.abs(input.camera.x) > 0.01 ||
  Math.abs(input.camera.y) > 0.01;
