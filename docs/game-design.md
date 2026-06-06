# Game Design

This document describes Hollow Keep-specific game design. Reusable guidance for structuring game specifications belongs in [Game Specification Guide](game-specification-guide.md).

## Pillars

- Small, dense dungeon with learnable enemy placement.
- Checkpoint retry loop with fair combat tells.
- HP, healing, stamina, and dropped resource risk management.
- Shortcut opening that reduces repeat-route friction.
- One boss encounter that rewards spacing, blocking, dodging, and pattern learning.
- Opening, game over, clear, and ending presentation states around the dungeon loop.

## MVP Scope

The MVP is an original low-poly dark fantasy action game named **Hollow Keep**. It is inspired by soulslike structure, not by protected names, characters, maps, logos, or enemy designs.

The player explores a compact ruined keep containing:

- Two bonfire-like checkpoints called cinder shrines.
- Three minor enemy archetypes: Grunt, Shield, and Fast.
- One boss: the Ashen Warden.
- One shortcut door linking the entry lane to the arena approach.
- A dropped resource called echoes that can be recovered once after death.

Out of scope for the MVP:

- Online multiplayer.
- Large RPG stat trees.
- Large equipment sets.
- Parry, backstab, and complex animation cancel systems.
- Save slots and multiple stages.

## Player State Machine

Player states:

- `Idle`
- `Walk`
- `Run`
- `Attack`
- `Dodge`
- `Guard`
- `HitStun`
- `UseItem`
- `Dead`
- `Interact`

Rules:

- Attacking locks movement and dodge until recovery ends.
- Dodge grants a short invulnerability window.
- Attack, dodge, and guard consume stamina.
- Insufficient stamina prevents those actions.
- Healing locks the player briefly.
- Death enters a game over presentation; retry respawns the player at the active shrine and drops carried echoes.
- Attack and dodge inputs are not buffered in the MVP; missed timing is intentional and teachable.

## Combat Tuning

- Player HP: 100.
- Player stamina: 100, regenerates after a short delay.
- Healing flask: 3 uses, restores 35 HP, refilled at cinder shrines.
- Attack cost: 22 stamina.
- Dodge cost: 28 stamina.
- Guard hold drains stamina while active and reduces incoming damage.

Enemies use telegraph, active, and recovery windows. Attacks should be readable and avoidable after learning.

## Progression Flow

- `Opening`: title/start presentation. Interact enters gameplay.
- `Playing`: normal exploration and combat.
- `GameOver`: entered on player death. Interact retries from the active cinder shrine.
- `Clear`: entered when the Ashen Warden is defeated. Interact advances to the ending.
- `Ending`: staff roll presentation. Credits include `unno`.

## Collision and Camera Readability

Dungeon blockers that visually read as solid, including interior wall segments and pillars, must also block player and enemy circle collision. Enemies use the same dungeon collision resolver as the player after AI movement.

When the camera-to-player line is obstructed by dungeon wall or pillar meshes, only those obstructing meshes fade to a semi-transparent material until the player is visible again.
