import * as THREE from 'three';
import { clamp, normalize2, Vec3, vec3 } from '../core/Vector';
import { StateMachine } from '../core/StateMachine';
import { createAtlasTexture } from '../game/GeneratedTextures';
import { InputState } from '../input/InputState';
import { PLAYER, PlayerState } from './PlayerState';

export class Player {
  readonly mesh: THREE.Group;
  readonly fsm = new StateMachine<PlayerState>('Idle');
  position: Vec3 = vec3(0, 0, 2.5);
  facing = 0;
  hp = PLAYER.maxHp;
  stamina = PLAYER.maxStamina;
  flasks = PLAYER.maxFlasks;
  echoes = 0;
  pendingAttack = false;
  invulnerable = false;
  private staminaDelay = 0;
  private dodgeDirection = vec3(0, 0, 1);
  private readonly rig: PlayerRig;

  constructor() {
    const built = createPlayerMesh();
    this.mesh = built.group;
    this.rig = built.rig;
    this.syncMesh();
  }

  update(delta: number, input: InputState, cameraYaw: number): void {
    this.fsm.tick(delta);
    this.pendingAttack = false;
    this.invulnerable = this.fsm.state === 'Dodge' && this.fsm.timeInState < PLAYER.dodgeIFrameEnd;

    if (this.fsm.state === 'Dead') return;
    this.resolveActionState();
    if (this.isLockedInAction()) {
      this.regenerateStamina(delta);
      this.syncMesh();
      return;
    }

    if (input.heal && this.canAct() && this.flasks > 0 && this.hp < PLAYER.maxHp) {
      this.flasks -= 1;
      this.spendStamina(0);
      this.fsm.set('UseItem');
      this.syncMesh();
      return;
    }
    if (input.attack && this.canAct() && this.stamina >= PLAYER.attackCost) {
      this.spendStamina(PLAYER.attackCost);
      this.pendingAttack = true;
      this.fsm.set('Attack');
      this.syncMesh();
      return;
    }
    if (input.dodge && this.canAct() && this.stamina >= PLAYER.dodgeCost) {
      this.spendStamina(PLAYER.dodgeCost);
      const move = normalize2(input.move);
      const yaw = cameraYaw + Math.atan2(move.x, move.y || 1);
      this.dodgeDirection = { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) };
      this.fsm.set('Dodge');
      this.syncMesh();
      return;
    }
    if (input.guard && this.canAct() && this.stamina > 5) {
      this.stamina = clamp(this.stamina - PLAYER.guardDrainPerSecond * delta, 0, PLAYER.maxStamina);
      this.staminaDelay = PLAYER.staminaRegenDelay;
      this.fsm.set('Guard');
      this.regenerateStamina(delta);
      this.syncMesh();
      return;
    }

