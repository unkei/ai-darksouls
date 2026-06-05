export type PlayerState = 'Idle' | 'Walk' | 'Run' | 'Attack' | 'Dodge' | 'Guard' | 'HitStun' | 'UseItem' | 'Dead' | 'Interact';

export const PLAYER = {
  maxHp: 100,
  maxStamina: 100,
  attackCost: 22,
  dodgeCost: 28,
  guardDrainPerSecond: 18,
  staminaRegenPerSecond: 36,
  staminaRegenDelay: 0.45,
  walkSpeed: 3.2,
  runSpeed: 5.0,
  attackDuration: 0.5,
  dodgeDuration: 0.42,
  dodgeIFrameEnd: 0.25,
  hitStunDuration: 0.35,
  healDuration: 0.85,
  healAmount: 35,
  maxFlasks: 3,
};
