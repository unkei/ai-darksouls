import * as THREE from 'three';
import { clamp, normalize2, Vec3, vec3 } from '../core/Vector';
import { StateMachine } from '../core/StateMachine';
import { InputState } from '../input/InputState';
import { PLAYER, PlayerState } from './PlayerState';

export class Player {
  readonly mesh: THREE.Group;
  readonly fsm = new StateMachine<PlayerState>('Idle');
  position: Vec3 = vec3(0, 0, 0);
  facing = 0;
  hp = PLAYER.maxHp;
  stamina = PLAYER.maxStamina;
  flasks = PLAYER.maxFlasks;
  echoes = 0;
  pendingAttack = false;
  invulnerable = false;
  private staminaDelay = 0;
  private dodgeDirection = vec3(0, 0, 1);

  constructor() {
    this.mesh = createPlayerMesh();
    this.syncMesh();
  }

  update(delta: number, input: InputState, cameraYaw: number): void {
    this.fsm.tick(delta);
    this.pendingAttack = false;
    this.invulnerable = this.fsm.state === 'Dodge' && this.fsm.timeInState < PLAYER.dodgeIFrameEnd;

    if (this.fsm.state === 'Dead') return;
    this.resolveActionState();

    if (input.heal && this.canAct() && this.flasks > 0 && this.hp < PLAYER.maxHp) {
      this.flasks -= 1;
      this.spendStamina(0);
      this.fsm.set('UseItem');
      return;
    }
    if (input.attack && this.canAct() && this.stamina >= PLAYER.attackCost) {
      this.spendStamina(PLAYER.attackCost);
      this.pendingAttack = true;
      this.fsm.set('Attack');
      return;
    }
    if (input.dodge && this.canAct() && this.stamina >= PLAYER.dodgeCost) {
      this.spendStamina(PLAYER.dodgeCost);
      const move = normalize2(input.move);
      const yaw = cameraYaw + Math.atan2(move.x, move.y || 1);
      this.dodgeDirection = { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) };
      this.fsm.set('Dodge');
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
  }
}

const createPlayerMesh = (): THREE.Group => {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.8, 4, 8), new THREE.MeshStandardMaterial({ color: 0x657184 }));
  body.position.y = 0.85;
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.08), new THREE.MeshStandardMaterial({ color: 0xe8d39a }));
  face.position.set(0, 1.15, 0.34);
  group.add(body, face);
  return group;
};