    this.move(delta, input, cameraYaw);
    this.regenerateStamina(delta);
    this.syncMesh();
  }

  takeDamage(amount: number, guarded: boolean): void {
    if (this.invulnerable || this.fsm.state === 'Dead') return;
    const finalDamage = guarded && this.stamina > 10 ? amount * 0.35 : amount;
    if (guarded) this.stamina = clamp(this.stamina - amount * 0.75, 0, PLAYER.maxStamina);
    this.hp = clamp(this.hp - finalDamage, 0, PLAYER.maxHp);
    this.fsm.set(this.hp <= 0 ? 'Dead' : 'HitStun');
  }

  respawn(position: Vec3): void {
    this.position = { ...position };
    this.hp = PLAYER.maxHp;
    this.stamina = PLAYER.maxStamina;
    this.flasks = PLAYER.maxFlasks;
    this.fsm.set('Idle');
    this.syncMesh();
  }

  refill(): void {
    this.hp = PLAYER.maxHp;
    this.stamina = PLAYER.maxStamina;
    this.flasks = PLAYER.maxFlasks;
  }

  syncVisuals(): void {
    this.syncMesh();
  }

  private resolveActionState(): void {
    if (this.fsm.state === 'Attack' && this.fsm.timeInState >= PLAYER.attackDuration) this.fsm.set('Idle');
    if (this.fsm.state === 'Dodge') {
      this.position.x += this.dodgeDirection.x * 8.5 * Math.min(0.05, this.fsm.timeInState);
      this.position.z += this.dodgeDirection.z * 8.5 * Math.min(0.05, this.fsm.timeInState);
      if (this.fsm.timeInState >= PLAYER.dodgeDuration) this.fsm.set('Idle');
    }
    if (this.fsm.state === 'HitStun' && this.fsm.timeInState >= PLAYER.hitStunDuration) this.fsm.set('Idle');
    if (this.fsm.state === 'UseItem' && this.fsm.timeInState >= PLAYER.healDuration) {
      this.hp = clamp(this.hp + PLAYER.healAmount, 0, PLAYER.maxHp);
      this.fsm.set('Idle');
    }
    if (this.fsm.state === 'Interact' && this.fsm.timeInState >= 0.35) this.fsm.set('Idle');
  }

  private move(delta: number, input: InputState, cameraYaw: number): void {
    const move = normalize2(input.move);
    const moving = Math.abs(move.x) + Math.abs(move.y) > 0.01;
    if (!moving) {
      this.fsm.set('Idle');
      return;
    }
    const speed = input.run && this.stamina > 5 ? PLAYER.runSpeed : PLAYER.walkSpeed;
    const yaw = cameraYaw + Math.atan2(move.x, move.y);
    this.facing = yaw;
    this.position.x += Math.sin(yaw) * speed * delta;
    this.position.z += Math.cos(yaw) * speed * delta;
    this.fsm.set(speed === PLAYER.runSpeed ? 'Run' : 'Walk');
  }

  private canAct(): boolean {
    return this.fsm.state === 'Idle' || this.fsm.state === 'Walk' || this.fsm.state === 'Run' || this.fsm.state === 'Guard';
  }

  private isLockedInAction(): boolean {
    return this.fsm.state === 'Attack' || this.fsm.state === 'Dodge' || this.fsm.state === 'HitStun' || this.fsm.state === 'UseItem' || this.fsm.state === 'Interact';
  }

  private spendStamina(amount: number): void {
    this.stamina = clamp(this.stamina - amount, 0, PLAYER.maxStamina);
    this.staminaDelay = PLAYER.staminaRegenDelay;
  }

  private regenerateStamina(delta: number): void {
    if (this.staminaDelay > 0) {
      this.staminaDelay -= delta;
      return;
    }
    if (this.fsm.state !== 'Guard') {
      this.stamina = clamp(this.stamina + PLAYER.staminaRegenPerSecond * delta, 0, PLAYER.maxStamina);
    }
  }

  private syncMesh(): void {
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    this.mesh.rotation.y = this.facing;
    posePlayerRig(this.rig, this.fsm.state, this.fsm.timeInState);
  }
}

type PlayerRig = {
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  weapon: THREE.Object3D;
  attackStartup: THREE.Object3D;
  attackArc: THREE.Object3D;
  weaponDirection: THREE.Object3D;
  guardShield: THREE.Object3D;
  dodgeTrail: THREE.Object3D;
  hitFlash: THREE.Object3D;
};

const PLAYER_ATTACK_ACTIVE_START = 0.12;

const createPlayerMesh = (): { group: THREE.Group; rig: PlayerRig } => {
  const group = new THREE.Group();
  const armorTexture = createAtlasTexture('armor', [1, 1]);
  const armor = new THREE.MeshStandardMaterial({
    color: 0x6f95d6,
    emissive: 0x14284c,
    emissiveIntensity: 0.28,
    roughness: 0.72,
    metalness: 0.2,
    map: armorTexture,
  });
  const cloth = new THREE.MeshStandardMaterial({
    color: 0x4567a3,
    emissive: 0x0d1a36,
    emissiveIntensity: 0.22,
    roughness: 0.9,
    map: armorTexture,
  });
  const leather = new THREE.MeshStandardMaterial({ color: 0x4d382f, roughness: 0.88, map: armorTexture });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe0c68e, roughness: 0.65 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xaab0ad, roughness: 0.46, metalness: 0.65 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.78, 5, 10), armor);
  body.name = 'player-body';
  body.position.y = 0.86;
  const mantle = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.12, 0.38), cloth);
  mantle.name = 'player-mantle';
  mantle.position.set(0, 1.22, -0.03);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), skin);
  head.name = 'player-head';
  head.position.y = 1.42;
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.05), new THREE.MeshStandardMaterial({ color: 0xf1dca6, roughness: 0.55 }));
  face.name = 'player-face';
  face.position.set(0, 1.42, 0.18);
  face.renderOrder = 3;

  const leftArm = limb('player-left-arm', armor, 0.12, 0.5);
  leftArm.position.set(-0.42, 1.04, 0);
  const rightArm = limb('player-right-arm', armor, 0.12, 0.5);
  rightArm.position.set(0.42, 1.04, 0);
  const leftLeg = limb('player-left-leg', leather, 0.13, 0.5);
  leftLeg.position.set(-0.16, 0.35, 0);
  const rightLeg = limb('player-right-leg', leather, 0.13, 0.5);
  rightLeg.position.set(0.16, 0.35, 0);
  const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), steel);
  weapon.name = 'player-weapon';
  weapon.position.set(0.08, -0.45, 0.16);
  weapon.rotation.x = -0.2;
  rightArm.add(weapon);

  const attackStartup = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.48, 16, 1, -Math.PI * 0.25, Math.PI * 0.7),
    new THREE.MeshBasicMaterial({ color: 0xffe0a3, transparent: true, opacity: 0.52, side: THREE.DoubleSide, depthWrite: false }),
  );
  attackStartup.name = 'player-attack-startup';
  attackStartup.position.set(0, 0.82, 0.38);
  attackStartup.rotation.set(Math.PI / 2, 0, -0.62);
  attackStartup.visible = false;
  attackStartup.renderOrder = 1;

  const attackArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.035, 6, 18, Math.PI * 1.15),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false }),
  );
  attackArc.name = 'player-attack-arc';
  attackArc.position.set(0, 0.78, 0.35);
  attackArc.rotation.set(Math.PI / 2, 0, -0.25);
  attackArc.visible = false;
  attackArc.renderOrder = 1;

  const weaponDirection = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.42, 6),
    new THREE.MeshBasicMaterial({ color: 0xfff2c2, transparent: true, opacity: 0.62, depthWrite: false }),
  );
  weaponDirection.name = 'player-weapon-direction';
  weaponDirection.position.set(0.32, 0.82, 0.72);
  weaponDirection.rotation.x = Math.PI / 2;
  weaponDirection.visible = false;
  weaponDirection.renderOrder = 1;

  const guardShield = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.72, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x8ec5ff, transparent: true, opacity: 0.36, depthWrite: false }),
  );
  guardShield.name = 'player-guard-shield';
  guardShield.position.set(0, 0.9, 0.58);
  guardShield.visible = false;
  guardShield.renderOrder = 1;

  const dodgeTrail = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 1.05, 7),
    new THREE.MeshBasicMaterial({ color: 0xb6d9ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }),
  );
  dodgeTrail.name = 'player-dodge-trail';
  dodgeTrail.position.set(0, 0.35, -0.45);
  dodgeTrail.rotation.x = Math.PI / 2;
  dodgeTrail.visible = false;
  dodgeTrail.renderOrder = 1;

  const hitFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff4f45, transparent: true, opacity: 0.3, depthWrite: false, wireframe: true }),
  );
  hitFlash.name = 'player-hit-flash';
  hitFlash.position.y = 0.86;
  hitFlash.visible = false;
  hitFlash.renderOrder = 0;

  group.add(body, mantle, head, face, leftArm, rightArm, leftLeg, rightLeg, attackStartup, attackArc, weaponDirection, guardShield, dodgeTrail, hitFlash);
  return { group, rig: { leftArm, rightArm, leftLeg, rightLeg, weapon, attackStartup, attackArc, weaponDirection, guardShield, dodgeTrail, hitFlash } };
};

const limb = (name: string, material: THREE.Material, radius: number, length: number): THREE.Mesh => {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 8), material);
  mesh.name = name;
  return mesh;
};

const posePlayerRig = (rig: PlayerRig, state: PlayerState, time: number): void => {
  rig.weapon.visible = state === 'Attack' || state === 'Guard';
  const isAttackStartup = state === 'Attack' && time < PLAYER_ATTACK_ACTIVE_START;
  rig.attackStartup.visible = isAttackStartup;
  rig.attackArc.visible = state === 'Attack' && !isAttackStartup;
  rig.weaponDirection.visible = state === 'Attack';
  rig.guardShield.visible = state === 'Guard';
  rig.dodgeTrail.visible = state === 'Dodge';
  rig.hitFlash.visible = state === 'HitStun';
  const stride = Math.sin(time * 13) * 0.45;
  rig.leftArm.rotation.set(0, 0, 0.18);
  rig.rightArm.rotation.set(0, 0, -0.18);
  rig.leftLeg.rotation.set(0, 0, 0.05);
  rig.rightLeg.rotation.set(0, 0, -0.05);
  rig.weapon.rotation.set(-0.2, 0, 0);
  rig.attackStartup.scale.setScalar(1);
  rig.attackArc.scale.setScalar(1);
  rig.weaponDirection.scale.setScalar(1);
  rig.guardShield.scale.setScalar(1);
  rig.dodgeTrail.scale.setScalar(1);
  rig.hitFlash.scale.setScalar(1);

  if (state === 'Walk' || state === 'Run') {
    rig.leftArm.rotation.x = -stride * 0.5;
    rig.rightArm.rotation.x = stride * 0.5;
    rig.leftLeg.rotation.x = stride;
    rig.rightLeg.rotation.x = -stride;
  }
  if (state === 'Guard') {
    rig.leftArm.rotation.set(-0.7, 0.2, 0.5);
    rig.rightArm.rotation.set(-0.4, -0.1, -0.28);
    rig.guardShield.scale.setScalar(1 + Math.sin(time * 12) * 0.04);
  }
  if (state === 'Attack') {
    const startup = Math.min(1, time / PLAYER_ATTACK_ACTIVE_START);
    const swing = Math.min(1, Math.max(0, time - PLAYER_ATTACK_ACTIVE_START) / 0.16);
    rig.rightArm.rotation.set(-0.65 - swing * 0.7, -0.18, -0.35);
    rig.leftArm.rotation.set(-0.25, 0.15, 0.28);
    rig.weapon.rotation.set(-0.48 - startup * 0.16 - swing * 0.65, 0, 0);
    rig.attackStartup.scale.setScalar(0.88 + startup * 0.22);
    rig.attackArc.rotation.z = 0.15 + swing * 1.1;
    rig.weaponDirection.rotation.z = -0.1 + swing * 0.22;
  }
  if (state === 'Dodge') {
    rig.leftArm.rotation.x = 0.8;
    rig.rightArm.rotation.x = 0.7;
    rig.leftLeg.rotation.x = -0.7;
    rig.rightLeg.rotation.x = -0.5;
    rig.dodgeTrail.scale.set(1, 1 + Math.min(1, time / 0.12) * 0.5, 1);
  }
  if (state === 'HitStun') {
    rig.hitFlash.scale.setScalar(1 + Math.sin(time * 30) * 0.08);
  }
};
